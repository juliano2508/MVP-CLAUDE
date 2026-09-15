from datetime import date, datetime, time, timedelta

from sqlalchemy.orm import Session

from app.models import Appointment, AvailabilitySlot, BlockedSlot, BusinessPage, DiaSemana, Service, StatusAppointment


def _intervals_overlap(start_a: time, end_a: time, start_b: time, end_b: time) -> bool:
    return start_a < end_b and start_b < end_a


def compute_available_slots(
    db: Session,
    page: BusinessPage,
    service: Service,
    target_date: date,
    exclude_appointment_id: int | None = None,
) -> list[time]:
    if target_date < date.today():
        return []

    dia_semana = DiaSemana(target_date.weekday())  # Monday=0 .. Sunday=6, matches DiaSemana enum
    availability_slots = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.business_page_id == page.id, AvailabilitySlot.dia_semana == dia_semana)
        .all()
    )
    if not availability_slots:
        return []

    appointments_query = db.query(Appointment).filter(
        Appointment.business_page_id == page.id,
        Appointment.data == target_date,
        Appointment.status != StatusAppointment.cancelado,
    )
    if exclude_appointment_id is not None:
        appointments_query = appointments_query.filter(Appointment.id != exclude_appointment_id)
    appointments = appointments_query.all()
    blocked_slots = (
        db.query(BlockedSlot)
        .filter(BlockedSlot.business_page_id == page.id, BlockedSlot.data == target_date)
        .all()
    )
    busy_intervals = [(a.hora_inicio, a.hora_fim) for a in appointments] + [
        (b.hora_inicio, b.hora_fim) for b in blocked_slots
    ]

    duration = timedelta(minutes=service.duracao_minutos)
    now = datetime.now()
    slots: list[time] = []

    for availability in availability_slots:
        current = datetime.combine(target_date, availability.hora_inicio)
        window_end = datetime.combine(target_date, availability.hora_fim)
        while current + duration <= window_end:
            slot_start = current.time()
            slot_end = (current + duration).time()
            if target_date == date.today() and current <= now:
                current += duration
                continue
            if not any(_intervals_overlap(slot_start, slot_end, b_start, b_end) for b_start, b_end in busy_intervals):
                slots.append(slot_start)
            current += duration

    return sorted(slots)


def is_slot_available(
    db: Session,
    page: BusinessPage,
    service: Service,
    target_date: date,
    start_time: time,
    exclude_appointment_id: int | None = None,
) -> bool:
    return start_time in compute_available_slots(db, page, service, target_date, exclude_appointment_id)

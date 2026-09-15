from datetime import date, datetime, time, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Appointment, BusinessPage, Service
from app.notifications import send_appointment_confirmation
from app.scheduling import compute_available_slots, is_slot_available
from app.schemas import AppointmentCreate, AppointmentOut, PublicBusinessPageOut, ServiceOut

router = APIRouter(prefix="/p", tags=["public"])


def _get_business_page(db: Session, slug: str) -> BusinessPage:
    page = db.query(BusinessPage).filter(BusinessPage.slug == slug).first()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Página não encontrada")
    return page


def _get_active_service(db: Session, page: BusinessPage, service_id: int) -> Service:
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.business_page_id == page.id, Service.ativo.is_(True))
        .first()
    )
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    return service


@router.get("/{slug}", response_model=PublicBusinessPageOut)
def get_public_business_page(slug: str, db: Session = Depends(get_db)):
    page = _get_business_page(db, slug)

    return PublicBusinessPageOut(
        nome_negocio=page.nome_negocio,
        bio=page.bio,
        foto_url=page.foto_url,
        tema=page.tema,
        slug=page.slug,
        services=[ServiceOut.model_validate(s) for s in page.services if s.ativo],
    )


@router.get("/{slug}/services/{service_id}/available-slots", response_model=list[time])
def get_available_slots(slug: str, service_id: int, data: date, db: Session = Depends(get_db)):
    page = _get_business_page(db, slug)
    service = _get_active_service(db, page, service_id)
    return compute_available_slots(db, page, service, data)


@router.post("/{slug}/appointments", response_model=AppointmentOut, status_code=status.HTTP_201_CREATED)
def create_appointment(
    slug: str,
    payload: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    page = _get_business_page(db, slug)
    service = _get_active_service(db, page, payload.service_id)

    if not is_slot_available(db, page, service, payload.data, payload.hora_inicio):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Horário não está mais disponível. Escolha outro horário.",
        )

    start_dt = datetime.combine(payload.data, payload.hora_inicio)
    end_dt = start_dt + timedelta(minutes=service.duracao_minutos)

    appointment = Appointment(
        business_page_id=page.id,
        service_id=service.id,
        cliente_nome=payload.cliente_nome,
        cliente_telefone=payload.cliente_telefone,
        cliente_email=payload.cliente_email,
        data=payload.data,
        hora_inicio=payload.hora_inicio,
        hora_fim=end_dt.time(),
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    background_tasks.add_task(
        send_appointment_confirmation,
        cliente_nome=payload.cliente_nome,
        cliente_email=payload.cliente_email,
        nome_negocio=page.nome_negocio,
        servico_nome=service.nome,
        data_agendamento=payload.data,
        hora_inicio=payload.hora_inicio,
    )

    return appointment

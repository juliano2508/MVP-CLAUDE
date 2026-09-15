import enum
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Date,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Time,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Plano(str, enum.Enum):
    free = "free"
    pago = "pago"


class StatusAssinatura(str, enum.Enum):
    trial = "trial"
    ativa = "ativa"
    expirada = "expirada"
    cancelada = "cancelada"


class DiaSemana(int, enum.Enum):
    segunda = 0
    terca = 1
    quarta = 2
    quinta = 3
    sexta = 4
    sabado = 5
    domingo = 6


class StatusAppointment(str, enum.Enum):
    confirmado = "confirmado"
    cancelado = "cancelado"
    concluido = "concluido"


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    nome: Mapped[str] = mapped_column(String(120), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    senha_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    plano: Mapped[Plano] = mapped_column(Enum(Plano), default=Plano.free)
    status_assinatura: Mapped[StatusAssinatura] = mapped_column(
        Enum(StatusAssinatura), default=StatusAssinatura.trial
    )
    trial_fim: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    business_page: Mapped["BusinessPage | None"] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


class BusinessPage(Base):
    __tablename__ = "business_pages"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"), unique=True, nullable=False)
    slug: Mapped[str] = mapped_column(String(160), unique=True, index=True, nullable=False)
    nome_negocio: Mapped[str] = mapped_column(String(160), nullable=False)
    bio: Mapped[str | None] = mapped_column(String(1000), nullable=True)
    foto_url: Mapped[str | None] = mapped_column(String(500), nullable=True)
    tema: Mapped[str] = mapped_column(String(50), default="padrao")

    user: Mapped["User"] = relationship(back_populates="business_page")
    services: Mapped[list["Service"]] = relationship(
        back_populates="business_page", cascade="all, delete-orphan"
    )
    availability_slots: Mapped[list["AvailabilitySlot"]] = relationship(
        back_populates="business_page", cascade="all, delete-orphan"
    )
    blocked_slots: Mapped[list["BlockedSlot"]] = relationship(
        back_populates="business_page", cascade="all, delete-orphan"
    )
    appointments: Mapped[list["Appointment"]] = relationship(
        back_populates="business_page", cascade="all, delete-orphan"
    )


class Service(Base):
    __tablename__ = "services"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_page_id: Mapped[int] = mapped_column(ForeignKey("business_pages.id"), nullable=False)
    nome: Mapped[str] = mapped_column(String(160), nullable=False)
    duracao_minutos: Mapped[int] = mapped_column(Integer, nullable=False)
    preco: Mapped[float] = mapped_column(Float, nullable=False)
    ativo: Mapped[bool] = mapped_column(Boolean, default=True)

    business_page: Mapped["BusinessPage"] = relationship(back_populates="services")


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_page_id: Mapped[int] = mapped_column(ForeignKey("business_pages.id"), nullable=False)
    dia_semana: Mapped[DiaSemana] = mapped_column(Enum(DiaSemana), nullable=False)
    hora_inicio: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    hora_fim: Mapped[datetime.time] = mapped_column(Time, nullable=False)

    business_page: Mapped["BusinessPage"] = relationship(back_populates="availability_slots")


class BlockedSlot(Base):
    __tablename__ = "blocked_slots"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_page_id: Mapped[int] = mapped_column(ForeignKey("business_pages.id"), nullable=False)
    data: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    hora_fim: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    motivo: Mapped[str | None] = mapped_column(String(255), nullable=True)

    business_page: Mapped["BusinessPage"] = relationship(back_populates="blocked_slots")


class Appointment(Base):
    __tablename__ = "appointments"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    business_page_id: Mapped[int] = mapped_column(ForeignKey("business_pages.id"), nullable=False)
    service_id: Mapped[int] = mapped_column(ForeignKey("services.id"), nullable=False)
    cliente_nome: Mapped[str] = mapped_column(String(160), nullable=False)
    cliente_telefone: Mapped[str] = mapped_column(String(30), nullable=False)
    cliente_email: Mapped[str] = mapped_column(String(255), nullable=False)

    data: Mapped[datetime.date] = mapped_column(Date, nullable=False)
    hora_inicio: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    hora_fim: Mapped[datetime.time] = mapped_column(Time, nullable=False)
    status: Mapped[StatusAppointment] = mapped_column(
        Enum(StatusAppointment), default=StatusAppointment.confirmado
    )
    criado_em: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    business_page: Mapped["BusinessPage"] = relationship(back_populates="appointments")
    service: Mapped["Service"] = relationship()

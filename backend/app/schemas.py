from datetime import date, datetime, time

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models import DiaSemana, Plano, StatusAppointment, StatusAssinatura


# ---- Auth / User ----


class UserCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=120)
    email: EmailStr
    senha: str = Field(min_length=6, max_length=128)


class UserOut(BaseModel):
    id: int
    nome: str
    email: EmailStr
    plano: Plano
    status_assinatura: StatusAssinatura
    trial_fim: datetime | None
    criado_em: datetime

    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


# ---- BusinessPage ----


class BusinessPageCreate(BaseModel):
    nome_negocio: str = Field(min_length=1, max_length=160)
    bio: str | None = Field(default=None, max_length=1000)
    foto_url: str | None = None
    tema: str = "padrao"


class BusinessPageUpdate(BaseModel):
    nome_negocio: str | None = Field(default=None, min_length=1, max_length=160)
    bio: str | None = Field(default=None, max_length=1000)
    foto_url: str | None = None
    tema: str | None = None


class BusinessPageOut(BaseModel):
    id: int
    slug: str
    nome_negocio: str
    bio: str | None
    foto_url: str | None
    tema: str

    model_config = ConfigDict(from_attributes=True)


# ---- Service ----


class ServiceCreate(BaseModel):
    nome: str = Field(min_length=1, max_length=160)
    duracao_minutos: int = Field(gt=0, le=24 * 60)
    preco: float = Field(ge=0)
    ativo: bool = True


class ServiceUpdate(BaseModel):
    nome: str | None = Field(default=None, min_length=1, max_length=160)
    duracao_minutos: int | None = Field(default=None, gt=0, le=24 * 60)
    preco: float | None = Field(default=None, ge=0)
    ativo: bool | None = None


class ServiceOut(BaseModel):
    id: int
    nome: str
    duracao_minutos: int
    preco: float
    ativo: bool

    model_config = ConfigDict(from_attributes=True)


# ---- AvailabilitySlot ----


class AvailabilitySlotCreate(BaseModel):
    dia_semana: DiaSemana
    hora_inicio: time
    hora_fim: time


class AvailabilitySlotOut(BaseModel):
    id: int
    dia_semana: DiaSemana
    hora_inicio: time
    hora_fim: time

    model_config = ConfigDict(from_attributes=True)


# ---- Public page ----


class PublicBusinessPageOut(BaseModel):
    nome_negocio: str
    bio: str | None
    foto_url: str | None
    tema: str
    slug: str
    services: list[ServiceOut]

    model_config = ConfigDict(from_attributes=True)


# ---- Appointment (Fluxo 2 - agendamento pelo cliente final) ----


class AppointmentCreate(BaseModel):
    service_id: int
    data: date
    hora_inicio: time
    cliente_nome: str = Field(min_length=1, max_length=160)
    cliente_telefone: str = Field(min_length=1, max_length=30)
    cliente_email: EmailStr


class AppointmentOut(BaseModel):
    id: int
    service_id: int
    data: date
    hora_inicio: time
    hora_fim: time
    cliente_nome: str
    cliente_telefone: str
    cliente_email: EmailStr
    status: StatusAppointment

    model_config = ConfigDict(from_attributes=True)

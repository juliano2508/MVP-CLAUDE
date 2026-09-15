from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.deps import get_current_user
from app.models import AvailabilitySlot, BusinessPage, Service, User
from app.schemas import (
    AvailabilitySlotCreate,
    AvailabilitySlotOut,
    BusinessPageCreate,
    BusinessPageOut,
    BusinessPageUpdate,
    ServiceCreate,
    ServiceOut,
    ServiceUpdate,
)
from app.utils import unique_slug

router = APIRouter(prefix="/me/business-page", tags=["onboarding"])


def _get_owned_business_page(db: Session, current_user: User) -> BusinessPage:
    page = db.query(BusinessPage).filter(BusinessPage.user_id == current_user.id).first()
    if page is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Página ainda não criada. Crie a página primeiro.",
        )
    return page


# ---- Business page ----


@router.post("", response_model=BusinessPageOut, status_code=status.HTTP_201_CREATED)
def create_business_page(
    payload: BusinessPageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(BusinessPage).filter(BusinessPage.user_id == current_user.id).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Página já existe para este usuário"
        )

    page = BusinessPage(
        user_id=current_user.id,
        slug=unique_slug(db, payload.nome_negocio),
        nome_negocio=payload.nome_negocio,
        bio=payload.bio,
        foto_url=payload.foto_url,
        tema=payload.tema,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return page


@router.get("", response_model=BusinessPageOut)
def get_business_page(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return _get_owned_business_page(db, current_user)


@router.patch("", response_model=BusinessPageOut)
def update_business_page(
    payload: BusinessPageUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_owned_business_page(db, current_user)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(page, field, value)
    db.commit()
    db.refresh(page)
    return page


# ---- Services ----


@router.post("/services", response_model=ServiceOut, status_code=status.HTTP_201_CREATED)
def create_service(
    payload: ServiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_owned_business_page(db, current_user)
    service = Service(business_page_id=page.id, **payload.model_dump())
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.get("/services", response_model=list[ServiceOut])
def list_services(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    page = _get_owned_business_page(db, current_user)
    return page.services


def _get_owned_service(db: Session, current_user: User, service_id: int) -> Service:
    page = _get_owned_business_page(db, current_user)
    service = (
        db.query(Service)
        .filter(Service.id == service_id, Service.business_page_id == page.id)
        .first()
    )
    if service is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Serviço não encontrado")
    return service


@router.patch("/services/{service_id}", response_model=ServiceOut)
def update_service(
    service_id: int,
    payload: ServiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = _get_owned_service(db, current_user, service_id)
    data = payload.model_dump(exclude_unset=True)
    for field, value in data.items():
        setattr(service, field, value)
    db.commit()
    db.refresh(service)
    return service


@router.delete("/services/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    service = _get_owned_service(db, current_user, service_id)
    db.delete(service)
    db.commit()


# ---- Availability ----


@router.post(
    "/availability", response_model=AvailabilitySlotOut, status_code=status.HTTP_201_CREATED
)
def create_availability_slot(
    payload: AvailabilitySlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.hora_inicio >= payload.hora_fim:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="hora_inicio deve ser anterior a hora_fim",
        )
    page = _get_owned_business_page(db, current_user)
    slot = AvailabilitySlot(business_page_id=page.id, **payload.model_dump())
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return slot


@router.get("/availability", response_model=list[AvailabilitySlotOut])
def list_availability_slots(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    page = _get_owned_business_page(db, current_user)
    return page.availability_slots


@router.delete("/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_availability_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    page = _get_owned_business_page(db, current_user)
    slot = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.id == slot_id, AvailabilitySlot.business_page_id == page.id)
        .first()
    )
    if slot is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Disponibilidade não encontrada"
        )
    db.delete(slot)
    db.commit()

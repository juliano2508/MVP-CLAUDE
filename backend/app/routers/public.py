from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import BusinessPage
from app.schemas import PublicBusinessPageOut, ServiceOut

router = APIRouter(prefix="/p", tags=["public"])


@router.get("/{slug}", response_model=PublicBusinessPageOut)
def get_public_business_page(slug: str, db: Session = Depends(get_db)):
    page = db.query(BusinessPage).filter(BusinessPage.slug == slug).first()
    if page is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Página não encontrada")

    return PublicBusinessPageOut(
        nome_negocio=page.nome_negocio,
        bio=page.bio,
        foto_url=page.foto_url,
        tema=page.tema,
        slug=page.slug,
        services=[ServiceOut.model_validate(s) for s in page.services if s.ativo],
    )

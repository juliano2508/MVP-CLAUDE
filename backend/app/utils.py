import re
import unicodedata

from sqlalchemy.orm import Session

from app.models import BusinessPage


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("ascii")
    text = text.lower().strip()
    text = re.sub(r"[^a-z0-9]+", "-", text).strip("-")
    return text or "pagina"


def unique_slug(db: Session, base_text: str) -> str:
    base = slugify(base_text)
    slug = base
    counter = 1
    while db.query(BusinessPage).filter(BusinessPage.slug == slug).first() is not None:
        counter += 1
        slug = f"{base}-{counter}"
    return slug

import math
from datetime import datetime

import stripe
from sqlalchemy.orm import Session

from app.config import settings
from app.models import Plano, StatusAssinatura, User


def _stripe_configured() -> bool:
    return bool(settings.stripe_secret_key and settings.stripe_price_id)


def is_subscription_active(user: User) -> bool:
    if user.status_assinatura == StatusAssinatura.ativa:
        return True
    if user.status_assinatura == StatusAssinatura.trial and user.trial_fim:
        return datetime.utcnow() < user.trial_fim
    return False


def dias_restantes_trial(user: User) -> int | None:
    if user.status_assinatura != StatusAssinatura.trial or not user.trial_fim:
        return None
    segundos_restantes = (user.trial_fim - datetime.utcnow()).total_seconds()
    dias = math.ceil(segundos_restantes / 86400)
    return max(dias, 0)


def create_checkout_session(db: Session, user: User) -> str:
    if not _stripe_configured():
        # Modo demo: sem chamada real ao Stripe, ativa a assinatura na hora.
        user.plano = Plano.pago
        user.status_assinatura = StatusAssinatura.ativa
        db.commit()
        return f"{settings.frontend_url}/painel/assinatura?sucesso=1&modo=demo"

    stripe.api_key = settings.stripe_secret_key
    session = stripe.checkout.Session.create(
        mode="subscription",
        line_items=[{"price": settings.stripe_price_id, "quantity": 1}],
        customer=user.stripe_customer_id,
        customer_email=None if user.stripe_customer_id else user.email,
        client_reference_id=str(user.id),
        metadata={"user_id": str(user.id)},
        success_url=f"{settings.frontend_url}/painel/assinatura?sucesso=1",
        cancel_url=f"{settings.frontend_url}/painel/assinatura?cancelado=1",
    )
    return session.url


def cancel_subscription(db: Session, user: User) -> None:
    if _stripe_configured() and user.stripe_subscription_id:
        stripe.api_key = settings.stripe_secret_key
        stripe.Subscription.delete(user.stripe_subscription_id)

    user.status_assinatura = StatusAssinatura.cancelada
    user.plano = Plano.free
    db.commit()


def handle_stripe_event(db: Session, event: dict) -> None:
    event_type = event.get("type")
    data = event.get("data", {}).get("object", {})

    if event_type == "checkout.session.completed":
        user_id = data.get("client_reference_id") or data.get("metadata", {}).get("user_id")
        if not user_id:
            return
        user = db.query(User).filter(User.id == int(user_id)).first()
        if user is None:
            return
        user.stripe_customer_id = data.get("customer")
        user.stripe_subscription_id = data.get("subscription")
        user.plano = Plano.pago
        user.status_assinatura = StatusAssinatura.ativa
        db.commit()

    elif event_type == "customer.subscription.deleted":
        user = db.query(User).filter(User.stripe_subscription_id == data.get("id")).first()
        if user is None:
            return
        user.status_assinatura = StatusAssinatura.cancelada
        user.plano = Plano.free
        db.commit()

    elif event_type == "invoice.payment_failed":
        user = db.query(User).filter(User.stripe_subscription_id == data.get("subscription")).first()
        if user is None:
            return
        user.status_assinatura = StatusAssinatura.expirada
        db.commit()

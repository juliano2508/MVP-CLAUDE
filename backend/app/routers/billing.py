import json

import stripe
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session

from app.billing import (
    cancel_subscription,
    create_checkout_session,
    dias_restantes_trial,
    handle_stripe_event,
    is_subscription_active,
)
from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models import User
from app.schemas import BillingStatusOut, CheckoutSessionOut

router = APIRouter(prefix="/billing", tags=["billing"])


def _status_out(user: User) -> BillingStatusOut:
    return BillingStatusOut(
        plano=user.plano,
        status_assinatura=user.status_assinatura,
        trial_fim=user.trial_fim,
        dias_restantes_trial=dias_restantes_trial(user),
        assinatura_ativa=is_subscription_active(user),
    )


@router.get("/status", response_model=BillingStatusOut)
def get_billing_status(current_user: User = Depends(get_current_user)):
    return _status_out(current_user)


@router.post("/checkout", response_model=CheckoutSessionOut)
def checkout(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    url = create_checkout_session(db, current_user)
    return CheckoutSessionOut(checkout_url=url)


@router.post("/cancel", response_model=BillingStatusOut)
def cancel(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    cancel_subscription(db, current_user)
    return _status_out(current_user)


@router.post("/webhook", status_code=status.HTTP_200_OK)
async def webhook(request: Request, db: Session = Depends(get_db)):
    payload = await request.body()
    signature = request.headers.get("stripe-signature")

    if settings.stripe_webhook_secret:
        try:
            event = stripe.Webhook.construct_event(payload, signature, settings.stripe_webhook_secret)
        except (ValueError, stripe.SignatureVerificationError):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Assinatura inválida")
    else:
        try:
            event = json.loads(payload)
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Payload inválido")

    handle_stripe_event(db, event)
    return {"recebido": True}

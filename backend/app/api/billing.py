from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.billing import (
    PLANS,
    create_checkout_session,
    create_portal_session,
    handle_webhook_event,
)

router = APIRouter()


@router.get("/plans")
def list_plans():
    return {
        name: {
            "name": plan["name"],
            "price_monthly_cad": plan["price_monthly"] / 100 if plan["price_monthly"] else 0,
            "scores_per_month": "illimité" if plan["scores_per_month"] == -1 else plan["scores_per_month"],
            "features": plan["features"],
        }
        for name, plan in PLANS.items()
    }


@router.post("/checkout/{plan}")
def checkout(
    plan: str,
    current_user: User = Depends(get_current_user),
):
    """Crée une session Stripe Checkout pour l'utilisateur authentifié."""
    if plan not in ("pro", "premium"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    try:
        url = create_checkout_session(
            user_id=str(current_user.id),
            plan=plan,
            success_url=f"{settings.frontend_url}/billing/success?plan={plan}",
            cancel_url=f"{settings.frontend_url}/pricing",
            user_email=current_user.email,
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe error: {e}")

    return {"checkout_url": url}


@router.post("/portal")
def portal(
    current_user: User = Depends(get_current_user),
):
    """Portail Stripe pour gérer l'abonnement."""
    if not current_user.stripe_customer_id:
        raise HTTPException(status_code=404, detail="Pas d'abonnement actif")

    url = create_portal_session(
        customer_id=current_user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return {"portal_url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook Stripe — met à jour le plan en DB après paiement."""
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")

    try:
        result = handle_webhook_event(payload, sig)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

    if result["action"] == "activate":
        user = db.get(User, uuid.UUID(result["user_id"]))
        if user:
            user.stripe_customer_id = result["customer_id"]
            user.stripe_subscription_id = result["subscription_id"]
            user.plan = result["plan"]
            db.commit()

    elif result["action"] in ("deactivate", "payment_failed"):
        user = db.scalars(
            select(User).where(User.stripe_customer_id == result["customer_id"])
        ).first()
        if user:
            user.plan = "free"
            if result["action"] == "deactivate":
                user.stripe_subscription_id = None
            db.commit()

    return {"status": "ok", "action": result["action"]}

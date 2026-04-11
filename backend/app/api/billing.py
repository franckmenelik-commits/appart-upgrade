import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models.user import User
from app.services.billing import (
    PLANS,
    create_checkout_session,
    create_portal_session,
    handle_webhook_event,
)

router = APIRouter()


@router.get("/plans")
def list_plans():
    """Liste les plans disponibles."""
    return {
        name: {
            "name": plan["name"],
            "price_monthly_cad": plan["price_monthly"] / 100 if plan["price_monthly"] else 0,
            "scores_per_month": "illimité" if plan["scores_per_month"] == -1 else plan["scores_per_month"],
            "features": plan["features"],
        }
        for name, plan in PLANS.items()
    }


@router.post("/checkout/{user_id}/{plan}")
async def checkout(user_id: uuid.UUID, plan: str):
    """Crée une session Stripe Checkout."""
    if plan not in ("pro", "premium"):
        raise HTTPException(status_code=400, detail="Plan invalide")

    url = await create_checkout_session(
        user_id=str(user_id),
        plan=plan,
        success_url=f"{settings.frontend_url}/billing/success?plan={plan}",
        cancel_url=f"{settings.frontend_url}/billing/cancel",
    )
    return {"checkout_url": url}


@router.post("/portal/{user_id}")
async def portal(user_id: uuid.UUID, db: Session = Depends(get_db)):
    """Redirige vers le portail de gestion Stripe."""
    user = db.get(User, user_id)
    if not user or not user.stripe_customer_id:
        raise HTTPException(status_code=404, detail="Pas d'abonnement actif")

    url = await create_portal_session(
        customer_id=user.stripe_customer_id,
        return_url=f"{settings.frontend_url}/dashboard",
    )
    return {"portal_url": url}


@router.post("/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Endpoint pour les webhooks Stripe."""
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

    elif result["action"] == "deactivate":
        from sqlalchemy import select
        user = db.scalars(
            select(User).where(User.stripe_customer_id == result["customer_id"])
        ).first()
        if user:
            user.plan = "free"
            user.stripe_subscription_id = None
            db.commit()

    return {"status": "ok", "action": result["action"]}

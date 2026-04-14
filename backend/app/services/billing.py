"""
Intégration Stripe — Vivenza.

Plans :
- Free  : 5 scores/mois, manuel
- Pro   : 4.99 CAD (paiement unique) — scores illimités, scraping auto, email alerts
- Premium : 19.99 CAD/mois — tout Pro + Google Maps, push alerts, API
"""

from __future__ import annotations

import stripe

from app.config import settings

stripe.api_key = settings.stripe_secret_key

PLANS = {
    "free": {
        "name": "Gratuit",
        "price_monthly": 0,
        "scores_per_month": 5,
        "features": ["5 scores/mois", "Entrée manuelle"],
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 499,
        "scores_per_month": -1,
        "features": [
            "Scores illimités",
            "Scraping Centris + Kijiji auto",
            "Extension Chrome Marketplace",
            "Alertes email (score 70+)",
        ],
    },
    "premium": {
        "name": "Premium",
        "price_monthly": 1999,
        "scores_per_month": -1,
        "features": [
            "Tout Pro +",
            "Analyse d'images IA",
            "Calcul de trajet Google Maps",
            "Alertes push temps réel",
            "Accès API",
        ],
    },
}


def create_checkout_session(
    user_id: str,
    plan: str,
    success_url: str,
    cancel_url: str,
    user_email: str | None = None,
) -> str:
    """Crée une session Stripe Checkout — retourne l'URL de paiement."""
    if plan not in ("pro", "premium"):
        raise ValueError(f"Plan invalide: {plan}")

    plan_data = PLANS[plan]

    session = stripe.checkout.Session.create(
        mode="payment",
        customer_email=user_email,
        metadata={"user_id": user_id, "plan": plan},
        line_items=[
            {
                "price_data": {
                    "currency": "cad",
                    "product_data": {
                        "name": f"Vivenza {plan_data['name']}",
                        "description": " · ".join(plan_data["features"]),
                    },
                    "unit_amount": plan_data["price_monthly"],
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return session.url



def handle_webhook_event(payload: bytes, sig_header: str) -> dict:
    """Traite les webhooks Stripe et retourne l'action à effectuer."""
    event = stripe.Webhook.construct_event(
        payload,
        sig_header,
        settings.stripe_webhook_secret,
    )

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        return {
            "action": "activate",
            "user_id": session["metadata"]["user_id"],
            "plan": session["metadata"]["plan"],
            "customer_id": session["customer"],
        }

    return {"action": "ignored", "type": event["type"]}


def check_user_quota(plan: str, scores_used: int) -> bool:
    """Vérifie si l'utilisateur peut encore scorer."""
    limit = PLANS.get(plan, PLANS["free"])["scores_per_month"]
    return limit == -1 or scores_used < limit


def get_plan_features(plan: str) -> dict:
    return PLANS.get(plan, PLANS["free"])

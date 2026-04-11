"""
Intégration Stripe — Gestion des abonnements.

== Modèle de monétisation ==

GRATUIT (Free) :
  - 5 scores/mois (pour tester le produit)
  - Sources : entrée manuelle uniquement
  - Pas de notifications

PRO (9.99$/mois) :
  - Scores illimités
  - Scraping Centris automatique (toutes les 6h)
  - Extension Chrome Marketplace activée
  - Notifications par email des top scores (70+)

PREMIUM (19.99$/mois) :
  - Tout Pro +
  - Analyse d'images par Claude Vision
  - Calcul de trajet via Google Maps
  - Alertes push temps réel (score 80+)
  - Accès API pour automatisations personnelles
  - Support prioritaire

== Pourquoi ces tiers marchent ==

Le Free hook l'utilisateur avec 5 scores — assez pour voir la valeur,
pas assez pour remplacer la recherche manuelle. Le passage à Pro est
naturel quand l'utilisateur veut automatiser. Le Premium se justifie
par l'analyse d'images (coûte en tokens Claude) et l'API Google Maps.
"""

import stripe

from app.config import settings

# Stripe setup
stripe.api_key = settings.stripe_secret_key

# Plan IDs — à créer dans le dashboard Stripe ou via l'API
PLANS = {
    "free": {
        "name": "Gratuit",
        "price_monthly": 0,
        "scores_per_month": 5,
        "features": ["5 scores/mois", "Entrée manuelle"],
    },
    "pro": {
        "name": "Pro",
        "price_monthly": 999,  # en cents
        "scores_per_month": -1,  # illimité
        "features": [
            "Scores illimités",
            "Scraping Centris auto",
            "Extension Marketplace",
            "Notifications email",
        ],
    },
    "premium": {
        "name": "Premium",
        "price_monthly": 1999,  # en cents
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


async def create_checkout_session(
    user_id: str,
    plan: str,
    success_url: str,
    cancel_url: str,
) -> str:
    """Crée une session Stripe Checkout et retourne l'URL de paiement."""
    if plan not in ("pro", "premium"):
        raise ValueError("Plan invalide — seuls 'pro' et 'premium' sont payants")

    session = stripe.checkout.Session.create(
        mode="subscription",
        customer_email=None,  # sera rempli par Stripe
        metadata={"user_id": user_id, "plan": plan},
        line_items=[
            {
                "price_data": {
                    "currency": "cad",
                    "product_data": {
                        "name": f"AppartUpgrade {PLANS[plan]['name']}",
                        "description": " | ".join(PLANS[plan]["features"]),
                    },
                    "unit_amount": PLANS[plan]["price_monthly"],
                    "recurring": {"interval": "month"},
                },
                "quantity": 1,
            }
        ],
        success_url=success_url,
        cancel_url=cancel_url,
    )
    return session.url


async def create_portal_session(customer_id: str, return_url: str) -> str:
    """Crée un lien vers le portail Stripe pour gérer l'abonnement."""
    session = stripe.billing_portal.Session.create(
        customer=customer_id,
        return_url=return_url,
    )
    return session.url


def handle_webhook_event(payload: bytes, sig_header: str) -> dict:
    """Traite un webhook Stripe (paiement réussi, annulation, etc.)."""
    event = stripe.Webhook.construct_event(
        payload,
        sig_header,
        settings.stripe_webhook_secret,
    )

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        user_id = session["metadata"]["user_id"]
        plan = session["metadata"]["plan"]
        customer_id = session["customer"]
        subscription_id = session["subscription"]
        return {
            "action": "activate",
            "user_id": user_id,
            "plan": plan,
            "customer_id": customer_id,
            "subscription_id": subscription_id,
        }

    if event["type"] == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        customer_id = subscription["customer"]
        return {
            "action": "deactivate",
            "customer_id": customer_id,
        }

    if event["type"] == "invoice.payment_failed":
        invoice = event["data"]["object"]
        customer_id = invoice["customer"]
        return {
            "action": "payment_failed",
            "customer_id": customer_id,
        }

    return {"action": "ignored", "type": event["type"]}


def check_user_quota(plan: str, scores_used: int) -> bool:
    """Vérifie si l'utilisateur peut encore scorer (quota mensuel)."""
    limit = PLANS.get(plan, PLANS["free"])["scores_per_month"]
    if limit == -1:
        return True
    return scores_used < limit


def get_plan_features(plan: str) -> dict:
    """Retourne les features d'un plan."""
    return PLANS.get(plan, PLANS["free"])

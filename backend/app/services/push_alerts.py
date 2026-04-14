"""
Push alerts — Vivenza Premium.

Deux canaux gratuits et illimités :
1. ntfy.sh      — push sur iOS, Android, Desktop (app gratuite)
2. Web Push     — notification navigateur native (PWA)

Aucun coût, aucune limite.

Setup ntfy.sh pour l'utilisateur :
  1. Installe l'app "ntfy" sur iOS ou Android
  2. Subscribe au topic "vivenza-{user_id[:8]}"
  3. Configure son topic dans son profil Vivenza
"""

from __future__ import annotations

import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

NTFY_BASE = "https://ntfy.sh"


async def send_ntfy_push(
    topic: str,
    title: str,
    message: str,
    score: int,
    listing_url: str,
    priority: str = "high",
) -> bool:
    """
    Envoie une notification push via ntfy.sh — gratuit, illimité.

    L'utilisateur installe l'app ntfy et subscribe au topic "vivenza-XXXX".
    """
    if not topic:
        return False

    # Couleur selon le score
    if score >= 80:
        tags = "green_heart,house"
    elif score >= 70:
        tags = "yellow_heart,house"
    else:
        tags = "house"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                f"{NTFY_BASE}/{topic}",
                headers={
                    "Title": title,
                    "Priority": priority,
                    "Tags": tags,
                    "Click": listing_url,
                    "Actions": f"view, Voir l'annonce, {listing_url}",
                },
                content=message.encode("utf-8"),
            )
            if resp.status_code in (200, 201, 204):
                logger.info("ntfy push envoyé à topic=%s score=%d", topic, score)
                return True
            else:
                logger.warning("ntfy push échoué: %d", resp.status_code)
                return False
    except Exception as e:
        logger.error("ntfy push erreur: %s", e)
        return False


async def send_premium_alert(
    user_ntfy_topic: Optional[str],
    score: int,
    listing_title: str,
    listing_address: Optional[str],
    delta_rent: float,
    recommendation: Optional[str],
    listing_url: str,
    dashboard_url: str = "https://vivenza.ca/dashboard",
) -> bool:
    """Envoie une alerte push Premium pour un score élevé."""
    if not user_ntfy_topic:
        return False

    rent_str = f"+{delta_rent:.0f}$" if delta_rent > 0 else f"{delta_rent:.0f}$"
    title = f"🏠 {score}/100 — Nouvel upgrade détecté"
    message = (
        f"{listing_title[:60]}\n"
        f"📍 {listing_address or 'Montréal'}\n"
        f"💰 {rent_str}/mois\n"
        f"\n{recommendation or 'Consulte Vivenza pour les détails.'}"
    )

    return await send_ntfy_push(
        topic=user_ntfy_topic,
        title=title,
        message=message,
        score=score,
        listing_url=listing_url,
        priority="urgent" if score >= 85 else "high",
    )

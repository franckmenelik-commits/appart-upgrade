"""
Email alerts — Vivenza.

Envoie un email aux users Pro/Premium quand une nouvelle annonce
obtient un score >= 70 (upgrade significatif).

Provider : Resend (gratuit, 3000 emails/mois)
Setup : https://resend.com → créer un compte → API key
"""

from __future__ import annotations

import logging
from typing import Optional

logger = logging.getLogger(__name__)


EMAIL_TEMPLATE = """\
<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<style>
  body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9fafb; margin: 0; padding: 20px; }}
  .container {{ max-width: 560px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }}
  .header {{ background: #2563eb; padding: 24px; text-align: center; }}
  .header h1 {{ color: white; margin: 0; font-size: 20px; }}
  .score-badge {{ display: inline-block; background: {score_color}; color: white; font-size: 32px; font-weight: bold; width: 64px; height: 64px; line-height: 64px; border-radius: 50%; text-align: center; margin: 16px 0; }}
  .content {{ padding: 24px; }}
  .listing-title {{ font-size: 18px; font-weight: 600; color: #111; margin-bottom: 4px; }}
  .listing-address {{ color: #6b7280; font-size: 14px; margin-bottom: 16px; }}
  .chips {{ display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 16px; }}
  .chip {{ padding: 4px 10px; border-radius: 999px; font-size: 12px; font-weight: 600; }}
  .chip-red {{ background: #fee2e2; color: #dc2626; }}
  .chip-green {{ background: #dcfce7; color: #16a34a; }}
  .recommendation {{ background: #f3f4f6; border-radius: 8px; padding: 12px; font-size: 14px; color: #374151; font-style: italic; margin-bottom: 20px; }}
  .cta {{ display: block; background: #2563eb; color: white; text-decoration: none; text-align: center; padding: 14px; border-radius: 8px; font-weight: 600; font-size: 15px; }}
  .footer {{ padding: 16px 24px; text-align: center; font-size: 12px; color: #9ca3af; border-top: 1px solid #f3f4f6; }}
</style>
</head>
<body>
<div class="container">
  <div class="header">
    <h1>🏠 Vivenza — Nouvel upgrade détecté</h1>
  </div>
  <div class="content">
    <div style="text-align:center">
      <div class="score-badge">{score}</div>
      <p style="color:#6b7280;font-size:13px;margin-top:0">Score sur 100</p>
    </div>
    <div class="listing-title">{title}</div>
    <div class="listing-address">📍 {address}</div>
    <div class="chips">
      <span class="chip {rent_chip_class}">{rent_delta} loyer</span>
      {surface_chip}
      {commute_chip}
    </div>
    <div class="recommendation">{recommendation}</div>
    <a href="{dashboard_url}" class="cta">Voir l'annonce complète →</a>
  </div>
  <div class="footer">
    Tu reçois cet email car tu as un plan Pro Vivenza.<br>
    <a href="{dashboard_url}/settings" style="color:#9ca3af">Se désabonner des alertes</a>
  </div>
</div>
</body>
</html>
"""


async def send_score_alert(
    to_email: str,
    user_name: str,
    score: int,
    listing_title: str,
    listing_address: Optional[str],
    delta_rent: float,
    delta_surface: Optional[float],
    delta_commute: Optional[int],
    recommendation: Optional[str],
    listing_url: str,
    dashboard_url: str = "https://vivenza.ca/dashboard",
) -> bool:
    """Envoie une alerte email pour un score élevé."""
    from app.config import settings

    if not settings.resend_api_key:
        logger.warning("RESEND_API_KEY non configuré — email non envoyé")
        return False

    import resend
    resend.api_key = settings.resend_api_key

    # Score color
    if score >= 70:
        score_color = "#16a34a"
    elif score >= 50:
        score_color = "#ca8a04"
    else:
        score_color = "#dc2626"

    # Delta rent chip
    rent_delta_str = f"+{delta_rent:.0f}$" if delta_rent > 0 else f"{delta_rent:.0f}$"
    rent_chip_class = "chip-red" if delta_rent > 0 else "chip-green"

    # Surface chip
    surface_chip = ""
    if delta_surface is not None:
        surface_str = f"+{delta_surface:.0f}" if delta_surface > 0 else f"{delta_surface:.0f}"
        surface_class = "chip-green" if delta_surface > 0 else "chip-red"
        surface_chip = f'<span class="chip {surface_class}">{surface_str} sqft</span>'

    # Commute chip
    commute_chip = ""
    if delta_commute is not None and delta_commute != 0:
        commute_str = f"-{abs(delta_commute)} min trajet" if delta_commute < 0 else f"+{delta_commute} min trajet"
        commute_class = "chip-green" if delta_commute < 0 else "chip-red"
        commute_chip = f'<span class="chip {commute_class}">{commute_str}</span>'

    html = EMAIL_TEMPLATE.format(
        score=score,
        score_color=score_color,
        title=listing_title[:80],
        address=listing_address or "Montréal",
        rent_delta=rent_delta_str,
        rent_chip_class=rent_chip_class,
        surface_chip=surface_chip,
        commute_chip=commute_chip,
        recommendation=recommendation or "Consulte l'annonce pour les détails complets.",
        dashboard_url=dashboard_url,
    )

    try:
        resend.Emails.send({
            "from": "Vivenza <alertes@vivenza.ca>",
            "to": [to_email],
            "subject": f"🏠 Nouveau match {score}/100 — {listing_title[:50]}",
            "html": html,
        })
        logger.info("Email envoyé à %s pour score %d", to_email, score)
        return True
    except Exception as e:
        logger.error("Erreur envoi email à %s: %s", to_email, e)
        return False

"""
Moteur de scoring "Upgrade Score" v2 — Vivenza.

Supporte plusieurs providers IA :
- gemini (GRATUIT — Google Gemini 2.0 Flash, 1500 req/jour)
- anthropic (PAYANT — Claude Sonnet, ~0.003$/score)

Configuré via AI_PROVIDER dans .env
"""

from __future__ import annotations

import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

SCORING_SYSTEM_PROMPT = """\
Tu es un expert en immobilier locatif à Montréal. Ta mission : analyser une annonce
d'appartement et la comparer au logement actuel d'un utilisateur pour calculer un
"Upgrade Score" de 0 à 100.

Tu dois retourner un JSON avec cette structure EXACTE :
{
  "total_score": <int 0-100>,
  "price_score": <int 0-100>,
  "space_score": <int 0-100>,
  "commute_score": <int 0-100>,
  "amenities_score": <int 0-100>,
  "quality_score": <int 0-100>,
  "highlights": ["point fort 1", "point fort 2"],
  "lowlights": ["point faible 1"],
  "trade_off": "<null ou phrase expliquant un compromis intelligent>",
  "recommendation": "<phrase résumant si c'est un bon upgrade, en tutoyant l'utilisateur>"
}

## Règles de scoring

### Scores individuels (0-100) :
- price_score : Rapport valeur/prix comparé au baseline
  - 80-100 : Moins cher OU même prix pour nettement mieux
  - 50-70 : Même ratio $/sqft
  - 0-30 : Beaucoup plus cher sans compensation

- space_score : Gain de superficie ET de pièces
  - Chambre supplémentaire : +20 pts, Salle de bain : +15 pts

- commute_score : Réduction du temps de trajet (50 si données manquantes)

- amenities_score : Équipements gagnés vs perdus
  - Balcon +15, Lave-vaisselle +10, Laveuse/sécheuse +20
  - Stationnement +15, Animaux +10
  - Perte d'un équipement existant : malus double

- quality_score : Finitions estimées (description, quartier, prix relatif)

### Total score — Moyenne pondérée avec MULTIPLICATEURS :
Priorités de 1-10. Si priorité >= 8 (non-négociable), multiplicateur x1.5.
Si score d'un critère non-négociable < 40, total_score plafonné à 50.

### Moteur de Trade-off :
Si loyer 10-25% plus élevé, cherche des compensations :
- Électricité/chauffage inclus (~80-150$/mois)
- Stationnement inclus (~100-200$/mois)
- Laveuse/sécheuse incluse (~30-50$/mois)
Si compensations trouvées : les mentionner dans "trade_off".

### Ton :
- Français québécois, tutoiement, direct et honnête
- Mentionne le delta de loyer en $ dans la recommandation

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
"""


def build_comparison_prompt(baseline: dict, listing: dict, priorities: dict) -> str:
    non_negotiable = [k for k, v in priorities.items() if v >= 8]
    nn_text = ", ".join(non_negotiable) if non_negotiable else "Aucun"

    return f"""\
## Appartement actuel (baseline)
{_format_apartment(baseline)}

## Priorités (sur 10)
- Prix : {priorities.get('price', 5)}/10
- Espace : {priorities.get('space', 5)}/10
- Trajet : {priorities.get('commute', 5)}/10
- Équipements : {priorities.get('amenities', 5)}/10
- Qualité : {priorities.get('quality', 5)}/10

Critères non-négociables (>= 8) : {nn_text}

## Annonce à évaluer
{_format_apartment(listing)}

Calcule le score d'upgrade.
"""


def _format_apartment(data: dict) -> str:
    lines = []
    field_labels = {
        "address": "Adresse",
        "rent_monthly": "Loyer ($/mois)",
        "surface_sqft": "Surface (sqft)",
        "num_bedrooms": "Chambres",
        "num_bathrooms": "Salles de bain",
        "floor": "Étage",
        "has_balcony": "Balcon",
        "has_dishwasher": "Lave-vaisselle",
        "has_laundry_inunit": "Laveuse/sécheuse",
        "has_parking": "Stationnement",
        "pet_friendly": "Animaux acceptés",
        "commute_minutes": "Trajet travail (min)",
        "description_raw": "Description",
    }
    for key, label in field_labels.items():
        val = data.get(key)
        if val is not None:
            if isinstance(val, bool):
                val = "Oui" if val else "Non"
            lines.append(f"- {label} : {val}")

    rent = data.get("rent_monthly")
    sqft = data.get("surface_sqft")
    if rent and sqft and sqft > 0:
        lines.append(f"- Ratio $/sqft : {rent / sqft:.2f}")

    return "\n".join(lines) if lines else "Données non disponibles"


# ============================================================
# Provider: Google Gemini (FREE)
# ============================================================

async def _score_with_gemini(prompt: str) -> dict:
    """Score via Google Gemini 2.0 Flash — GRATUIT, 1500 req/jour."""
    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "system_instruction": SCORING_SYSTEM_PROMPT,
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
    )

    return json.loads(response.text)


# ============================================================
# Provider: Anthropic Claude (PAID ~0.003$/score)
# ============================================================

async def _score_with_anthropic(prompt: str) -> dict:
    """Score via Claude Sonnet — payant mais haute qualité."""
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20241022",
        max_tokens=1024,
        system=[{"type": "text", "text": SCORING_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[{"role": "user", "content": prompt}],
    )

    return json.loads(message.content[0].text)


# ============================================================
# Public API
# ============================================================

async def compute_upgrade_score(baseline: dict, listing: dict, priorities: dict) -> dict:
    """
    Calcule le score d'upgrade en utilisant le provider configuré.

    Provider est défini par AI_PROVIDER dans .env :
    - "gemini" (default, GRATUIT)
    - "anthropic" (payant)
    """
    prompt = build_comparison_prompt(baseline, listing, priorities)

    provider = settings.ai_provider.lower()

    if provider == "gemini":
        result = await _score_with_gemini(prompt)
    elif provider == "anthropic":
        result = await _score_with_anthropic(prompt)
    else:
        raise ValueError(f"Provider IA inconnu: {provider}. Utilise 'gemini' ou 'anthropic'.")

    # Assurer les champs requis
    result.setdefault("trade_off", None)
    result.setdefault("highlights", [])
    result.setdefault("lowlights", [])

    logger.info(
        "Score calculé via %s: %d/100 pour listing à %s",
        provider,
        result.get("total_score", 0),
        listing.get("address", "?"),
    )

    return result

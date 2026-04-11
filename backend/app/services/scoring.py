"""
Moteur de scoring "Upgrade Score".

Compare une annonce au baseline de l'utilisateur et retourne un score 0-100
pondéré par les priorités de l'utilisateur.
"""

import anthropic

from app.config import settings

SCORING_SYSTEM_PROMPT = """\
Tu es un expert en immobilier locatif à Montréal. Ta tâche est d'analyser une annonce
d'appartement et de la comparer au logement actuel d'un utilisateur pour déterminer
si c'est un "upgrade" réel.

Tu dois retourner un JSON avec cette structure exacte :
{
  "total_score": <int 0-100>,
  "price_score": <int 0-100>,
  "space_score": <int 0-100>,
  "commute_score": <int 0-100>,
  "amenities_score": <int 0-100>,
  "quality_score": <int 0-100>,
  "highlights": ["point fort 1", "point fort 2"],
  "lowlights": ["point faible 1"],
  "recommendation": "<phrase courte résumant si c'est un bon upgrade>"
}

Règles de scoring :
- price_score : 100 = moins cher pour mieux, 50 = même ratio $/sqft, 0 = beaucoup plus cher pour pareil
- space_score : basé sur le gain de superficie et de pièces
- commute_score : basé sur la réduction du temps de trajet
- amenities_score : équipements gagnés vs perdus (balcon, lave-vaisselle, parking, etc.)
- quality_score : estimation des finitions basée sur la description et le prix
- total_score : moyenne pondérée des 5 scores selon les priorités de l'utilisateur

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
"""


def build_comparison_prompt(baseline: dict, listing: dict, priorities: dict) -> str:
    return f"""\
## Appartement actuel (baseline)
{_format_apartment(baseline)}

## Priorités de l'utilisateur (sur 10)
- Prix : {priorities.get('price', 5)}/10
- Espace : {priorities.get('space', 5)}/10
- Trajet : {priorities.get('commute', 5)}/10
- Équipements : {priorities.get('amenities', 5)}/10
- Qualité : {priorities.get('quality', 5)}/10

## Annonce à évaluer
{_format_apartment(listing)}

Calcule le score d'upgrade.
"""


def _format_apartment(data: dict) -> str:
    lines = []
    field_labels = {
        "address": "Adresse",
        "rent_monthly": "Loyer",
        "surface_sqft": "Surface (sqft)",
        "num_bedrooms": "Chambres",
        "num_bathrooms": "Salles de bain",
        "floor": "Étage",
        "has_balcony": "Balcon",
        "has_dishwasher": "Lave-vaisselle",
        "has_laundry_inunit": "Laveuse/sécheuse dans l'unité",
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
    return "\n".join(lines) if lines else "Données non disponibles"


async def compute_upgrade_score(baseline: dict, listing: dict, priorities: dict) -> dict:
    """Appelle Claude pour calculer le score d'upgrade."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20241022",
        max_tokens=1024,
        system=SCORING_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": build_comparison_prompt(baseline, listing, priorities)},
        ],
    )

    import json

    return json.loads(message.content[0].text)

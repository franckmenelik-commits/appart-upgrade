"""
Moteur de scoring "Upgrade Score" v2 — Vivenza.

Compare une annonce au baseline de l'utilisateur avec :
1. Pondération dynamique via multiplicateurs (critères non-négociables)
2. Moteur de trade-off (compromis intelligent sur le budget)
3. Analyse des utilités incluses pour compenser le delta de loyer
"""

from __future__ import annotations

import json

import anthropic

from app.config import settings

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
  "highlights": ["point fort 1", "point fort 2", ...],
  "lowlights": ["point faible 1", ...],
  "trade_off": "<null ou phrase expliquant un compromis intelligent>",
  "recommendation": "<phrase résumant si c'est un bon upgrade, en tutoyant l'utilisateur>"
}

## Règles de scoring

### Scores individuels (0-100) :
- price_score : Rapport valeur/prix comparé au baseline
  - 80-100 : Moins cher OU même prix pour nettement mieux
  - 50-70 : Même ratio $/sqft, pas de gain net
  - 0-30 : Significativement plus cher sans compensation proportionnelle

- space_score : Gain de superficie ET de pièces
  - Bonus si chambre supplémentaire (+20 pts)
  - Bonus si salle de bain supplémentaire (+15 pts)

- commute_score : Réduction du temps de trajet (si données disponibles)
  - Si pas de données de trajet : score à 50 (neutre)

- amenities_score : Équipements gagnés vs perdus
  - Balcon : +15, Lave-vaisselle : +10, Laveuse/sécheuse : +20
  - Stationnement : +15, Animaux acceptés : +10
  - Perte d'un équipement existant : malus double (-20 à -30)

- quality_score : Estimation des finitions (description, quartier, prix relatif)

### Total score — Moyenne pondérée avec MULTIPLICATEURS :
Les priorités de l'utilisateur vont de 1 à 10. Utilise-les comme poids dans la moyenne.
Si une priorité est >= 8 (non-négociable), applique un multiplicateur x1.5 à ce score.
Si le score d'un critère non-négociable est < 40, le total_score ne peut PAS dépasser 50.

### Moteur de Trade-off :
Si le loyer est 10-25% plus élevé que le baseline, cherche des compensations :
- Électricité/chauffage inclus (~80-150$/mois d'économie)
- Stationnement inclus (~100-200$/mois d'économie)
- Laveuse/sécheuse incluse (économie buanderie ~30-50$/mois)
- Internet inclus (~50-80$/mois)
Si des compensations existent, mentionne-les dans "trade_off" et ajuste le price_score.
Si aucune compensation : trade_off = null.

### Ton :
- Recommandation en français québécois, tutoiement
- Sois direct et honnête : "Pas un upgrade" est une réponse valide
- Mentionne le delta de loyer en $ dans la recommandation

Réponds UNIQUEMENT en JSON valide, sans markdown ni texte autour.
"""


def build_comparison_prompt(baseline: dict, listing: dict, priorities: dict) -> str:
    # Identifier les critères non-négociables
    non_negotiable = [k for k, v in priorities.items() if v >= 8]
    nn_text = ", ".join(non_negotiable) if non_negotiable else "Aucun"

    return f"""\
## Appartement actuel (baseline)
{_format_apartment(baseline)}

## Priorités de l'utilisateur (sur 10)
- Prix : {priorities.get('price', 5)}/10
- Espace : {priorities.get('space', 5)}/10
- Trajet : {priorities.get('commute', 5)}/10
- Équipements : {priorities.get('amenities', 5)}/10
- Qualité : {priorities.get('quality', 5)}/10

Critères non-négociables (>= 8/10) : {nn_text}

## Annonce à évaluer
{_format_apartment(listing)}

Calcule le score d'upgrade en appliquant les multiplicateurs et le moteur de trade-off.
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
        "has_laundry_inunit": "Laveuse/sécheuse dans l'unité",
        "has_parking": "Stationnement",
        "pet_friendly": "Animaux acceptés",
        "commute_minutes": "Trajet travail (min)",
        "description_raw": "Description brute",
    }
    for key, label in field_labels.items():
        val = data.get(key)
        if val is not None:
            if isinstance(val, bool):
                val = "Oui" if val else "Non"
            lines.append(f"- {label} : {val}")

    # Ajouter le ratio $/sqft si disponible
    rent = data.get("rent_monthly")
    sqft = data.get("surface_sqft")
    if rent and sqft and sqft > 0:
        ratio = rent / sqft
        lines.append(f"- Ratio $/sqft : {ratio:.2f}")

    return "\n".join(lines) if lines else "Données non disponibles"


async def compute_upgrade_score(baseline: dict, listing: dict, priorities: dict) -> dict:
    """Appelle Claude pour calculer le score d'upgrade avec trade-offs."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20241022",
        max_tokens=1024,
        system=[{"type": "text", "text": SCORING_SYSTEM_PROMPT, "cache_control": {"type": "ephemeral"}}],
        messages=[
            {"role": "user", "content": build_comparison_prompt(baseline, listing, priorities)},
        ],
    )

    result = json.loads(message.content[0].text)

    # Assurer que trade_off existe (compatibilité)
    if "trade_off" not in result:
        result["trade_off"] = None

    return result

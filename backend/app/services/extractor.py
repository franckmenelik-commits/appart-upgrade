"""
Extracteur de données structurées.

Utilise Claude pour transformer une description brute d'annonce
en données JSON normalisées.
"""

import json

import anthropic

from app.config import settings

EXTRACTION_SYSTEM_PROMPT = """\
Tu es un extracteur de données immobilières. À partir d'une description brute
d'annonce d'appartement (souvent mal formatée, en français ou anglais), tu extrais
les informations dans un JSON structuré.

Retourne UNIQUEMENT ce JSON :
{
  "rent_monthly": <float ou null>,
  "surface_sqft": <float ou null>,
  "num_bedrooms": <int ou null>,
  "num_bathrooms": <int ou null>,
  "floor": <int ou null>,
  "has_balcony": <bool ou null>,
  "has_dishwasher": <bool ou null>,
  "has_laundry_inunit": <bool ou null>,
  "has_parking": <bool ou null>,
  "pet_friendly": <bool ou null>,
  "address": "<string ou null>",
  "neighborhood": "<string ou null>",
  "available_date": "<YYYY-MM-DD ou null>",
  "lease_duration_months": <int ou null>,
  "included_utilities": ["electricity", "heating", "wifi", ...],
  "extra_features": ["libre immédiatement", "rénové", ...]
}

Notes :
- Si la superficie est en m², convertis en sqft (× 10.764)
- Si la superficie est en pi², c'est déjà en sqft
- "3 1/2" = 1 chambre, "4 1/2" = 2 chambres, "5 1/2" = 3 chambres (convention québécoise)
- Si une info n'est pas mentionnée, mets null
- Réponds UNIQUEMENT en JSON, sans markdown
"""


async def extract_listing_data(raw_text: str) -> dict:
    """Extrait les données structurées d'une description brute d'annonce."""
    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20241022",
        max_tokens=1024,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[
            {"role": "user", "content": f"Extrais les données de cette annonce :\n\n{raw_text}"},
        ],
    )

    return json.loads(message.content[0].text)

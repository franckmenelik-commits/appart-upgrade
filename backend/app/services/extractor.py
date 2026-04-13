"""
Extracteur de données structurées — Vivenza.

Utilise Gemini (GRATUIT) par défaut pour transformer une description brute
d'annonce en données JSON normalisées. Fallback sur Anthropic si configuré.
"""

from __future__ import annotations

import json
import logging

from app.config import settings

logger = logging.getLogger(__name__)

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
    provider = settings.ai_provider.lower()
    prompt = f"Extrais les données de cette annonce :\n\n{raw_text}"

    if provider == "gemini":
        return await _extract_with_gemini(prompt)
    elif provider == "anthropic":
        return await _extract_with_anthropic(prompt)
    else:
        raise ValueError(f"Provider inconnu: {provider}")


async def _extract_with_gemini(prompt: str) -> dict:
    from google import genai

    client = genai.Client(api_key=settings.gemini_api_key)

    response = await client.aio.models.generate_content(
        model="gemini-2.5-flash",
        contents=prompt,
        config={
            "system_instruction": EXTRACTION_SYSTEM_PROMPT,
            "temperature": 0.1,
            "response_mime_type": "application/json",
        },
    )

    return json.loads(response.text)


async def _extract_with_anthropic(prompt: str) -> dict:
    import anthropic

    client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)

    message = await client.messages.create(
        model="claude-sonnet-4-5-20241022",
        max_tokens=1024,
        system=EXTRACTION_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )

    return json.loads(message.content[0].text)

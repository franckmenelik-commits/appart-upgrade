from __future__ import annotations

"""
Scraper Centris.ca — Parsing HTML côté serveur.

Centris rend les listings directement dans le HTML (SSR) avec des
balises schema.org/Product. On récupère la page et on parse avec BeautifulSoup.

Pages supportées :
  - /fr/appartement~a-louer~montreal         (appartements)
  - /fr/condo-appartement~a-louer~montreal   (condos)
  - /fr/propriete~a-louer                    (tout type)

Chaque page contient ~20 cartes avec :
  - MLS ID (itemprop="sku" ou data-mlsnumber)
  - Prix (itemprop="price")
  - Image (itemprop="image")
  - Lien vers le détail (href avec le MLS ID)
  - Description (adresse, chambres, etc. dans les meta)
"""

import re
from dataclasses import dataclass, field

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.centris.ca"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
}

# URLs de recherche location Centris
SEARCH_URLS = [
    "/fr/appartement~a-louer~montreal",
    "/fr/condo-appartement~a-louer~montreal",
]


@dataclass
class CentrisListing:
    source_id: str
    source_url: str
    title: str
    price_text: str
    price_value: float | None = None
    address: str = ""
    city: str = "Montréal"
    bedrooms_text: str | None = None
    bathrooms_text: str | None = None
    area_text: str | None = None
    image_url: str | None = None
    description_raw: str | None = None
    features: list[str] = field(default_factory=list)


def _parse_listings_from_html(html: str) -> list[CentrisListing]:
    """Parse le HTML SSR de Centris pour extraire les annonces."""
    soup = BeautifulSoup(html, "html.parser")
    listings = []
    seen_ids = set()

    for card in soup.select("div.property-thumbnail-item"):
        try:
            # MLS ID — via itemprop="sku" ou data-mlsnumber
            sku_meta = card.select_one('meta[itemprop="sku"]')
            mls_id = sku_meta["content"] if sku_meta else None

            if not mls_id:
                mls_link = card.select_one("a[data-mlsnumber]")
                mls_id = mls_link["data-mlsnumber"] if mls_link else None

            if not mls_id or mls_id in seen_ids:
                continue
            seen_ids.add(mls_id)

            # URL
            link = card.select_one("a.property-thumbnail-summary-link")
            href = link["href"] if link else ""
            source_url = f"{BASE_URL}{href}" if href.startswith("/") else href

            # Titre (name meta)
            name_meta = card.select_one('meta[itemprop="name"]')
            title = name_meta["content"] if name_meta else "Appartement"
            # Nettoyer le titre (enlever " - Centris.ca")
            title = re.sub(r"\s*-\s*Centris\.ca\s*$", "", title)

            # Prix
            price_meta = card.select_one('meta[itemprop="price"]')
            price_value = float(price_meta["content"]) if price_meta else None

            price_span = card.select_one("div.price span")
            price_text = price_span.get_text(strip=True) if price_span else "N/A"
            if price_text != "N/A":
                desc_span = card.select_one("div.price span.desc")
                if desc_span:
                    price_text += " " + desc_span.get_text(strip=True)

            # Image
            img = card.select_one('img[itemprop="image"]')
            image_url = img["src"] if img else None

            # Adresse — extraite du titre Centris
            # Format: "Type à louer à Quartier, Ville (Île), 1656, Rue X, app. Y, MLS"
            address = ""
            if title:
                # Tout après "Île), " ou "Ville, " et avant le MLS ID final
                addr_match = re.search(r"(?:Île\),\s*|Montréal,\s*)(.+?)(?:,\s*\d{7,})?$", title)
                if addr_match:
                    address = addr_match.group(1).strip().rstrip(",")
            # Fallback: div.address
            if not address:
                address_el = card.select_one("span.address, div.address")
                address = address_el.get_text(" ", strip=True) if address_el else ""

            # Caractéristiques (chambres, sdb, superficie)
            bedrooms = bathrooms = area = None
            crit_spans = card.select("div.crit-container span, span.bedrooms, span.bathrooms")
            for span in crit_spans:
                text = span.get_text(strip=True).lower()
                if "ch" in text or "bed" in text or "cac" in text:
                    bedrooms = text
                elif "sdb" in text or "sde" in text or "bath" in text:
                    bathrooms = text
                elif "pi" in text or "sqft" in text or "m²" in text or "pc" in text:
                    area = text

            # Description
            desc_parts = [title, price_text, address]
            if bedrooms:
                desc_parts.append(f"Chambres: {bedrooms}")
            if bathrooms:
                desc_parts.append(f"Salles de bain: {bathrooms}")
            if area:
                desc_parts.append(f"Superficie: {area}")

            listings.append(
                CentrisListing(
                    source_id=mls_id,
                    source_url=source_url,
                    title=title,
                    price_text=price_text,
                    price_value=price_value,
                    address=address,
                    bedrooms_text=bedrooms,
                    bathrooms_text=bathrooms,
                    area_text=area,
                    image_url=image_url,
                    description_raw=" — ".join(filter(None, desc_parts)),
                )
            )

        except (KeyError, TypeError, AttributeError):
            continue

    return listings


async def scrape_centris(
    min_price: int = 800,
    max_price: int = 3000,
    max_pages: int = 3,
) -> list[CentrisListing]:
    """
    Scrape les annonces de location depuis Centris.ca.

    Centris filtre par prix dans l'URL n'est pas supporté directement —
    on filtre côté client après récupération.
    """
    all_listings: list[CentrisListing] = []
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=30.0, follow_redirects=True) as client:
        for search_url in SEARCH_URLS:
            url = f"{BASE_URL}{search_url}"
            try:
                resp = await client.get(url)
                resp.raise_for_status()
            except httpx.HTTPError as e:
                continue

            page_listings = _parse_listings_from_html(resp.text)

            for listing in page_listings:
                if listing.source_id in seen_ids:
                    continue
                # Filtre prix côté client
                if listing.price_value is not None:
                    if listing.price_value < min_price or listing.price_value > max_price:
                        continue
                seen_ids.add(listing.source_id)
                all_listings.append(listing)

    return all_listings

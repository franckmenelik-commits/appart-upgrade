"""
Scraper Kijiji — Appartements à louer à Montréal.

Kijiji utilise une API de recherche JSON accessible via XHR.
Endpoint : https://www.kijiji.ca/v-appartement-condo/ville-de-montreal/

Stratégie : httpx + BeautifulSoup sur les pages de résultats HTML.
Kijiji est plus permissif que Centris — pas de Cloudflare agressif.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field

import httpx
from bs4 import BeautifulSoup

BASE_URL = "https://www.kijiji.ca"
SEARCH_URL = "/v-appartement-condo/ville-de-montreal/w0l80002"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "fr-CA,fr;q=0.9,en;q=0.8",
    "Accept": "text/html,application/xhtml+xml",
}


@dataclass
class KijijiListing:
    source_id: str
    source_url: str
    title: str
    price_text: str
    price_value: float | None = None
    address: str = ""
    city: str = "Montréal"
    description_raw: str | None = None
    image_url: str | None = None
    bedrooms_text: str | None = None


def _parse_price(text: str) -> float | None:
    if not text:
        return None
    cleaned = re.sub(r"[^\d.]", "", text.replace("\u202f", "").replace(",", "").replace("\u00a0", ""))
    try:
        val = float(cleaned)
        return val if 100 < val < 20000 else None
    except ValueError:
        return None


def _parse_listings_from_html(html: str) -> list[KijijiListing]:
    soup = BeautifulSoup(html, "html.parser")
    listings = []

    # Kijiji utilise data-listing-id sur les articles
    for card in soup.select("[data-listing-id]"):
        try:
            listing_id = card.get("data-listing-id", "")
            if not listing_id:
                continue

            # Lien
            link = card.select_one("a[data-testid='listing-link'], a.title")
            if not link:
                link = card.select_one("a[href*='/v-']")
            if not link:
                continue

            href = link.get("href", "")
            source_url = f"{BASE_URL}{href}" if href.startswith("/") else href

            # Titre
            title_el = card.select_one("h2, [data-testid='listing-title']")
            title = title_el.get_text(strip=True) if title_el else "Appartement"

            # Prix
            price_el = card.select_one("[data-testid='listing-price'], .price")
            price_text = price_el.get_text(strip=True) if price_el else "N/A"
            price_value = _parse_price(price_text)

            # Adresse
            addr_el = card.select_one("[data-testid='listing-location'], .location")
            address = addr_el.get_text(strip=True) if addr_el else ""

            # Image
            img = card.select_one("img")
            image_url = img.get("src") or img.get("data-src") if img else None
            if image_url and image_url.startswith("//"):
                image_url = "https:" + image_url

            # Chambres (souvent dans le titre ou une badge)
            bedrooms = None
            beds_el = card.select_one("[data-testid='bedrooms'], .bedrooms")
            if beds_el:
                bedrooms = beds_el.get_text(strip=True)

            # Description courte
            desc_el = card.select_one("[data-testid='listing-description'], .description")
            description = desc_el.get_text(strip=True) if desc_el else None

            listings.append(
                KijijiListing(
                    source_id=f"kijiji_{listing_id}",
                    source_url=source_url,
                    title=title,
                    price_text=price_text,
                    price_value=price_value,
                    address=address,
                    description_raw=f"{title} — {price_text} — {address}" + (f" — {description}" if description else ""),
                    image_url=image_url,
                    bedrooms_text=bedrooms,
                )
            )
        except Exception:
            continue

    return listings


async def scrape_kijiji(
    min_price: int = 800,
    max_price: int = 3500,
    max_pages: int = 3,
) -> list[KijijiListing]:
    """Scrape les annonces Kijiji pour appartements à louer à Montréal."""
    all_listings: list[KijijiListing] = []
    seen_ids: set[str] = set()

    async with httpx.AsyncClient(headers=HEADERS, timeout=20.0, follow_redirects=True) as client:
        for page in range(1, max_pages + 1):
            # Kijiji pagine avec ?page=N ou /pageN/
            url = f"{BASE_URL}{SEARCH_URL}?price={min_price}__{max_price}"
            if page > 1:
                url += f"&page={page}"

            try:
                resp = await client.get(url)
                resp.raise_for_status()
            except httpx.HTTPError as e:
                break

            page_listings = _parse_listings_from_html(resp.text)

            if not page_listings:
                break

            for listing in page_listings:
                if listing.source_id in seen_ids:
                    continue
                seen_ids.add(listing.source_id)
                all_listings.append(listing)

    return all_listings

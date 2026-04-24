from __future__ import annotations

"""
Scraper Rentals.ca — Montréal.
"""

from dataclasses import dataclass
import httpx
from bs4 import BeautifulSoup
import re
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://rentals.ca"
SEARCH_URL = "/montreal"

@dataclass
class RentalsListing:
    source_id: str
    source_url: str
    title: str
    price_text: str
    price_value: float | None = None
    address: str = ""
    city: str = "Montréal"
    description_raw: str | None = None
    image_url: str | None = None

async def scrape_rentals(min_price: int = 800, max_price: int = 4000) -> list[RentalsListing]:
    all_listings = []
    url = f"{BASE_URL}{SEARCH_URL}?pmin={min_price}&pmax={max_price}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(headers=headers, timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return []
            
            soup = BeautifulSoup(resp.text, "html.parser")
            # Rentals.ca listings are usually in article or div with specific classes
            cards = soup.select('article.listing-card, .listing-card')
            
            for card in cards:
                try:
                    link_el = card.find("a", href=True)
                    if not link_el: continue
                    
                    href = link_el["href"]
                    source_url = f"{BASE_URL}{href}" if href.startswith("/") else href
                    source_id = f"rentals_{href.split('/')[-1]}"
                    
                    title_el = card.select_one('.listing-card__title, h2, h3')
                    title = title_el.get_text(strip=True) if title_el else "Appartement Rentals.ca"
                    
                    price_el = card.select_one('.listing-card__price, .price')
                    price_text = price_el.get_text(strip=True) if price_el else "N/A"
                    
                    price_val = None
                    price_match = re.search(r"(\d[\d\s,.]*)", price_text)
                    if price_match:
                        price_val = float(price_match.group(1).replace(",", "").replace(" ", "").replace("$", ""))

                    img = card.find("img")
                    image_url = img["src"] if img and "src" in img.attrs else None

                    all_listings.append(RentalsListing(
                        source_id=source_id,
                        source_url=source_url,
                        title=title,
                        price_text=price_text,
                        price_value=price_val,
                        description_raw=f"{title} — {price_text}",
                        image_url=image_url
                    ))
                except Exception as e:
                    logger.warning(f"Error parsing Rentals.ca card: {e}")
                    continue
        except Exception as e:
            logger.error(f"Rentals.ca scraping failed: {e}")
            
    return all_listings

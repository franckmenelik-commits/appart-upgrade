from __future__ import annotations

"""
Scraper Zumper — Montréal.
Zumper charge ses données via une API JSON mais rend aussi du SSR.
"""

from dataclasses import dataclass
import httpx
from bs4 import BeautifulSoup
import re
import logging

logger = logging.getLogger(__name__)

BASE_URL = "https://www.zumper.com"
SEARCH_URL = "/apartments-for-rent/montreal-qc"

@dataclass
class ZumperListing:
    source_id: str
    source_url: str
    title: str
    price_text: str
    price_value: float | None = None
    address: str = ""
    city: str = "Montréal"
    description_raw: str | None = None
    image_url: str | None = None

async def scrape_zumper(min_price: int = 800, max_price: int = 4000) -> list[ZumperListing]:
    all_listings = []
    url = f"{BASE_URL}{SEARCH_URL}?box=-73.7,45.4,-73.4,45.7&min-price={min_price}&max-price={max_price}"
    
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    async with httpx.AsyncClient(headers=headers, timeout=20.0, follow_redirects=True) as client:
        try:
            resp = await client.get(url)
            if resp.status_code != 200:
                return []
            
            soup = BeautifulSoup(resp.text, "html.parser")
            # Zumper change souvent ses classes, on cherche par data-testid ou structure
            cards = soup.select('[data-testid="listing-card"], .ListItem_container__1p9-M')
            
            for card in cards:
                try:
                    link_el = card.find("a", href=True)
                    if not link_el: continue
                    
                    href = link_el["href"]
                    source_url = f"{BASE_URL}{href}" if href.startswith("/") else href
                    source_id = f"zumper_{href.split('/')[-1]}"
                    
                    title_el = card.find("h2") or card.find("h3")
                    title = title_el.get_text(strip=True) if title_el else "Appartement Zumper"
                    
                    price_el = card.select_one('[class*="price"], .ListItem_price__2_G9L')
                    price_text = price_el.get_text(strip=True) if price_el else "N/A"
                    
                    # Nettoyage prix
                    price_val = None
                    price_match = re.search(r"(\d[\d\s,.]*)", price_text)
                    if price_match:
                        price_val = float(price_match.group(1).replace(",", "").replace(" ", "").replace("$", ""))

                    img = card.find("img")
                    image_url = img["src"] if img and "src" in img.attrs else None

                    all_listings.append(ZumperListing(
                        source_id=source_id,
                        source_url=source_url,
                        title=title,
                        price_text=price_text,
                        price_value=price_val,
                        description_raw=f"{title} — {price_text}",
                        image_url=image_url
                    ))
                except Exception as e:
                    logger.warning(f"Error parsing Zumper card: {e}")
                    continue
        except Exception as e:
            logger.error(f"Zumper scraping failed: {e}")
            
    return all_listings

from __future__ import annotations

"""
Scraper d'annonces via Playwright.

Point d'entrée pour l'agrégation de données depuis les sources externes.
Chaque source a sa propre méthode d'extraction.
"""

from dataclasses import dataclass


@dataclass
class RawListing:
    source: str
    source_id: str
    source_url: str
    title: str
    description_raw: str
    price_text: str | None = None
    address_text: str | None = None
    image_urls: list[str] | None = None


async def scrape_kijiji(city: str = "ville-de-montreal", max_pages: int = 3) -> list[RawListing]:
    """
    Scrape les annonces d'appartements depuis Kijiji.

    TODO: Implémenter avec Playwright.
    - Naviguer vers la section "Appartements et condos à louer"
    - Extraire titre, prix, description, URL, images
    - Paginer jusqu'à max_pages
    """
    raise NotImplementedError("Kijiji scraper à implémenter")


async def scrape_zumper(city: str = "montreal") -> list[RawListing]:
    """
    Récupère les annonces depuis Zumper.

    TODO: Vérifier si API partenaire disponible, sinon Playwright.
    """
    raise NotImplementedError("Zumper scraper à implémenter")


async def scrape_centris(city: str = "montreal") -> list[RawListing]:
    """
    Scrape les annonces de location depuis Centris.ca.

    TODO: Implémenter avec Playwright.
    Note: Centris est principalement pour la vente, mais a une section location.
    """
    raise NotImplementedError("Centris scraper à implémenter")

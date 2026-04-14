"""
Utilitaires de scraping résilient — Vivenza.

Stratégies sans proxies payants :
1. Rotation de User-Agents (pool de 15 navigateurs réels)
2. Delays adaptatifs (backoff exponentiel sur erreur)
3. Sessions multiples avec cookies frais
4. Retry automatique avec jitter
"""

from __future__ import annotations

import asyncio
import random
from typing import Optional

import httpx

# Pool de User-Agents réels (mis à jour avril 2026)
USER_AGENTS = [
    # Chrome macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    # Chrome Windows
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    # Firefox
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:125.0) Gecko/20100101 Firefox/125.0",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
    # Safari macOS
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15",
    # Edge
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.0.0",
    # Mobile Chrome (Montréal users might check on mobile)
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/124.0.6367.111 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.82 Mobile Safari/537.36",
]

# Accept-Language variants pour paraître plus naturel
ACCEPT_LANGUAGES = [
    "fr-CA,fr;q=0.9,en-CA;q=0.8,en;q=0.7",
    "fr-CA,fr;q=0.9,en;q=0.8",
    "fr;q=0.9,en-CA;q=0.8,en;q=0.7",
    "fr-CA,fr;q=0.8,en-US;q=0.5,en;q=0.3",
]


def get_random_headers() -> dict:
    """Retourne des headers avec un UA et langue aléatoires."""
    return {
        "User-Agent": random.choice(USER_AGENTS),
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": random.choice(ACCEPT_LANGUAGES),
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
        "Sec-Fetch-Dest": "document",
        "Sec-Fetch-Mode": "navigate",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-User": "?1",
    }


async def fetch_with_retry(
    url: str,
    max_retries: int = 3,
    base_delay: float = 2.0,
    referer: Optional[str] = None,
) -> Optional[httpx.Response]:
    """
    Fetch avec retry exponentiel et rotation UA.

    Stratégie :
    - Retry 1 : après 2s + jitter
    - Retry 2 : après 4s + jitter
    - Retry 3 : après 8s + jitter
    """
    for attempt in range(max_retries):
        headers = get_random_headers()
        if referer:
            headers["Referer"] = referer

        try:
            # Délai humain avant chaque requête (0.5-2s)
            await asyncio.sleep(random.uniform(0.5, 2.0))

            async with httpx.AsyncClient(
                headers=headers,
                timeout=25.0,
                follow_redirects=True,
            ) as client:
                resp = await client.get(url)

                if resp.status_code == 200:
                    return resp
                elif resp.status_code == 429:
                    # Rate limited — attendre plus longtemps
                    delay = base_delay * (2 ** attempt) + random.uniform(1, 5)
                    await asyncio.sleep(delay)
                elif resp.status_code in (403, 503):
                    # Potentiellement bloqué — changer UA et attendre
                    delay = base_delay * (2 ** attempt) + random.uniform(2, 8)
                    await asyncio.sleep(delay)
                else:
                    return resp

        except (httpx.TimeoutException, httpx.ConnectError):
            if attempt < max_retries - 1:
                delay = base_delay * (2 ** attempt) + random.uniform(0.5, 2)
                await asyncio.sleep(delay)

    return None


class ResilientSession:
    """
    Session de scraping résiliente avec :
    - Rotation UA automatique entre requêtes
    - Délais humains
    - Retry sur erreur
    """

    def __init__(self, base_delay: float = 1.5):
        self.base_delay = base_delay
        self._request_count = 0

    async def get(self, url: str, referer: Optional[str] = None) -> Optional[httpx.Response]:
        """Fetch une page avec gestion resiliente."""
        self._request_count += 1

        # Pause plus longue toutes les 10 requêtes (comportement humain)
        if self._request_count % 10 == 0:
            await asyncio.sleep(random.uniform(3, 8))

        return await fetch_with_retry(url, referer=referer)

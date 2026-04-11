#!/usr/bin/env python3
"""
Test du scraper Centris.ca — exécuter manuellement pour valider les données.

Usage:
    python3 scripts/test_centris.py
    python3 scripts/test_centris.py --max-pages 2 --min-price 1000 --max-price 2000
"""

from __future__ import annotations

import argparse
import asyncio
import json
import os
import sys

# Ajouter le répertoire parent au path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.centris import scrape_centris


async def main(min_price: int, max_price: int, max_pages: int):
    print(f"\n{'='*60}")
    print(f"  Test scraper Centris.ca")
    print(f"  Prix: {min_price}$ - {max_price}$ | Pages: {max_pages}")
    print(f"{'='*60}\n")

    print("[1/3] Connexion à Centris.ca et obtention des tokens...")

    try:
        listings = await scrape_centris(
            min_price=min_price,
            max_price=max_price,
            max_pages=max_pages,
        )
    except Exception as e:
        print(f"\n[ERREUR] Scraping échoué: {e}")
        print("\nCauses possibles:")
        print("  - Centris bloque les requêtes (Cloudflare)")
        print("  - Les endpoints internes ont changé")
        print("  - Pas de connexion internet")
        return

    print(f"\n[2/3] {len(listings)} annonces récupérées\n")

    if not listings:
        print("[AVERTISSEMENT] Aucune annonce trouvée.")
        print("Le HTML retourné par Centris peut avoir changé de structure.")
        print("Vérifier les sélecteurs CSS dans centris.py (_parse_listings)")
        return

    # Afficher les résultats
    for i, l in enumerate(listings[:10], 1):
        print(f"--- Annonce {i} ---")
        print(f"  ID:       {l.source_id}")
        print(f"  Titre:    {l.title}")
        print(f"  Prix:     {l.price_text}")
        print(f"  Adresse:  {l.address}")
        print(f"  Chambres: {l.bedrooms_text or 'N/A'}")
        print(f"  SDB:      {l.bathrooms_text or 'N/A'}")
        print(f"  Surface:  {l.area_text or 'N/A'}")
        print(f"  Image:    {l.image_url or 'N/A'}")
        print(f"  URL:      {l.source_url}")
        print()

    if len(listings) > 10:
        print(f"... et {len(listings) - 10} autres annonces\n")

    # Stats
    print(f"[3/3] Statistiques:")
    prices = []
    for l in listings:
        if l.price_text and l.price_text != "N/A":
            import re
            cleaned = re.sub(r"[^\d.]", "", l.price_text.replace(",", "").replace(" ", ""))
            try:
                prices.append(float(cleaned))
            except ValueError:
                pass

    if prices:
        print(f"  Prix moyen:  {sum(prices)/len(prices):.0f}$")
        print(f"  Prix min:    {min(prices):.0f}$")
        print(f"  Prix max:    {max(prices):.0f}$")
        print(f"  Avec prix:   {len(prices)}/{len(listings)}")
    else:
        print("  Aucun prix parsable trouvé")

    with_address = sum(1 for l in listings if l.address)
    with_img = sum(1 for l in listings if l.image_url)
    print(f"  Avec adresse: {with_address}/{len(listings)}")
    print(f"  Avec image:   {with_img}/{len(listings)}")

    # Sauvegarder en JSON pour inspection
    output_file = os.path.join(os.path.dirname(__file__), "centris_test_output.json")
    data = []
    for l in listings:
        data.append({
            "source_id": l.source_id,
            "source_url": l.source_url,
            "title": l.title,
            "price_text": l.price_text,
            "address": l.address,
            "bedrooms_text": l.bedrooms_text,
            "bathrooms_text": l.bathrooms_text,
            "area_text": l.area_text,
            "image_url": l.image_url,
        })
    with open(output_file, "w") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"\n  Résultats sauvegardés: {output_file}")
    print(f"\n{'='*60}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test du scraper Centris.ca")
    parser.add_argument("--min-price", type=int, default=800)
    parser.add_argument("--max-price", type=int, default=2500)
    parser.add_argument("--max-pages", type=int, default=2)
    args = parser.parse_args()

    asyncio.run(main(args.min_price, args.max_price, args.max_pages))

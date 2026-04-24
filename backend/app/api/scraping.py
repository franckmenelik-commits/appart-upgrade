from fastapi import APIRouter, BackgroundTasks, Depends
from sqlalchemy.orm import Session

from app.database import get_db
from app.services.ingest import ingest_centris_listings, run_full_pipeline

router = APIRouter()


@router.post("/centris")
async def trigger_centris_scrape(
    min_price: int = 800,
    max_price: int = 3000,
    max_pages: int = 3,
    db: Session = Depends(get_db),
):
    """Déclenche un scrape Centris et retourne les nouvelles annonces."""
    new_listings = await ingest_centris_listings(
        db, min_price=min_price, max_price=max_price, max_pages=max_pages
    )
    return {
        "status": "ok",
        "new_listings": len(new_listings),
        "listings": [
            {"id": str(l.id), "title": l.title, "rent": l.rent_monthly, "address": l.address}
            for l in new_listings
        ],
    }


@router.post("/pipeline")
async def trigger_full_pipeline():
    """Déclenche le pipeline complet : scrape + scoring pour tous les utilisateurs."""
    result = await run_full_pipeline()
    return {"status": "ok", **result}

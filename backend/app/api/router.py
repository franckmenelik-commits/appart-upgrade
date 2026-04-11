from fastapi import APIRouter

from app.api import auth, baselines, billing, listings, scraping, scores, users

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(baselines.router, prefix="/baselines", tags=["baselines"])
api_router.include_router(listings.router, prefix="/listings", tags=["listings"])
api_router.include_router(scores.router, prefix="/scores", tags=["scores"])
api_router.include_router(scraping.router, prefix="/scrape", tags=["scraping"])
api_router.include_router(billing.router, prefix="/billing", tags=["billing"])

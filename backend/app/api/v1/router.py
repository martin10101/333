"""API router composition for version 1 of the public API."""

from fastapi import APIRouter

from app.api.v1.endpoints import health, live, training

api_router = APIRouter()
api_router.include_router(health.router, prefix="/health", tags=["health"])
api_router.include_router(training.router, prefix="/training", tags=["training"])
api_router.include_router(live.router, prefix="/live", tags=["live"])

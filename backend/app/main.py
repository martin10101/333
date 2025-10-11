"""FastAPI application entry point for the Tennis Vision AI backend."""

from fastapi import FastAPI

from app.api.v1.router import api_router
from app.config.settings import settings


def create_app() -> FastAPI:
    app = FastAPI(
        title="Tennis Vision AI",
        description="APIs for autonomous tennis fatigue modelling and live monitoring",
        version=settings.api_version,
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)

    return app


app = create_app()

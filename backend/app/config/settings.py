"""Application configuration management."""

from functools import lru_cache
from pathlib import Path
from typing import Any, Dict

from pydantic import Field
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    api_version: str = Field(default="0.1.0", description="Semantic API version exposed by FastAPI")
    api_v1_prefix: str = Field(default="/api/v1", description="Root prefix for version 1 routes")
    database_url: str = Field(
        default="postgresql+asyncpg://tvai:tvai@localhost:5432/tvai",
        description="Async SQLAlchemy connection string",
    )
    feature_store_path: Path = Field(
        default=Path("data/features"), description="Filesystem path used for feature storage"
    )
    orchestrator_queue: str = Field(
        default="training-jobs", description="Queue or topic used for background job scheduling"
    )

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
        "case_sensitive": False,
    }


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()

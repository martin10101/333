"""Shared response models for service health checks."""

from pydantic import BaseModel


class HealthResponse(BaseModel):
    status: str

"""Basic service health endpoints."""

from fastapi import APIRouter

from app.schemas.health import HealthResponse

router = APIRouter()


@router.get("/", response_model=HealthResponse, summary="Service health check")
def read_health() -> HealthResponse:
    """Return a static health payload that upstream load balancers can probe."""
    return HealthResponse(status="ok")

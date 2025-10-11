"""Endpoints for managing real-time monitoring sessions."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.live import LiveSessionRequest, LiveSessionResponse, LiveSessionStatus
from app.services.live import LiveMonitoringService

router = APIRouter()
service = LiveMonitoringService()


@router.post(
    "/start",
    response_model=LiveSessionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Start a live monitoring session",
)
async def start_live_session(request: LiveSessionRequest) -> LiveSessionResponse:
    """Create a session placeholder used by the orchestration layer to stream features."""
    session = await service.start_session(request)
    return session


@router.get(
    "/{session_id}",
    response_model=LiveSessionStatus,
    summary="Fetch the latest runtime status for a monitoring session",
)
async def get_live_session(session_id: str) -> LiveSessionStatus:
    """Return known state for the requested monitoring session, if it exists."""
    session_status = await service.get_session_status(session_id)
    if session_status is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Session not found")
    return session_status

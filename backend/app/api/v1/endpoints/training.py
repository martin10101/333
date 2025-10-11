"""Endpoints for orchestrating offline autonomous training jobs."""

from fastapi import APIRouter, HTTPException, status

from app.schemas.training import TrainingJobRequest, TrainingJobResponse, TrainingStatusResponse
from app.services.training import TrainingService

router = APIRouter()
service = TrainingService()


@router.post(
    "/start",
    response_model=TrainingJobResponse,
    status_code=status.HTTP_202_ACCEPTED,
    summary="Kick off a new autonomous training cycle",
)
async def start_training(request: TrainingJobRequest) -> TrainingJobResponse:
    """Enqueue a training job that will iterate through historical matches."""
    try:
        job = await service.start_training_job(request)
    except ValueError as exc:  # pragma: no cover - defensive branch
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    return job


@router.get(
    "/status/{job_id}",
    response_model=TrainingStatusResponse,
    summary="Retrieve the progress of a training job",
)
async def get_training_status(job_id: str) -> TrainingStatusResponse:
    """Surface the current status and progress metrics for a queued or running job."""
    status_payload = await service.get_training_status(job_id)
    if status_payload is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")
    return status_payload

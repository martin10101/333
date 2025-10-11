"""Service layer that simulates orchestration of training jobs.

In production this module would interact with a background queue such as Celery,
Redis, or Google Cloud Pub/Sub. For now we implement an in-memory coordinator so
API clients can exercise the contract during early development.
"""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
import uuid

from app.schemas.training import (
    TrainingJobRequest,
    TrainingJobResponse,
    TrainingProgress,
    TrainingStatusResponse,
)


@dataclass
class _TrainingJob:
    request: TrainingJobRequest
    job_id: str
    created_at: datetime = field(default_factory=datetime.utcnow)
    matches_processed: int = 0
    status: str = "queued"


class TrainingService:
    """Facade responsible for creating and tracking training jobs."""

    def __init__(self) -> None:
        self._jobs: Dict[str, _TrainingJob] = {}
        self._lock = asyncio.Lock()

    async def start_training_job(self, request: TrainingJobRequest) -> TrainingJobResponse:
        if not request.match_list:
            raise ValueError("match_list must contain at least one match entry")

        job_id = uuid.uuid4().hex
        job = _TrainingJob(request=request, job_id=job_id)

        async with self._lock:
            self._jobs[job_id] = job

        # Fire-and-forget background simulation
        asyncio.create_task(self._simulate_progress(job_id))

        return TrainingJobResponse(
            job_id=job_id,
            status=job.status,
            estimated_duration_hours=self._estimate_duration(len(request.match_list)),
            matches_total=len(request.match_list),
        )

    async def get_training_status(self, job_id: str) -> Optional[TrainingStatusResponse]:
        async with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None

            progress_percent = (job.matches_processed / len(job.request.match_list)) * 100
            eta_hours = self._estimate_duration(
                len(job.request.match_list) - job.matches_processed
            )

            return TrainingStatusResponse(
                job_id=job.job_id,
                status=job.status,
                progress=TrainingProgress(
                    matches_processed=job.matches_processed,
                    matches_total=len(job.request.match_list),
                    percent=round(progress_percent, 2),
                    current_match=(
                        job.request.match_list[job.matches_processed].name
                        if job.matches_processed < len(job.request.match_list)
                        else None
                    ),
                    eta_hours=eta_hours,
                ),
                patterns_discovered=25 if job.status == "completed" else None,
                avg_prediction_accuracy=0.63 if job.status == "completed" else None,
            )

    async def _simulate_progress(self, job_id: str) -> None:
        # simulate work over time
        await asyncio.sleep(0.1)
        async with self._lock:
            job = self._jobs[job_id]
            job.status = "processing"

        for idx, _match in enumerate(job.request.match_list, start=1):
            await asyncio.sleep(0.05)  # pretend to process a match
            async with self._lock:
                job.matches_processed = idx

        async with self._lock:
            job.status = "completed"

    @staticmethod
    def _estimate_duration(matches: int) -> float:
        # Rough heuristic: 1.8 hours per match of processing time for MVP phase
        return round(matches * 1.8, 2)

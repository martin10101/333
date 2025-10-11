"""Data models for training orchestration endpoints."""

from datetime import date
from typing import List, Optional

from pydantic import BaseModel, Field, HttpUrl


class MatchEntry(BaseModel):
    name: str = Field(..., description="Display title of the match, e.g. 'Djokovic vs Alcaraz Wimbledon 2024'")
    date: Optional[date] = Field(
        None, description="Optional match date to disambiguate tournaments with similar participants"
    )
    video_hint: Optional[HttpUrl] = Field(
        None, description="Optional direct video URL to seed the YouTube discovery agent"
    )


class TrainingJobRequest(BaseModel):
    match_list: List[MatchEntry]
    config: Optional[str] = Field(
        None, description="Path to the pipeline configuration YAML that should be applied"
    )


class TrainingJobResponse(BaseModel):
    job_id: str
    status: str
    estimated_duration_hours: Optional[float] = None
    matches_total: int


class TrainingProgress(BaseModel):
    matches_processed: int
    matches_total: int
    percent: float
    current_match: Optional[str] = None
    eta_hours: Optional[float] = None


class TrainingStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: Optional[TrainingProgress] = None
    patterns_discovered: Optional[int] = None
    avg_prediction_accuracy: Optional[float] = None

"""Pydantic models describing live monitoring session workflows."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, HttpUrl


class LiveSource(BaseModel):
    type: str = Field(..., description="Source type identifier, e.g. 'youtube_embed' or 'rtsp'")
    url: Optional[HttpUrl] = Field(None, description="Resolvable media URL for the player to load")


class LiveSessionRequest(BaseModel):
    source: LiveSource
    player_a: str = Field(..., description="Canonical player identifier for the first competitor")
    player_b: str = Field(..., description="Canonical player identifier for the second competitor")
    alert_config_path: Optional[str] = Field(
        None,
        description="Optional path to an alert configuration YAML file overriding defaults",
    )


class LiveSessionResponse(BaseModel):
    session_id: str
    status: str
    websocket_url: Optional[HttpUrl] = None


class LiveSessionStatus(BaseModel):
    session_id: str
    status: str
    started_at: datetime
    last_event_at: Optional[datetime] = None
    active_streams: int = 0

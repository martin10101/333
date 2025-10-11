"""Live monitoring service abstractions."""

from __future__ import annotations

import asyncio
from dataclasses import dataclass, field
from datetime import datetime
from typing import Dict, Optional
import uuid

from app.schemas.live import LiveSessionRequest, LiveSessionResponse, LiveSessionStatus


@dataclass
class _LiveSession:
    session_id: str
    request: LiveSessionRequest
    status: str = "starting"
    started_at: datetime = field(default_factory=datetime.utcnow)
    last_event_at: datetime = field(default_factory=datetime.utcnow)
    active_streams: int = 0


class LiveMonitoringService:
    """Manage the lifecycle of live monitoring sessions for clients."""

    def __init__(self) -> None:
        self._sessions: Dict[str, _LiveSession] = {}
        self._lock = asyncio.Lock()

    async def start_session(self, request: LiveSessionRequest) -> LiveSessionResponse:
        session_id = uuid.uuid4().hex
        session = _LiveSession(session_id=session_id, request=request)

        async with self._lock:
            self._sessions[session_id] = session

        asyncio.create_task(self._simulate_activation(session_id))

        return LiveSessionResponse(
            session_id=session_id,
            status=session.status,
            websocket_url=None,
        )

    async def get_session_status(self, session_id: str) -> Optional[LiveSessionStatus]:
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return None

            return LiveSessionStatus(
                session_id=session.session_id,
                status=session.status,
                started_at=session.started_at,
                last_event_at=session.last_event_at,
                active_streams=session.active_streams,
            )

    async def _simulate_activation(self, session_id: str) -> None:
        await asyncio.sleep(0.1)
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return
            session.status = "running"
            session.active_streams = 1
            session.last_event_at = datetime.utcnow()

        await asyncio.sleep(0.1)
        async with self._lock:
            session = self._sessions.get(session_id)
            if session is None:
                return
            session.status = "completed"
            session.active_streams = 0
            session.last_event_at = datetime.utcnow()

"""Async orchestration utilities for coordinating background jobs."""

from __future__ import annotations

import asyncio
from contextlib import asynccontextmanager
from typing import AsyncIterator, Callable, Coroutine, TypeVar

T = TypeVar("T")


@asynccontextmanager
def bounded_semaphore(limit: int) -> AsyncIterator[asyncio.Semaphore]:
    """Yield a semaphore with the specified concurrency limit."""
    semaphore = asyncio.Semaphore(limit)
    try:
        yield semaphore
    finally:
        # Placeholder for future cleanup logic
        return


async def run_with_concurrency(
    semaphore: asyncio.Semaphore, coro_factory: Callable[[], Coroutine[None, None, T]]
) -> T:
    """Acquire the semaphore before running the provided coroutine factory."""
    async with semaphore:
        return await coro_factory()

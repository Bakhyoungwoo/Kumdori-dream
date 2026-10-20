import asyncio
import logging
from typing import Any

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def report_started(job_id: str) -> None:
    await _post(
        f"/api/v1/internal/jobs/{job_id}/callback",
        {"status": "PROCESSING", "progress": 0},
    )


async def report_progress(job_id: str, step: str, progress: int) -> None:
    await _post(
        f"/api/v1/internal/jobs/{job_id}/callback",
        {"status": "PROCESSING", "progress": progress},
    )


async def report_done(job_id: str, result_keys: list[str], thumbnail_key: str | None = None) -> None:
    await _post(
        f"/api/v1/internal/jobs/{job_id}/callback",
        {
            "status": "DONE",
            "progress": 100,
            "results": [
                {
                    "variantIndex": index,
                    "resultKey": result_key,
                    "thumbnailKey": thumbnail_key,
                }
                for index, result_key in enumerate(result_keys)
            ],
        },
    )


async def report_failed(job_id: str, error_code: str, retryable: bool = False) -> None:
    await _post(
        f"/api/v1/internal/jobs/{job_id}/callback",
        {"status": "FAILED", "errorCode": error_code},
    )


async def _post(path: str, payload: dict[str, Any]) -> None:
    timeout = httpx.Timeout(settings.callback_timeout_seconds)
    for attempt in range(1, settings.callback_max_retries + 1):
        try:
            async with httpx.AsyncClient(base_url=settings.core_api_url, timeout=timeout) as client:
                response = await client.post(
                    path,
                    json=payload,
                    headers={"X-Internal-Api-Key": settings.ai_engine_secret},
                )
                response.raise_for_status()
            return
        except (httpx.HTTPError, httpx.TimeoutException):
            if attempt == settings.callback_max_retries:
                raise
            delay = min(2 ** (attempt - 1), 5)
            logger.warning("callback failed; retrying", extra={"path": path, "attempt": attempt})
            await asyncio.sleep(delay)

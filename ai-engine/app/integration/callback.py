from typing import Any

import httpx

from app.config import settings


async def report_started(job_id: str) -> None:
    await _post(f"/internal/jobs/{job_id}/started", {})


async def report_progress(job_id: str, step: str, progress: int) -> None:
    await _post(
        f"/internal/jobs/{job_id}/progress",
        {"step": step, "status": "PROCESSING", "progress": progress},
    )


async def report_done(job_id: str, result_keys: list[str], thumbnail_key: str | None = None) -> None:
    await _post(
        f"/internal/jobs/{job_id}/done",
        {"resultKeys": result_keys, "thumbnailKey": thumbnail_key},
    )


async def report_failed(job_id: str, error_code: str, retryable: bool = False) -> None:
    await _post(
        f"/internal/jobs/{job_id}/failed",
        {"errorCode": error_code, "retryable": retryable},
    )


async def _post(path: str, payload: dict[str, Any]) -> None:
    # TODO: add timeout/retry policy and structured callback logging.
    async with httpx.AsyncClient(base_url=settings.core_api_url) as client:
        response = await client.post(
            path,
            json=payload,
            headers={"X-AI-Engine-Secret": settings.ai_engine_secret},
        )
        response.raise_for_status()

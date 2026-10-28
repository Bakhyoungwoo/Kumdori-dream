import hashlib
import json
import time
from typing import Any

from app.config import settings


class PromptPlanCache:
    def __init__(self) -> None:
        self._memory: dict[str, tuple[float, dict[str, Any]]] = {}
        self._redis = None
        if settings.prompt_cache_backend.lower() == "redis":
            try:
                import redis.asyncio as redis
                self._redis = redis.Redis(host=settings.redis_host, port=settings.redis_port, decode_responses=True)
            except ImportError:
                self._redis = None

    @staticmethod
    def key(user_text: str, media_type: str, frame_manifest: dict | None, vision_features: dict | None) -> str:
        raw = json.dumps({"text": user_text, "media": media_type, "frame": frame_manifest or {}, "vision": vision_features or {}},
                         sort_keys=True, ensure_ascii=False)
        return "prompt-plan:" + hashlib.sha256(raw.encode("utf-8")).hexdigest()

    async def get(self, key: str) -> dict[str, Any] | None:
        if self._redis is not None:
            value = await self._redis.get(key)
            return json.loads(value) if value else None
        cached = self._memory.get(key)
        if cached and cached[0] > time.monotonic(): return cached[1]
        self._memory.pop(key, None)
        return None

    async def set(self, key: str, value: dict[str, Any]) -> None:
        if self._redis is not None:
            await self._redis.setex(key, settings.prompt_cache_ttl_seconds, json.dumps(value, ensure_ascii=False))
        else:
            self._memory[key] = (time.monotonic() + settings.prompt_cache_ttl_seconds, value)


prompt_plan_cache = PromptPlanCache()

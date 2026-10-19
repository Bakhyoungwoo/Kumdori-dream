from pathlib import Path

from app.config import settings


class ObjectStorage:
    """Async-compatible local object storage for the MVP."""

    def __init__(self, root: str | Path | None = None) -> None:
        self.root = Path(root or settings.storage_root).resolve()

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if path != self.root and self.root not in path.parents:
            raise ValueError("storage key escapes storage root")
        return path

    async def download(self, key: str) -> bytes:
        return self._path(key).read_bytes()

    async def upload(self, key: str, content: bytes, content_type: str) -> str:
        del content_type
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return key


object_storage = ObjectStorage()

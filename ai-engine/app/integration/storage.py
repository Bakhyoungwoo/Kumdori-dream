from pathlib import Path
import asyncio

try:
    import boto3
except ImportError:  # S3 is optional for local development and tests.
    boto3 = None

from app.config import settings


class ObjectStorage:
    """Async-compatible object storage with local and S3 backends."""

    def __init__(self, root: str | Path | None = None) -> None:
        self.root = Path(root or settings.storage_root).resolve()
        self.backend = settings.storage_backend.lower()
        self.client = None
        if self.backend == "s3":
            if boto3 is None:
                raise ValueError("boto3 is required when STORAGE_BACKEND=s3")
            if not settings.s3_bucket:
                raise ValueError("S3_BUCKET is required when STORAGE_BACKEND=s3")
            kwargs = {"region_name": settings.aws_region}
            if settings.aws_s3_endpoint:
                kwargs["endpoint_url"] = settings.aws_s3_endpoint
            self.client = boto3.client("s3", **kwargs)

    def _path(self, key: str) -> Path:
        path = (self.root / key).resolve()
        if path != self.root and self.root not in path.parents:
            raise ValueError("storage key escapes storage root")
        return path

    async def download(self, key: str) -> bytes:
        if self.backend == "s3":
            response = await asyncio.to_thread(self.client.get_object, Bucket=settings.s3_bucket, Key=key)
            return await asyncio.to_thread(response["Body"].read)
        return self._path(key).read_bytes()

    async def upload(self, key: str, content: bytes, content_type: str) -> str:
        if self.backend == "s3":
            await asyncio.to_thread(
                self.client.put_object,
                Bucket=settings.s3_bucket,
                Key=key,
                Body=content,
                ContentType=content_type,
            )
            return key
        del content_type
        path = self._path(key)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(content)
        return key


object_storage = ObjectStorage()

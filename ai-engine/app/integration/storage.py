class ObjectStorage:
    """Object Storage boundary. S3/MinIO implementation will be added later."""

    async def download(self, key: str) -> bytes:
        raise NotImplementedError("Object Storage download is not configured")

    async def upload(self, key: str, content: bytes, content_type: str) -> str:
        raise NotImplementedError("Object Storage upload is not configured")

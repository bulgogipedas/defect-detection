from io import BytesIO
from pathlib import Path

from minio import Minio

from config import get_settings

_settings = get_settings()
_minio: Minio | None = None


def _client() -> Minio | None:
    global _minio
    if _minio is None and _settings.use_minio and _settings.minio_endpoint:
        _minio = Minio(
            _settings.minio_endpoint,
            access_key=_settings.minio_access_key,
            secret_key=_settings.minio_secret_key,
            secure=_settings.minio_use_ssl,
        )
    return _minio


async def ensure_bucket() -> None:
    c = _client()
    if c is None:
        return
    if not c.bucket_exists(_settings.minio_bucket):
        c.make_bucket(_settings.minio_bucket)


async def upload_image(image_bytes: bytes, image_id: str) -> str:
    name = f"{image_id}.png"
    c = _client()
    if c is None or not _settings.use_minio or not _settings.minio_endpoint:
        base = Path(_settings.storage_dir)
        base.mkdir(parents=True, exist_ok=True)
        p = base / name
        p.write_bytes(image_bytes)
        return f"file://{p.resolve()}"

    await ensure_bucket()
    c.put_object(
        _settings.minio_bucket,
        name,
        data=BytesIO(image_bytes),
        length=len(image_bytes),
        content_type="image/png",
    )
    return f"s3://{_settings.minio_bucket}/{name}"

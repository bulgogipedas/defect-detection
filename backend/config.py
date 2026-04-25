from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    database_url: str = "sqlite+aiosqlite:///./results.db"
    cors_origins: str = "http://localhost:5173,http://localhost:3000"
    minio_endpoint: str | None = None
    minio_access_key: str = "minioadmin"
    minio_secret_key: str = "minioadmin"
    minio_bucket: str = "defect-images"
    minio_use_ssl: bool = False
    use_minio: bool = False
    storage_dir: str = "local_storage"
    patchcore_model_path: str = ""
    data_raw_root: str = "../data/raw"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    def resolve_patchcore_path(self, category: str) -> Path:
        if self.patchcore_model_path:
            p = Path(self.patchcore_model_path)
            if p.is_file():
                return p
        return Path(__file__).resolve().parent.parent / "models" / f"patchcore_{category}.pkl"


@lru_cache
def get_settings() -> Settings:
    return Settings()

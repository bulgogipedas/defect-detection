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
    allow_demo_inference_without_model: bool = True
    model_mode: str = "auto"
    active_model_manifest_path: str = "../models/active_model.json"
    mlflow_tracking_uri: str = "file:./mlflow/mlruns"
    inference_log_level: str = "INFO"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def backend_root(self) -> Path:
        return Path(__file__).resolve().parent

    @property
    def repo_root(self) -> Path:
        return self.backend_root.parent

    @property
    def models_root(self) -> Path:
        return self.repo_root / "models"

    def resolve_path(self, raw: str) -> Path:
        p = Path(raw).expanduser()
        if p.is_absolute():
            return p
        return (self.backend_root / p).resolve()

    def resolve_patchcore_path(self, category: str) -> Path:
        if self.patchcore_model_path:
            p = self.resolve_path(self.patchcore_model_path)
            if p.is_file():
                return p
        return self.models_root / f"patchcore_{category}.pkl"

    def resolve_active_model_manifest(self) -> Path:
        return self.resolve_path(self.active_model_manifest_path)


@lru_cache
def get_settings() -> Settings:
    return Settings()

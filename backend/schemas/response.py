from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field


class DetectionBox(BaseModel):
    """Placeholder for YOLO detections; extend when YOLO is wired."""

    x1: float = 0
    y1: float = 0
    x2: float = 0
    y2: float = 0
    conf: float = 0.0
    cls: str = ""


class InferenceResponse(BaseModel):
    image_id: str
    image_url: str
    is_defect: bool
    anomaly_score: float
    detections: list[dict[str, Any]] = Field(default_factory=list)
    latency_ms: float
    model_mode: str = "unknown"
    model_version: str = "unknown"


class ResultItem(BaseModel):
    id: str
    image_id: str
    image_url: str
    category: str
    is_defect: bool
    anomaly_score: float
    latency_ms: float
    model_mode: str = "unknown"
    model_version: str = "unknown"
    created_at: datetime


class PaginatedResults(BaseModel):
    data: list[ResultItem]
    total: int
    page: int
    page_size: int


class StatsResponse(BaseModel):
    total: int
    defect_rate: float
    avg_latency_ms: float


class TelemetryResponse(BaseModel):
    total: int
    defect_rate: float
    avg_latency_ms: float
    p50_latency_ms: float
    p95_latency_ms: float
    demo_inference_count: int
    production_inference_count: int

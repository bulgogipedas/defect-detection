import json
import uuid
from collections.abc import Mapping
from typing import Any

import numpy as np
from sqlalchemy import func, select
from db.models import InspectionResult
from db.session import get_session
from schemas.response import ResultItem, StatsResponse, TelemetryResponse


async def save_result(row: Mapping[str, Any]) -> str:
    rid = str(uuid.uuid4())
    rec = InspectionResult(
        id=rid,
        image_id=row["image_id"],
        image_url=row.get("image_url", ""),
        category=row.get("category", "bottle"),
        is_defect=bool(row.get("is_defect")),
        anomaly_score=float(row.get("anomaly_score", 0.0)),
        latency_ms=float(row.get("latency_ms", 0.0)),
        model_mode=str(row.get("model_mode", "unknown")),
        model_version=str(row.get("model_version", "unknown")),
        extra_json=json.dumps(row.get("extra", {})),
    )
    async with get_session() as session:
        session.add(rec)
    return rid


async def list_results(page: int = 1, page_size: int = 20) -> tuple[list[ResultItem], int]:
    offset = (page - 1) * page_size
    async with get_session() as session:
        total = (
            await session.execute(select(func.count()).select_from(InspectionResult))
        ).scalar_one()
        q = (
            select(InspectionResult)
            .order_by(InspectionResult.created_at.desc())
            .offset(offset)
            .limit(page_size)
        )
        rows = (await session.execute(q)).scalars().all()

    items = [
        ResultItem(
            id=r.id,
            image_id=r.image_id,
            image_url=r.image_url,
            category=r.category,
            is_defect=r.is_defect,
            anomaly_score=r.anomaly_score,
            latency_ms=r.latency_ms,
            model_mode=r.model_mode,
            model_version=r.model_version,
            created_at=r.created_at,
        )
        for r in rows
    ]
    return items, int(total)


async def get_one(result_id: str) -> ResultItem | None:
    async with get_session() as session:
        r = await session.get(InspectionResult, result_id)
        if r is None:
            return None
        return ResultItem(
            id=r.id,
            image_id=r.image_id,
            image_url=r.image_url,
            category=r.category,
            is_defect=r.is_defect,
            anomaly_score=r.anomaly_score,
            latency_ms=r.latency_ms,
            model_mode=r.model_mode,
            model_version=r.model_version,
            created_at=r.created_at,
        )


async def get_stats() -> StatsResponse:
    async with get_session() as session:
        total = (
            await session.execute(select(func.count()).select_from(InspectionResult))
        ).scalar_one()
        defect_count = (
            await session.execute(
                select(func.count()).select_from(InspectionResult).where(InspectionResult.is_defect)
            )
        ).scalar_one()
        avg_lat = (
            await session.execute(select(func.avg(InspectionResult.latency_ms)))
        ).scalar() or 0.0
    t = int(total) or 1
    return StatsResponse(
        total=int(total),
        defect_rate=float(defect_count) / t,
        avg_latency_ms=float(avg_lat),
    )


async def get_telemetry() -> TelemetryResponse:
    async with get_session() as session:
        rows = (
            await session.execute(
                select(
                    InspectionResult.latency_ms,
                    InspectionResult.is_defect,
                    InspectionResult.model_mode,
                )
            )
        ).all()

    total = len(rows)
    if total == 0:
        return TelemetryResponse(
            total=0,
            defect_rate=0.0,
            avg_latency_ms=0.0,
            p50_latency_ms=0.0,
            p95_latency_ms=0.0,
            demo_inference_count=0,
            production_inference_count=0,
        )

    latencies = np.array([float(r[0]) for r in rows], dtype=float)
    defects = sum(1 for _, is_defect, _ in rows if is_defect)
    demo_count = sum(1 for _, _, mode in rows if mode == "demo")
    prod_count = total - demo_count

    return TelemetryResponse(
        total=total,
        defect_rate=defects / total,
        avg_latency_ms=float(latencies.mean()),
        p50_latency_ms=float(np.percentile(latencies, 50)),
        p95_latency_ms=float(np.percentile(latencies, 95)),
        demo_inference_count=demo_count,
        production_inference_count=prod_count,
    )

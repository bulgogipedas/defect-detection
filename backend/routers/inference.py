import time
import uuid
import logging

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from schemas.response import InferenceResponse
from services import db_service, storage_service
from services import inference_service

router = APIRouter()
log = logging.getLogger("defect_api.inference")


@router.post("/infer", response_model=InferenceResponse)
async def infer(
    file: UploadFile = File(...),
    category: str = Form("bottle"),
) -> InferenceResponse:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")

    image_bytes = await file.read()
    image_id = str(uuid.uuid4())

    try:
        image_url = await storage_service.upload_image(image_bytes, image_id)
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=f"Storage error: {e!s}") from e

    t0 = time.perf_counter()
    try:
        result = await inference_service.run_inference(image_bytes, category)
    except FileNotFoundError as e:
        raise HTTPException(status_code=503, detail=str(e)) from e
    latency_ms = (time.perf_counter() - t0) * 1000

    await db_service.save_result(
        {
            "image_id": image_id,
            "image_url": image_url,
            "category": category,
            "is_defect": result["is_defect"],
            "anomaly_score": result["anomaly_score"],
            "latency_ms": latency_ms,
            "model_mode": result.get("mode", "unknown"),
            "model_version": result.get("model_version", "unknown"),
        }
    )
    log.info(
        "inference_completed image_id=%s category=%s is_defect=%s latency_ms=%.2f mode=%s version=%s",
        image_id,
        category,
        bool(result["is_defect"]),
        latency_ms,
        result.get("mode", "unknown"),
        result.get("model_version", "unknown"),
    )

    return InferenceResponse(
        image_id=image_id,
        image_url=image_url,
        is_defect=bool(result["is_defect"]),
        anomaly_score=float(result["anomaly_score"]),
        detections=result.get("detections", []),
        latency_ms=latency_ms,
        model_mode=str(result.get("mode", "unknown")),
        model_version=str(result.get("model_version", "unknown")),
    )

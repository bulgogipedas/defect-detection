from fastapi import APIRouter
from fastapi.responses import JSONResponse

from services.inference_service import get_runtime_model_status

router = APIRouter()


@router.get("/health", tags=["health"])
async def health() -> JSONResponse:
    model_status = await get_runtime_model_status("bottle")
    return JSONResponse(
        {
            "status": "ok",
            "model_status": model_status,
        }
    )

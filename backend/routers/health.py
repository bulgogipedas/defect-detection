from fastapi import APIRouter
from fastapi.responses import JSONResponse

from config import get_settings
from db.session import check_db_connection
from services.inference_service import get_runtime_model_status

router = APIRouter()


@router.get("/health", tags=["health"])
async def health() -> JSONResponse:
    settings = get_settings()
    model_status = await get_runtime_model_status("bottle")
    db_ok, db_detail = await check_db_connection()
    return JSONResponse(
        {
            "status": "ok",
            "db": {
                "provider": settings.db_provider,
                "configured": bool(settings.resolved_database_url),
                "url": settings.redacted_database_url(),
                "reachable": db_ok,
                "detail": db_detail if not db_ok else "ok",
            },
            "model_status": model_status,
        }
    )

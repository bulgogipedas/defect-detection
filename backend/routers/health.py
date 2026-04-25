from fastapi import APIRouter
from fastapi.responses import JSONResponse

from config import get_settings

router = APIRouter()


@router.get("/health", tags=["health"])
async def health() -> JSONResponse:
    s = get_settings()
    p = s.resolve_patchcore_path("bottle")
    return JSONResponse(
        {
            "status": "ok",
            "patchcore_default_path": str(p),
            "patchcore_exists": p.is_file(),
        }
    )

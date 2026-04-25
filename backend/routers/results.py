from pathlib import Path

from fastapi import APIRouter, HTTPException, Query

from config import get_settings
from schemas.response import PaginatedResults, ResultItem, StatsResponse

router = APIRouter()


@router.get("/results", response_model=PaginatedResults)
async def list_results(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=200),
) -> PaginatedResults:
    from services import db_service

    rows, total = await db_service.list_results(page, page_size)
    return PaginatedResults(
        data=rows, total=total, page=page, page_size=page_size
    )


@router.get("/results/{result_id}", response_model=ResultItem)
async def get_result(result_id: str) -> ResultItem:
    from services import db_service

    row = await db_service.get_one(result_id)
    if row is None:
        raise HTTPException(status_code=404, detail="Result not found")
    return row


@router.get("/stats", response_model=StatsResponse)
async def stats() -> StatsResponse:
    from services import db_service

    return await db_service.get_stats()


@router.get("/categories")
async def categories() -> dict[str, list[str]]:
    s = get_settings()
    root = Path(s.data_raw_root)
    if not root.is_dir():
        return {"categories": []}
    names = [p.name for p in sorted(root.iterdir()) if p.is_dir()]
    return {"categories": names}

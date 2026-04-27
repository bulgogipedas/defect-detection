from contextlib import asynccontextmanager
from collections.abc import AsyncIterator
import logging
import time
import uuid

from fastapi import FastAPI
from fastapi import Request
from fastapi.middleware.cors import CORSMiddleware

from config import get_settings
from db.session import check_db_connection, engine, init_db
from routers import health, inference, results
from services.inference_service import warm_auto_category_cache

settings = get_settings()
logging.basicConfig(
    level=getattr(logging, settings.inference_log_level.upper(), logging.INFO),
    format="%(asctime)s %(levelname)s %(name)s %(message)s",
)
log = logging.getLogger("defect_api.http")


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    if not settings.resolved_database_url:
        raise RuntimeError(
            "DATABASE_URL is not configured. Set a Supabase Postgres URL in your backend .env."
        )
    await init_db()
    ok, detail = await check_db_connection()
    if not ok:
        raise RuntimeError(f"Database connectivity check failed: {detail}")
    try:
        await warm_auto_category_cache()
    except Exception as e:  # noqa: BLE001
        log.warning("auto category cache warmup skipped: %s", e)
    yield
    await engine.dispose()


app = FastAPI(title="Defect Detection API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def request_telemetry(request: Request, call_next):  # type: ignore[no-untyped-def]
    req_id = str(uuid.uuid4())[:8]
    t0 = time.perf_counter()
    response = await call_next(request)
    elapsed_ms = (time.perf_counter() - t0) * 1000
    log.info(
        "request req_id=%s method=%s path=%s status=%s latency_ms=%.2f",
        req_id,
        request.method,
        request.url.path,
        response.status_code,
        elapsed_ms,
    )
    response.headers["X-Request-ID"] = req_id
    return response

app.include_router(health.router)
app.include_router(inference.router, prefix="/api/v1")
app.include_router(results.router, prefix="/api/v1")

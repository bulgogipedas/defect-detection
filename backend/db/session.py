from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from config import get_settings
from db.models import Base

settings = get_settings()
db_url = settings.resolved_database_url or "sqlite+aiosqlite:///./results.db"
engine_kwargs: dict = {"echo": False}
if db_url.startswith("postgresql+"):
    engine_kwargs.update(
        {
            "pool_pre_ping": True,
            "pool_recycle": 1800,
            "pool_size": 5,
            "max_overflow": 10,
        }
    )
engine: AsyncEngine = create_async_engine(db_url, **engine_kwargs)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


async def init_db() -> None:
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        # Lightweight schema migration for existing SQLite dbs.
        if "sqlite" in settings.database_url:
            cols = {
                row[1]
                for row in (await conn.execute(text("PRAGMA table_info(inspection_results)"))).fetchall()
            }
            if "model_mode" not in cols:
                await conn.execute(
                    text("ALTER TABLE inspection_results ADD COLUMN model_mode VARCHAR(32) DEFAULT 'unknown'")
                )
            if "model_version" not in cols:
                await conn.execute(
                    text(
                        "ALTER TABLE inspection_results "
                        "ADD COLUMN model_version VARCHAR(64) DEFAULT 'unknown'"
                    )
                )


async def check_db_connection() -> tuple[bool, str]:
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        return True, "ok"
    except SQLAlchemyError as exc:
        return False, f"{exc.__class__.__name__}: {exc}"


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)

from config import get_settings
from db.models import Base

settings = get_settings()
engine: AsyncEngine = create_async_engine(settings.database_url, echo=False)
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


@asynccontextmanager
async def get_session() -> AsyncIterator[AsyncSession]:
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

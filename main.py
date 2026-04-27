import asyncio
import os
from urllib.parse import quote_plus

from dotenv import load_dotenv
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine

# Load environment variables from .env
load_dotenv()

def get_database_url() -> str:
    # Preferred: full URL
    url = os.getenv("DATABASE_URL", "").strip()
    if url:
        return url

    # Backward-compatible fields (from your previous example)
    user = os.getenv("user", os.getenv("USER", "postgres"))
    password = os.getenv("password", os.getenv("DB_PASSWORD", ""))
    host = os.getenv("host", os.getenv("DB_HOST", "db.isxybsquwqqcybamgvjq.supabase.co"))
    port = os.getenv("port", os.getenv("DB_PORT", "5432"))
    dbname = os.getenv("dbname", os.getenv("DB_NAME", "postgres"))
    if not password:
        raise RuntimeError(
            "Database password is empty. Set DB_PASSWORD (or password) in .env."
        )
    pw = quote_plus(password)
    return f"postgresql+asyncpg://{user}:{pw}@{host}:{port}/{dbname}?ssl=require"


async def main() -> None:
    database_url = get_database_url()
    engine = create_async_engine(database_url, pool_pre_ping=True)
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
        print("Connection successful!")
    except Exception as e:
        print(f"Failed to connect: {e}")
    finally:
        await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())

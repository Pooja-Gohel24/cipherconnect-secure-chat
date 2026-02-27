import os
from pathlib import Path

from dotenv import load_dotenv

# Load environment variables from .env file
env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(env_path)


class Settings:
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql+psycopg://postgres:root@localhost:5432/cipherconnect",
    )
    SECRET_KEY: str = os.getenv("SECRET_KEY", "change-me-in-production")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    REFRESH_TOKEN_EXPIRE_DAYS: int = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    _origins = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173")
    _default_origins = ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174"]
    if _origins:
        origins_list = [o.strip() for o in _origins.split(",") if o.strip()]
    else:
        origins_list = []
    # Always ensure port 5174 is included
    for port_5174 in ["http://localhost:5174", "http://127.0.0.1:5174"]:
        if port_5174 not in origins_list:
            origins_list.append(port_5174)
    FRONTEND_ORIGINS: list[str] = origins_list if origins_list else _default_origins


settings = Settings()

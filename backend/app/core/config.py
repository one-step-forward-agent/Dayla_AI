import os
from dataclasses import dataclass
from pathlib import Path

from dotenv import load_dotenv


load_dotenv()


def _bool(name: str, default: bool = False) -> bool:
    return os.getenv(name, str(default)).strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    database_url: str = os.getenv(
        "DATABASE_URL", "postgresql+asyncpg://postgres:admin@127.0.0.1:5432/focus_day"
    )
    secret_key: str = os.getenv("SECRET_KEY", "change-me")
    storage_path: Path = Path(os.getenv("STORAGE_PATH", "./storage"))
    max_file_size_mb: int = int(os.getenv("MAX_FILE_SIZE_MB", "20"))
    google_client_id: str | None = os.getenv("GOOGLE_CLIENT_ID")
    google_client_secret: str | None = os.getenv("GOOGLE_CLIENT_SECRET")
    google_redirect_uri: str = os.getenv(
        "GOOGLE_REDIRECT_URI", "http://localhost:8000/auth/google/callback"
    )
    gigachat_credentials: str = os.getenv("SBER_AUTHORIZATION_KEY", "")
    gigachat_scope: str = os.getenv("SBER_SCOPE", "GIGACHAT_API_PERS")
    gigachat_model: str = os.getenv("GIGACHAT_MODEL", "GigaChat")
    jwt_algorithm: str = os.getenv("JWT_ALGORITHM", "HS256")
    jwt_expire_minutes: int = int(os.getenv("JWT_EXPIRE_MINUTES", "60"))
    jwt_refresh_expire_days: int = int(os.getenv("JWT_REFRESH_EXPIRE_DAYS", "30"))
    cookie_secure: bool = _bool("COOKIE_SECURE")
    integrations_encryption_key: str | None = os.getenv("INTEGRATIONS_ENCRYPTION_KEY")
    bot_api_token: str | None = os.getenv("BOT_API_TOKEN")
    telegram_bot_username: str | None = os.getenv("TELEGRAM_BOT_USERNAME")
    telegram_bot_token: str | None = os.getenv("TELEGRAM_BOT_TOKEN") or os.getenv("TOKEN")
    default_timezone: str = os.getenv("DEFAULT_TIMEZONE", "Europe/Moscow")


settings = Settings()

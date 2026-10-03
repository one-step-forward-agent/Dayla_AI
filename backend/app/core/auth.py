from datetime import datetime, timedelta, timezone
from uuid import uuid4

import jwt
from pwdlib import PasswordHash

from app.core.config import settings

password_hash = PasswordHash.recommended()

ACCESS_TOKEN = "access"
REFRESH_TOKEN = "refresh"


def hash_password(password: str) -> str:
    return password_hash.hash(password)


def verify_password(password: str, hashed: str | None) -> bool:
    return bool(hashed) and password_hash.verify(password, hashed)


def _create_token(user_id: int, token_type: str, lifetime: timedelta) -> str:
    now = datetime.now(timezone.utc)
    return jwt.encode(
        {"sub": str(user_id), "type": token_type, "jti": uuid4().hex, "iat": now, "exp": now + lifetime},
        settings.secret_key,
        algorithm=settings.jwt_algorithm,
    )


def create_access_token(user_id: int) -> str:
    return _create_token(user_id, ACCESS_TOKEN, timedelta(minutes=settings.jwt_expire_minutes))


def create_refresh_token(user_id: int) -> str:
    return _create_token(user_id, REFRESH_TOKEN, timedelta(days=settings.jwt_refresh_expire_days))


def decode_token(token: str, token_type: str = ACCESS_TOKEN) -> int:
    payload = jwt.decode(
        token,
        settings.secret_key,
        algorithms=[settings.jwt_algorithm],
        options={"require": ["sub", "exp", "type"]},
    )
    if payload.get("type") != token_type:
        raise ValueError("Unexpected token type")
    return int(payload["sub"])


def decode_access_token(token: str) -> int:
    return decode_token(token, ACCESS_TOKEN)

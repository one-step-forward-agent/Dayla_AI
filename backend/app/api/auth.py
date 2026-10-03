from base64 import urlsafe_b64decode, urlsafe_b64encode
from datetime import datetime, timedelta, timezone
import hashlib
import hmac
import json
from urllib.parse import urlencode

import httpx
import jwt
from fastapi import APIRouter, Cookie, Depends, HTTPException, status
from fastapi.responses import JSONResponse, RedirectResponse
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import ACCESS_COOKIE, REFRESH_COOKIE, get_current_user
from app.core.auth import REFRESH_TOKEN, create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.core.config import settings
from app.core.database import get_session
from app.models.models import Calendar, Integration, User
from app.schemas import LoginRequest, RefreshRequest, RegisterRequest, TokenResponse

session_router = APIRouter(prefix="/auth", tags=["auth"])
auth_router = APIRouter(prefix="/auth/google", tags=["auth"])


def _token_response(user_id: int, response: JSONResponse | RedirectResponse | None = None) -> JSONResponse | RedirectResponse:
    access_token = create_access_token(user_id)
    refresh_token = create_refresh_token(user_id)
    body = TokenResponse(access_token=access_token, refresh_token=refresh_token, expires_in=settings.jwt_expire_minutes * 60)
    response = response or JSONResponse(body.model_dump())
    response.set_cookie(
        ACCESS_COOKIE, access_token, httponly=True, samesite="lax", secure=settings.cookie_secure, max_age=settings.jwt_expire_minutes * 60
    )
    response.set_cookie(
        REFRESH_COOKIE,
        refresh_token,
        httponly=True,
        samesite="strict",
        secure=settings.cookie_secure,
        max_age=settings.jwt_refresh_expire_days * 86400,
        path="/auth",
    )
    return response


async def _authenticate(session: AsyncSession, email: str, password: str) -> User:
    user = await session.scalar(select(User).where(User.email == email, User.is_active.is_(True)))
    if not user or not verify_password(password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный email или пароль")
    return user


@session_router.post("/register", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def register(payload: RegisterRequest, session: AsyncSession = Depends(get_session)):
    if await session.scalar(select(User.id).where(User.email == payload.email)):
        raise HTTPException(status_code=409, detail="Пользователь с таким email уже существует")
    user = User(
        email=payload.email,
        name=payload.name,
        timezone=payload.timezone or settings.default_timezone,
        password_hash=hash_password(payload.password),
        is_active=True,
    )
    session.add(user)
    await session.commit()
    response = _token_response(user.id)
    response.status_code = status.HTTP_201_CREATED
    return response


@session_router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, session: AsyncSession = Depends(get_session)):
    user = await _authenticate(session, payload.email, payload.password)
    return _token_response(user.id)


@session_router.post("/token", response_model=TokenResponse, include_in_schema=True)
async def token(form: OAuth2PasswordRequestForm = Depends(), session: AsyncSession = Depends(get_session)):
    """OAuth2 password flow for Swagger and API clients; `username` is the email."""
    user = await _authenticate(session, form.username.strip().lower(), form.password)
    return _token_response(user.id)


@session_router.post("/refresh", response_model=TokenResponse)
async def refresh(
    payload: RefreshRequest | None = None,
    cookie_token: str | None = Cookie(default=None, alias=REFRESH_COOKIE),
    session: AsyncSession = Depends(get_session),
):
    token = (payload.refresh_token if payload else None) or cookie_token
    try:
        user_id = decode_token(token or "", REFRESH_TOKEN)
    except (jwt.InvalidTokenError, ValueError):
        raise HTTPException(status_code=401, detail="Сессия истекла, войдите снова") from None
    user = await session.get(User, user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="Пользователь не найден или отключён")
    return _token_response(user.id)


@session_router.post("/logout")
async def logout():
    response = JSONResponse({"status": "logged_out"})
    response.delete_cookie(ACCESS_COOKIE)
    response.delete_cookie(REFRESH_COOKIE, path="/auth")
    return response


def _oauth_state(user_id: int) -> str:
    payload = urlsafe_b64encode(json.dumps({"user_id": user_id, "expires": int(datetime.now(timezone.utc).timestamp()) + 600}).encode()).decode()
    signature = hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
    return f"{payload}.{signature}"


def _validate_oauth_state(state: str) -> int:
    try:
        payload, signature = state.split(".", 1)
        expected = hmac.new(settings.secret_key.encode(), payload.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(signature, expected):
            raise ValueError
        data = json.loads(urlsafe_b64decode(payload.encode()))
        if int(data["expires"]) < int(datetime.now(timezone.utc).timestamp()):
            raise ValueError
        return int(data["user_id"])
    except (ValueError, KeyError, TypeError, json.JSONDecodeError):
        raise HTTPException(status_code=400, detail="Invalid or expired OAuth state") from None


def google_authorization_url(user_id: int) -> str:
    if not settings.google_client_id:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    query = urlencode(
        {
            "client_id": settings.google_client_id,
            "redirect_uri": settings.google_redirect_uri,
            "response_type": "code",
            "scope": "openid email profile https://www.googleapis.com/auth/calendar",
            "access_type": "offline",
            "prompt": "select_account consent",
            "state": _oauth_state(user_id),
        }
    )
    return f"https://accounts.google.com/o/oauth2/v2/auth?{query}"


@auth_router.get("/login")
async def google_login(user: User = Depends(get_current_user)):
    return {"authorization_url": google_authorization_url(user.id)}


@auth_router.get("/callback")
async def google_callback(
    code: str | None = None,
    state: str | None = None,
    error: str | None = None,
    session: AsyncSession = Depends(get_session),
):
    if error:
        raise HTTPException(status_code=400, detail=f"Google OAuth failed: {error}")
    if not code or not state:
        raise HTTPException(status_code=400, detail="Missing OAuth authorization code")
    if not settings.google_client_id or not settings.google_client_secret:
        raise HTTPException(status_code=503, detail="Google OAuth is not configured")
    user_id = _validate_oauth_state(state)
    async with httpx.AsyncClient(timeout=15) as client:
        response = await client.post(
            "https://oauth2.googleapis.com/token",
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
    if response.is_error:
        raise HTTPException(status_code=400, detail="Google rejected the authorization code")
    token_data = response.json()
    async with httpx.AsyncClient(timeout=15) as client:
        profile_response = await client.get(
            "https://openidconnect.googleapis.com/v1/userinfo",
            headers={"Authorization": f"Bearer {token_data['access_token']}"},
        )
    if profile_response.is_error or not profile_response.json().get("email"):
        raise HTTPException(status_code=400, detail="Google account email was not returned")
    profile = profile_response.json()
    user = await session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401, detail="Пользователь Focus Day не найден")
    integration = await session.scalar(
        select(Integration).where(Integration.user_id == user_id, Integration.provider == "google")
    )
    expires_in = token_data.get("expires_in")
    values = {
        "user_id": user_id,
        "provider": "google",
        "account_email": profile["email"],
        "access_token": token_data["access_token"],
        "refresh_token": token_data.get("refresh_token") or (integration.refresh_token if integration else None),
        "token_expires_at": datetime.now(timezone.utc) + timedelta(seconds=expires_in) if expires_in else None,
        "status": "connected",
        "last_sync_error": None,
    }
    if integration:
        for key, value in values.items():
            setattr(integration, key, value)
    else:
        integration = Integration(config={}, **values)
        session.add(integration)
    await session.flush()
    google_calendar = await session.scalar(
        select(Calendar).where(Calendar.user_id == user_id, Calendar.provider == "google", Calendar.external_id == "primary")
    )
    if not google_calendar:
        session.add(Calendar(user_id=user_id, integration_id=integration.id, name="Google Calendar", provider="google", external_id="primary", timezone="UTC"))
    await session.commit()
    return _token_response(user.id, RedirectResponse(url="/?connected=google", status_code=303))


@auth_router.post("/disconnect")
async def google_disconnect(user: User = Depends(get_current_user), session: AsyncSession = Depends(get_session)):
    integration = await session.scalar(
        select(Integration).where(Integration.user_id == user.id, Integration.provider == "google")
    )
    if integration:
        await session.delete(integration)
        await session.commit()
    return {"status": "disconnected"}

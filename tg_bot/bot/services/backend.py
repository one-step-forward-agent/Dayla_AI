import aiohttp

from bot.config import settings


class BackendError(Exception):
    def __init__(self, status: int, detail: str):
        super().__init__(detail)
        self.status = status
        self.detail = detail


class FocusDayBackend:
    """Client for the backend's /internal/bot API."""

    def __init__(self) -> None:
        self._session: aiohttp.ClientSession | None = None

    async def _request(self, method: str, path: str, json: dict | None = None):
        if not settings.backend_enabled:
            raise BackendError(503, "Focus Day backend is not configured")
        if self._session is None or self._session.closed:
            self._session = aiohttp.ClientSession(
                base_url=settings.BACKEND_URL.rstrip("/") + "/",
                headers={"X-Bot-Token": settings.BOT_API_TOKEN},
                timeout=aiohttp.ClientTimeout(total=20),
            )
        async with self._session.request(method, path.lstrip("/"), json=json) as response:
            data = await response.json(content_type=None) if response.content_length != 0 else None
            if response.status >= 400:
                detail = data.get("detail") if isinstance(data, dict) else None
                raise BackendError(response.status, str(detail or response.reason))
            return data

    async def close(self) -> None:
        if self._session and not self._session.closed:
            await self._session.close()

    async def link(self, code: str, chat_id: int, username: str | None) -> dict:
        return await self._request("POST", "/internal/bot/link", {"code": code, "chat_id": chat_id, "username": username})

    async def unlink(self, chat_id: int) -> None:
        await self._request("POST", f"/internal/bot/unlink/{chat_id}")

    async def reminder_settings(self, chat_id: int) -> dict:
        return await self._request("GET", f"/internal/bot/users/{chat_id}/reminder-settings")

    async def update_reminder_settings(self, chat_id: int, values: dict) -> dict:
        return await self._request("PATCH", f"/internal/bot/users/{chat_id}/reminder-settings", values)

    async def claim_notifications(self, limit: int = 50) -> list[dict]:
        return await self._request("POST", "/internal/bot/notifications/claim", {"limit": limit})

    async def ack_notification(self, notification_id: int, ok: bool, error: str | None = None, chat_unreachable: bool = False) -> None:
        await self._request(
            "POST",
            f"/internal/bot/notifications/{notification_id}/ack",
            {"ok": ok, "error": error, "chat_unreachable": chat_unreachable},
        )


backend = FocusDayBackend()

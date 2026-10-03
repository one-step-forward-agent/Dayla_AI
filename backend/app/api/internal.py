"""Endpoints used by the Telegram bot, authenticated with the shared X-Bot-Token header."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import require_bot
from app.core.database import get_session
from app.models.models import Notification, User
from app.schemas import BotAckRequest, BotClaimRequest, BotLinkRequest, ReminderSettingsRead, ReminderSettingsUpdate
from app.services import reminders

router = APIRouter(prefix="/internal/bot", tags=["bot"], dependencies=[Depends(require_bot)], include_in_schema=False)


async def _user_by_chat(session: AsyncSession, chat_id: int) -> User:
    user = await session.scalar(select(User).where(User.telegram_chat_id == chat_id))
    if not user:
        raise HTTPException(status_code=404, detail="Telegram chat is not linked")
    return user


@router.post("/link")
async def link(payload: BotLinkRequest, session: AsyncSession = Depends(get_session)):
    user = await reminders.link_chat(session, payload.code, payload.chat_id, payload.username)
    if not user:
        raise HTTPException(status_code=404, detail="Link code is invalid or expired")
    return {"email": user.email, "name": user.name}


@router.post("/unlink/{chat_id}")
async def unlink(chat_id: int, session: AsyncSession = Depends(get_session)):
    user = await _user_by_chat(session, chat_id)
    user.telegram_chat_id = None
    user.telegram_username = None
    user.telegram_linked_at = None
    await session.commit()
    return {"status": "unlinked"}


@router.get("/users/{chat_id}/reminder-settings")
async def get_settings(chat_id: int, session: AsyncSession = Depends(get_session)):
    user = await _user_by_chat(session, chat_id)
    reminder_settings = await reminders.get_settings(session, user)
    await session.commit()
    return {"email": user.email, "settings": ReminderSettingsRead.model_validate(reminder_settings)}


@router.patch("/users/{chat_id}/reminder-settings")
async def update_settings(chat_id: int, payload: ReminderSettingsUpdate, session: AsyncSession = Depends(get_session)):
    user = await _user_by_chat(session, chat_id)
    reminder_settings = await reminders.get_settings(session, user)
    reminders.apply_settings(reminder_settings, payload.model_dump(exclude_unset=True))
    await session.commit()
    await session.refresh(reminder_settings)
    return {"email": user.email, "settings": ReminderSettingsRead.model_validate(reminder_settings)}


@router.post("/notifications/claim")
async def claim(payload: BotClaimRequest, session: AsyncSession = Depends(get_session)):
    return await reminders.claim(session, payload.limit)


@router.post("/notifications/{notification_id}/ack")
async def ack(notification_id: int, payload: BotAckRequest, session: AsyncSession = Depends(get_session)):
    notification = await session.get(Notification, notification_id)
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    await reminders.acknowledge(session, notification, payload.ok, payload.error, payload.chat_unreachable)
    return {"status": notification.status}

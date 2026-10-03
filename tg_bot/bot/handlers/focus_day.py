import logging

from aiogram import F, Router
from aiogram.filters import Command, CommandObject, CommandStart
from aiogram.types import CallbackQuery, InlineKeyboardButton, InlineKeyboardMarkup, Message

from bot.config import settings
from bot.services.backend import BackendError, backend
from bot.templates import messages

router = Router()
logger = logging.getLogger(__name__)


def settings_keyboard(values: dict) -> InlineKeyboardMarkup:
    leads = set(values["lead_times"])
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [InlineKeyboardButton(text="⏸ Выключить" if values["enabled"] else "▶️ Включить", callback_data="fd:enabled")],
            [
                InlineKeyboardButton(text=("✅ " if minutes in leads else "") + messages.format_lead(minutes), callback_data=f"fd:lead:{minutes}")
                for minutes in messages.LEAD_PRESETS
            ],
            [InlineKeyboardButton(text=("✅ " if values["daily_digest_enabled"] else "") + "Сводка на день", callback_data="fd:digest")],
        ]
    )


async def send_settings(message: Message, chat_id: int, edit: bool = False) -> None:
    data = await backend.reminder_settings(chat_id)
    text = messages.reminder_settings(data["email"], data["settings"])
    keyboard = settings_keyboard(data["settings"])
    if edit:
        await message.edit_text(text, reply_markup=keyboard)
    else:
        await message.answer(text, reply_markup=keyboard)


# Registered before the generic /start handler, so only deep links with a payload land here.
@router.message(CommandStart(deep_link=True), F.func(lambda _: settings.backend_enabled))
async def handle_link(message: Message, command: CommandObject) -> None:
    try:
        account = await backend.link(command.args or "", message.chat.id, message.from_user.username)
    except BackendError as error:
        await message.answer(messages.link_failed() if error.status in (404, 422) else messages.backend_unavailable())
        return
    except Exception:
        logger.exception("Failed to link chat %s", message.chat.id)
        await message.answer(messages.backend_unavailable())
        return
    await message.answer(messages.account_linked(account["email"]))
    await send_settings(message, message.chat.id)


@router.message(Command("reminders"))
async def handle_reminders(message: Message) -> None:
    try:
        await send_settings(message, message.chat.id)
    except BackendError as error:
        await message.answer(messages.not_linked() if error.status == 404 else messages.backend_unavailable())


@router.message(Command("unlink"))
async def handle_unlink(message: Message) -> None:
    try:
        await backend.unlink(message.chat.id)
    except BackendError as error:
        await message.answer(messages.not_linked() if error.status == 404 else messages.backend_unavailable())
        return
    await message.answer(messages.account_unlinked())


@router.callback_query(F.data.startswith("fd:"))
async def handle_settings_button(callback: CallbackQuery) -> None:
    chat_id = callback.message.chat.id
    try:
        values = (await backend.reminder_settings(chat_id))["settings"]
        action = callback.data.split(":")
        if action[1] == "enabled":
            update = {"enabled": not values["enabled"]}
        elif action[1] == "digest":
            update = {"daily_digest_enabled": not values["daily_digest_enabled"]}
        elif action[1] == "lead" and action[2].isdigit():
            leads = set(values["lead_times"]) ^ {int(action[2])}
            update = {"lead_times": sorted(leads)}
        else:
            await callback.answer()
            return
        await backend.update_reminder_settings(chat_id, update)
        await send_settings(callback.message, chat_id, edit=True)
        await callback.answer("Сохранено ✅")
    except BackendError as error:
        await callback.answer(messages.not_linked() if error.status == 404 else messages.backend_unavailable(), show_alert=True)

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime
from typing import Any, ClassVar


class IntegrationError(Exception):
    """A user-facing failure talking to an external service."""


class PushNotSupported(IntegrationError):
    pass


@dataclass(frozen=True)
class ConfigField:
    name: str
    label: str
    type: str = "text"  # text | password | url | checkbox
    secret: bool = False
    required: bool = True
    placeholder: str = ""
    default: Any = None
    help: str = ""


@dataclass
class RemoteItem:
    external_id: str
    title: str
    start_at: datetime
    end_at: datetime
    all_day: bool = False
    description: str | None = None
    location: str | None = None
    url: str | None = None


@dataclass
class PushResult:
    external_id: str
    url: str | None = None


@dataclass
class EventPayload:
    """The subset of a local event that providers need to export it."""

    title: str
    start_at: datetime
    end_at: datetime
    timezone: str
    all_day: bool = False
    description: str | None = None
    location: str | None = None


@dataclass
class ProviderContext:
    config: dict[str, Any]
    secrets: dict[str, Any]
    timezone: str
    # Providers that rotate tokens put the new values here; the caller persists them.
    updated_secrets: dict[str, Any] = field(default_factory=dict)


class IntegrationProvider(ABC):
    slug: ClassVar[str]
    title: ClassVar[str]
    description: ClassVar[str]
    auth_type: ClassVar[str] = "credentials"  # credentials | oauth
    fields: ClassVar[list[ConfigField]] = []
    supports_push: ClassVar[bool] = True
    # Imported events get "<slug>:<integration id>:<remote id>" unless the provider keeps raw ids.
    scoped_external_ids: ClassVar[bool] = True

    def __init__(self, context: ProviderContext):
        self.context = context
        self.config = context.config
        self.secrets = context.secrets

    @abstractmethod
    async def verify(self) -> str:
        """Check the credentials and return a human-readable account label."""

    @abstractmethod
    async def fetch_items(self, start: datetime, end: datetime) -> list[RemoteItem]:
        """Return items with a date between start and end."""

    async def push_event(self, event: EventPayload) -> PushResult:
        raise PushNotSupported(f"{self.title} does not support export")

    @classmethod
    def split_values(cls, values: dict[str, Any]) -> tuple[dict[str, Any], dict[str, Any]]:
        """Split submitted form values into public config and encrypted secrets."""
        config, secrets = {}, {}
        for item in cls.fields:
            value = values.get(item.name, item.default)
            if isinstance(value, str):
                value = value.strip()
            if item.type == "checkbox":
                value = bool(value)
            if item.required and value in (None, ""):
                raise IntegrationError(f"Поле «{item.label}» обязательно")
            (secrets if item.secret else config)[item.name] = value
        return config, secrets

    @classmethod
    def describe(cls) -> dict[str, Any]:
        return {
            "slug": cls.slug,
            "title": cls.title,
            "description": cls.description,
            "auth_type": cls.auth_type,
            "supports_push": cls.supports_push,
            "fields": [item.__dict__ for item in cls.fields],
        }

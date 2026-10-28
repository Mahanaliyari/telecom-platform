from datetime import datetime, timezone
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, PlainSerializer, field_validator
from pydantic.alias_generators import to_camel

from app.security import validate_password


def _to_utc_iso(value: datetime) -> str:
    """2025-01-15T21:13:38.132Z: the same format the Week 2 API used."""
    return value.astimezone(timezone.utc).isoformat(timespec="milliseconds").replace("+00:00", "Z")


UtcDatetime = Annotated[datetime, PlainSerializer(_to_utc_iso, return_type=str, when_used="json")]


class CamelModel(BaseModel):
    """Python code uses snake_case; the JSON sent to the frontend uses camelCase."""

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
    )


class CallOut(CamelModel):
    id: int
    caller_name: str
    caller_number: str
    receiver_number: str
    city: str
    call_direction: bool  # True = inbound, False = outbound
    call_status: bool  # True = successful
    call_duration: int  # seconds
    call_cost: float
    call_start_time: UtcDatetime
    call_end_time: UtcDatetime


class CallPage(CamelModel):
    items: list[CallOut]
    page: int
    page_size: int
    total: int
    total_pages: int


# ---------- analytics ----------


class SummaryOut(CamelModel):
    total_calls: int
    total_duration_seconds: int
    average_duration_seconds: float
    total_cost: float
    average_cost: float
    successful_calls: int
    failed_calls: int
    incoming_calls: int
    outgoing_calls: int
    longest_call_seconds: int | None
    shortest_call_seconds: int | None


class CallTypeItem(CamelModel):
    type: Literal["incoming", "outgoing"]
    calls: int
    percent: float


class CallTypeDistribution(CamelModel):
    total: int
    items: list[CallTypeItem]


class TopCaller(CamelModel):
    caller_name: str
    calls: int
    total_duration_seconds: int
    total_cost: float
    distinct_numbers: int


class TopCallers(CamelModel):
    items: list[TopCaller]


class CityStat(CamelModel):
    city: str
    calls: int
    total_cost: float
    average_cost: float


class CityStats(CamelModel):
    distinct_cities: int
    items: list[CityStat]


class TimePoint(CamelModel):
    period: str
    calls: int


class CallsOverTime(CamelModel):
    granularity: str
    items: list[TimePoint]


class DurationBucket(CamelModel):
    label: str
    min_seconds: int
    max_seconds: int | None
    calls: int


class DurationDistribution(CamelModel):
    items: list[DurationBucket]


# ---------- authentication ----------


class RegisterRequest(CamelModel):
    email: EmailStr
    password: str
    full_name: str

    @field_validator("email")
    @classmethod
    def lowercase_email(cls, value: str) -> str:
        return value.strip().lower()

    @field_validator("password")
    @classmethod
    def check_password(cls, value: str) -> str:
        return validate_password(value)

    @field_validator("full_name")
    @classmethod
    def clean_name(cls, value: str) -> str:
        name = " ".join(value.split())  # trim and collapse repeated whitespace
        if not 1 <= len(name) <= 120:
            raise ValueError("Name must be between 1 and 120 characters")
        if not name.isprintable():
            raise ValueError("Name contains invalid characters")
        return name


class LoginRequest(CamelModel):
    email: str = Field(max_length=254)
    password: str = Field(max_length=128)


class UserOut(CamelModel):
    id: int
    email: str
    full_name: str
    role: Literal["admin", "analyst"]
    created_at: UtcDatetime


class TokenOut(CamelModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int  # seconds
    user: UserOut


class UserAdminOut(UserOut):
    is_active: bool


class UserList(CamelModel):
    total: int
    items: list[UserAdminOut]

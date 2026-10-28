from dataclasses import dataclass
from datetime import date
from typing import Annotated

from fastapi import HTTPException, Query


@dataclass(frozen=True)
class CallFilters:
    date_from: date | None = None
    date_to: date | None = None
    caller_number: str | None = None
    receiver_number: str | None = None
    city: str | None = None


def get_call_filters(
    date_from: Annotated[
        date | None,
        Query(alias="dateFrom", description="First day to include, YYYY-MM-DD (UTC)."),
    ] = None,
    date_to: Annotated[
        date | None,
        Query(alias="dateTo", description="Last day to include, YYYY-MM-DD (UTC)."),
    ] = None,
    caller_number: Annotated[
        str | None,
        Query(
            alias="callerNumber",
            pattern=r"^\d{0,11}$",
            description="Digits the caller number contains (up to 11).",
        ),
    ] = None,
    receiver_number: Annotated[
        str | None,
        Query(
            alias="receiverNumber",
            pattern=r"^\d{0,11}$",
            description="Digits the receiver number contains (up to 11).",
        ),
    ] = None,
    city: Annotated[
        str | None,
        Query(max_length=120, description="Text the city name contains (case-insensitive)."),
    ] = None,
) -> CallFilters:
    """Shared by every endpoint that filters calls. Empty values count as 'no filter'."""
    if date_from and date_to and date_from > date_to:
        raise HTTPException(status_code=422, detail="dateFrom must not be after dateTo")
    return CallFilters(
        date_from=date_from,
        date_to=date_to,
        caller_number=caller_number or None,
        receiver_number=receiver_number or None,
        city=(city or "").strip() or None,
    )

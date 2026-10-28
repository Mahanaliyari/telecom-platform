from datetime import datetime, time, timezone

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.filters import CallFilters
from app.models import Call


def call_conditions(filters: CallFilters) -> list:
    """Turn the filters that were supplied into SQL WHERE conditions."""
    conditions = []
    if filters.date_from:
        start = datetime.combine(filters.date_from, time.min, tzinfo=timezone.utc)
        conditions.append(Call.call_start_time >= start)
    if filters.date_to:
        end = datetime.combine(filters.date_to, time.max, tzinfo=timezone.utc)
        conditions.append(Call.call_start_time <= end)
    # autoescape=True makes a typed % or _ match literally instead of acting as a wildcard.
    if filters.caller_number:
        conditions.append(Call.caller_number.contains(filters.caller_number, autoescape=True))
    if filters.receiver_number:
        conditions.append(Call.receiver_number.contains(filters.receiver_number, autoescape=True))
    if filters.city:
        conditions.append(Call.city.icontains(filters.city, autoescape=True))
    return conditions


def list_calls(
    db: Session, filters: CallFilters, page: int, page_size: int
) -> tuple[list[Call], int]:
    conditions = call_conditions(filters)
    total = db.scalar(select(func.count()).select_from(Call).where(*conditions)) or 0
    statement = (
        select(Call)
        .where(*conditions)
        # Newest first; id breaks ties so a call can never appear on two pages.
        .order_by(Call.call_start_time.desc(), Call.id.desc())
        .limit(page_size)
        .offset((page - 1) * page_size)
    )
    return list(db.scalars(statement)), total


def get_call(db: Session, call_id: int) -> Call | None:
    return db.get(Call, call_id)

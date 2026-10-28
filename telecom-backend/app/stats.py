"""Aggregate queries. The database does the counting, so only small results travel."""

from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import desc, func, literal_column, select
from sqlalchemy.orm import Session

from app.crud import call_conditions
from app.filters import CallFilters
from app.models import Call

BUCKET_SECONDS = 900  # 15-minute duration buckets
BUCKET_COUNT = 6  # 0-15, 15-30, 30-45, 45-60, 60-75, 75+


def _round2(value) -> float:
    """Round to 2 decimals the conventional way (33.325 -> 33.33).

    Python's round() works on binary floats, which can land just below a tie and round the
    wrong way, so the rounding is done on exact decimals instead.
    """
    return float(Decimal(str(value or 0)).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def summary(db: Session, filters: CallFilters) -> dict:
    row = db.execute(
        select(
            func.count(),
            func.coalesce(func.sum(Call.call_duration), 0),
            func.coalesce(func.avg(Call.call_duration), 0),
            func.coalesce(func.sum(Call.call_cost), 0),
            func.coalesce(func.avg(Call.call_cost), 0),
            func.count().filter(Call.call_status.is_(True)),
            func.count().filter(Call.call_status.is_(False)),
            func.count().filter(Call.call_direction.is_(True)),
            func.count().filter(Call.call_direction.is_(False)),
            func.max(Call.call_duration),
            func.min(Call.call_duration),
        ).where(*call_conditions(filters))
    ).one()
    return {
        "total_calls": row[0],
        "total_duration_seconds": int(row[1]),
        "average_duration_seconds": _round2(row[2]),
        "total_cost": _round2(row[3]),
        "average_cost": _round2(row[4]),
        "successful_calls": row[5],
        "failed_calls": row[6],
        "incoming_calls": row[7],
        "outgoing_calls": row[8],
        "longest_call_seconds": row[9],
        "shortest_call_seconds": row[10],
    }


def call_types(db: Session, filters: CallFilters) -> dict:
    counts = summary(db, filters)
    total = counts["total_calls"]

    def item(kind: str, calls: int) -> dict:
        return {"type": kind, "calls": calls, "percent": _round2(Decimal(100 * calls) / Decimal(total)) if total else 0.0}

    return {
        "total": total,
        "items": [item("incoming", counts["incoming_calls"]), item("outgoing", counts["outgoing_calls"])],
    }


def top_callers(db: Session, filters: CallFilters, limit: int) -> dict:
    calls = func.count().label("calls")
    total_duration = func.sum(Call.call_duration).label("total_duration")
    rows = db.execute(
        select(
            Call.caller_name,
            calls,
            total_duration,
            func.sum(Call.call_cost),
            func.count(func.distinct(Call.caller_number)),
        )
        .where(*call_conditions(filters))
        .group_by(Call.caller_name)
        .order_by(desc(calls), desc(total_duration), Call.caller_name)
        .limit(limit)
    ).all()
    return {
        "items": [
            {
                "caller_name": r[0],
                "calls": r[1],
                "total_duration_seconds": int(r[2]),
                "total_cost": _round2(r[3]),
                "distinct_numbers": r[4],
            }
            for r in rows
        ]
    }


def city_stats(db: Session, filters: CallFilters, sort_by: str, limit: int) -> dict:
    conditions = call_conditions(filters)
    calls = func.count().label("calls")
    total_cost = func.sum(Call.call_cost).label("total_cost")
    order = [desc(calls), desc(total_cost)] if sort_by == "calls" else [desc(total_cost), desc(calls)]
    rows = db.execute(
        select(Call.city, calls, total_cost)
        .where(*conditions)
        .group_by(Call.city)
        .order_by(*order, Call.city)
        .limit(limit)
    ).all()
    distinct = db.scalar(select(func.count(func.distinct(Call.city))).where(*conditions)) or 0
    return {
        "distinct_cities": distinct,
        "items": [
            {
                "city": r[0],
                "calls": r[1],
                "total_cost": _round2(r[2]),
                "average_cost": _round2(r[2] / r[1]),
            }
            for r in rows
        ],
    }


def _month_labels(first: date, last: date) -> list[str]:
    labels, year, month = [], first.year, first.month
    while (year, month) <= (last.year, last.month):
        labels.append(f"{year:04d}-{month:02d}")
        year, month = (year + 1, 1) if month == 12 else (year, month + 1)
    return labels


def _day_labels(first: date, last: date) -> list[str]:
    return [(first + timedelta(days=n)).isoformat() for n in range((last - first).days + 1)]


def calls_over_time(db: Session, filters: CallFilters, granularity: str) -> dict:
    utc_time = func.timezone("UTC", Call.call_start_time)
    if granularity == "hourOfDay":
        period = func.extract("hour", utc_time)
    else:
        # The unit comes from a fixed whitelist, never from user text, so it is safe to inline.
        unit = literal_column("'month'" if granularity == "month" else "'day'")
        period = func.date_trunc(unit, utc_time)
    rows = db.execute(
        select(period.label("period"), func.count())
        .where(*call_conditions(filters))
        .group_by(literal_column("1"))
        .order_by(literal_column("1"))
    ).all()

    if granularity == "hourOfDay":
        found = {int(r[0]): r[1] for r in rows}
        items = [{"period": f"{h:02d}:00", "calls": found.get(h, 0)} for h in range(24)]
    elif not rows:
        items = []
    else:
        first, last = rows[0][0].date(), rows[-1][0].date()
        fmt = "%Y-%m" if granularity == "month" else "%Y-%m-%d"
        found = {r[0].strftime(fmt): r[1] for r in rows}
        labels = _month_labels(first, last) if granularity == "month" else _day_labels(first, last)
        items = [{"period": label, "calls": found.get(label, 0)} for label in labels]  # gaps become 0
    return {"granularity": granularity, "items": items}


def duration_distribution(db: Session, filters: CallFilters) -> dict:
    bucket = func.least(func.floor(Call.call_duration / float(BUCKET_SECONDS)), BUCKET_COUNT - 1)
    rows = db.execute(
        select(bucket, func.count()).where(*call_conditions(filters)).group_by(literal_column("1"))
    ).all()
    found = {int(r[0]): r[1] for r in rows}
    items = []
    for n in range(BUCKET_COUNT):
        low = n * BUCKET_SECONDS // 60
        last = n == BUCKET_COUNT - 1
        items.append(
            {
                "label": f"{low}+ min" if last else f"{low}-{low + BUCKET_SECONDS // 60} min",
                "min_seconds": n * BUCKET_SECONDS,
                "max_seconds": None if last else (n + 1) * BUCKET_SECONDS - 1,
                "calls": found.get(n, 0),
            }
        )
    return {"items": items}

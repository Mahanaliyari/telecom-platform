from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import stats
from app.auth import ADMIN, CurrentUser
from app.database import get_db
from app.filters import CallFilters, get_call_filters
from app.schemas import (
    CallsOverTime,
    CallTypeDistribution,
    CityStats,
    DurationDistribution,
    SummaryOut,
    TopCallers,
)

router = APIRouter(prefix="/analytics", tags=["Analytics"])



def get_analytics_filters(
    filters: Annotated[CallFilters, Depends(get_call_filters)], user: CurrentUser
) -> CallFilters:
    """Same filters as /calls, except analysts may not filter by phone number.

    Filtering by one exact number shrinks the 'aggregate' to a single call and would hand
    an analyst that call's duration, cost and date, which are exactly the raw records
    analysts are not allowed to read.
    """
    if user.role != ADMIN and (filters.caller_number or filters.receiver_number):
        raise HTTPException(
            status_code=403, detail="Only admins can filter analytics by phone number"
        )
    return filters


Filters = Annotated[CallFilters, Depends(get_analytics_filters)]
Db = Annotated[Session, Depends(get_db)]


@router.get("/summary", response_model=SummaryOut, summary="Headline totals and averages")
def get_summary(filters: Filters, db: Db):
    return stats.summary(db, filters)


@router.get(
    "/call-types",
    response_model=CallTypeDistribution,
    summary="Incoming versus outgoing calls",
)
def get_call_types(filters: Filters, db: Db):
    return stats.call_types(db, filters)


@router.get("/top-callers", response_model=TopCallers, summary="Callers ranked by number of calls")
def get_top_callers(
    filters: Filters,
    db: Db,
    limit: Annotated[int, Query(ge=1, le=50, description="How many callers to return.")] = 10,
):
    return stats.top_callers(db, filters, limit)


@router.get("/cities", response_model=CityStats, summary="Cities ranked by calls or by cost")
def get_cities(
    filters: Filters,
    db: Db,
    sort_by: Annotated[
        Literal["calls", "cost"], Query(alias="sortBy", description="Rank by call count or total cost.")
    ] = "calls",
    limit: Annotated[int, Query(ge=1, le=100, description="How many cities to return.")] = 10,
):
    return stats.city_stats(db, filters, sort_by, limit)


@router.get(
    "/calls-over-time",
    response_model=CallsOverTime,
    summary="Number of calls per month, per day or per hour of the day",
)
def get_calls_over_time(
    filters: Filters,
    db: Db,
    granularity: Annotated[
        Literal["hourOfDay", "day", "month"], Query(description="Size of each time bucket (UTC).")
    ] = "month",
):
    return stats.calls_over_time(db, filters, granularity)


@router.get(
    "/duration-distribution",
    response_model=DurationDistribution,
    summary="Calls grouped into 15-minute duration buckets",
)
def get_duration_distribution(filters: Filters, db: Db):
    return stats.duration_distribution(db, filters)

import math
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app import crud
from app.database import get_db
from app.filters import CallFilters, get_call_filters
from app.schemas import CallOut, CallPage

router = APIRouter(prefix="/calls", tags=["Calls"])


@router.get("", response_model=CallPage, summary="List call records (paginated, filterable). Admin only.")
def list_calls(
    filters: Annotated[CallFilters, Depends(get_call_filters)],
    db: Annotated[Session, Depends(get_db)],
    page: Annotated[int, Query(ge=1, le=1_000_000, description="Page number, starting at 1.")] = 1,
    page_size: Annotated[
        int, Query(alias="pageSize", ge=1, le=100, description="Records per page (max 100).")
    ] = 20,
):
    items, total = crud.list_calls(db, filters, page, page_size)
    return CallPage(
        items=items,
        page=page,
        page_size=page_size,
        total=total,
        total_pages=math.ceil(total / page_size),
    )


@router.get("/{call_id}", response_model=CallOut, summary="Get one call record by id. Admin only.")
def get_call(call_id: int, db: Annotated[Session, Depends(get_db)]):
    call = crud.get_call(db, call_id)
    if call is None:
        raise HTTPException(status_code=404, detail=f"Call {call_id} not found")
    return call

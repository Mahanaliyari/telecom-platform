from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app import users
from app.database import get_db
from app.schemas import UserList

router = APIRouter(prefix="/users", tags=["Users (admin)"])


@router.get("", response_model=UserList, summary="List user accounts. Admin only.")
def list_users(
    db: Annotated[Session, Depends(get_db)],
    limit: Annotated[int, Query(ge=1, le=200, description="How many users to return.")] = 100,
):
    items, total = users.list_users(db, limit)
    return UserList(total=total, items=items)

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import users
from app.auth import CurrentUser, unauthorized
from app.database import get_db
from app.schemas import LoginRequest, RegisterRequest, TokenOut, UserOut
from app.security import DUMMY_HASH, create_access_token, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["Authentication"])

Db = Annotated[Session, Depends(get_db)]


@router.post(
    "/register",
    response_model=UserOut,
    status_code=201,
    summary="Create an account (always with the analyst role)",
)
def register(body: RegisterRequest, db: Db):
    # The role is never taken from the request, so nobody can sign themselves up as an admin.
    taken = HTTPException(status_code=409, detail="An account with this email already exists")
    if users.get_by_email(db, body.email):
        raise taken
    try:
        return users.create(
            db,
            email=body.email,
            password_hash=hash_password(body.password),
            full_name=body.full_name,
            role="analyst",
        )
    except IntegrityError:  # two sign-ups with the same email at the same moment
        db.rollback()
        raise taken


@router.post("/login", response_model=TokenOut, summary="Exchange email and password for a token")
def login(body: LoginRequest, db: Db):
    user = users.get_by_email(db, body.email.strip().lower())
    # Unknown email and wrong password produce the same answer after the same amount of work,
    # so the response does not reveal which emails have accounts.
    password_ok = verify_password(body.password, user.password_hash if user else DUMMY_HASH)
    if user is None or not password_ok or not user.is_active:
        raise unauthorized("Invalid email or password")

    token, expires_in = create_access_token(user.id, user.role)
    return TokenOut(access_token=token, expires_in=expires_in, user=user)


@router.get("/me", response_model=UserOut, summary="The user the token belongs to")
def me(user: CurrentUser):
    return user

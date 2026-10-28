from typing import Annotated

import jwt
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app import users
from app.database import get_db
from app.models import User
from app.security import decode_access_token

# auto_error=False lets us return our own structured 401 instead of FastAPI's default.
bearer_scheme = HTTPBearer(
    auto_error=False,
    description="Paste the accessToken returned by POST /api/v1/auth/login.",
)


ADMIN = "admin"
ANALYST = "analyst"


def unauthorized(message: str) -> HTTPException:
    return HTTPException(status_code=401, detail=message, headers={"WWW-Authenticate": "Bearer"})


def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials | None, Depends(bearer_scheme)],
    db: Annotated[Session, Depends(get_db)],
) -> User:
    """Runs on every protected request: checks the token, then loads the user it names."""
    if credentials is None:
        raise unauthorized("Not authenticated")
    try:
        payload = decode_access_token(credentials.credentials)
    except jwt.ExpiredSignatureError:
        raise unauthorized("Token has expired")
    except jwt.InvalidTokenError:
        raise unauthorized("Invalid token")

    try:
        user_id = int(payload["sub"])
    except (KeyError, TypeError, ValueError):
        raise unauthorized("Invalid token")

    # Loading the user each time means a deactivated account stops working immediately.
    user = users.get_by_id(db, user_id)
    if user is None or not user.is_active:
        raise unauthorized("Invalid token")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def require_roles(*allowed: str):
    """Build a dependency that lets only the listed roles through.

    It builds on get_current_user, so a missing or invalid token is still a 401 and
    only a valid user with the wrong role gets a 403. The role comes from the database,
    never from the token, so a role change takes effect on the very next request.
    """

    def check(user: CurrentUser) -> User:
        if user.role not in allowed:
            raise HTTPException(status_code=403, detail="You do not have permission to do this")
        return user

    return check

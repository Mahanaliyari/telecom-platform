from datetime import datetime, timedelta, timezone

import bcrypt
import jwt

from app import config

MIN_PASSWORD_LENGTH = 8
MAX_PASSWORD_BYTES = 72  # bcrypt cannot use more than 72 bytes of a password


def validate_password(password: str) -> str:
    if len(password) < MIN_PASSWORD_LENGTH:
        raise ValueError(f"Password must be at least {MIN_PASSWORD_LENGTH} characters long")
    if len(password.encode("utf-8")) > MAX_PASSWORD_BYTES:
        raise ValueError(f"Password must be at most {MAX_PASSWORD_BYTES} bytes long")
    return password


def hash_password(password: str) -> str:
    """bcrypt adds a random salt, so hashing the same password twice gives different results."""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("ascii")


def verify_password(password: str, password_hash: str) -> bool:
    raw = password.encode("utf-8")
    if len(raw) > MAX_PASSWORD_BYTES:
        return False  # such a password can never have been accepted at registration
    return bcrypt.checkpw(raw, password_hash.encode("ascii"))


# Checked when the email is unknown, so "no such user" takes as long as "wrong password".
DUMMY_HASH = hash_password("this-is-not-a-real-password")


def create_access_token(user_id: int, role: str) -> tuple[str, int]:
    """Returns (token, lifetime in seconds)."""
    now = datetime.now(timezone.utc)
    lifetime = timedelta(minutes=config.ACCESS_TOKEN_EXPIRE_MINUTES)
    claims = {"sub": str(user_id), "role": role, "iat": now, "exp": now + lifetime}
    token = jwt.encode(claims, config.JWT_SECRET, algorithm=config.JWT_ALGORITHM)
    return token, int(lifetime.total_seconds())


def decode_access_token(token: str) -> dict:
    """Raises jwt.ExpiredSignatureError or jwt.InvalidTokenError when the token is not valid."""
    return jwt.decode(
        token,
        config.JWT_SECRET,
        algorithms=[config.JWT_ALGORITHM],  # pinned, so a token cannot choose its own algorithm
        options={"require": ["exp", "sub"]},
    )

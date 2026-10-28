from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.models import User


def get_by_email(db: Session, email: str) -> User | None:
    return db.scalar(select(User).where(User.email == email))


def get_by_id(db: Session, user_id: int) -> User | None:
    return db.get(User, user_id)


def create(db: Session, *, email: str, password_hash: str, full_name: str, role: str) -> User:
    user = User(email=email, password_hash=password_hash, full_name=full_name, role=role)
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def list_users(db: Session, limit: int) -> tuple[list[User], int]:
    total = db.scalar(select(func.count()).select_from(User)) or 0
    return list(db.scalars(select(User).order_by(User.id).limit(limit))), total

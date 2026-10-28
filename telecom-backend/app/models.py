from datetime import datetime
from decimal import Decimal

from sqlalchemy import Boolean, CheckConstraint, DateTime, Integer, Numeric, String, func
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class Call(Base):
    __tablename__ = "calls"
    __table_args__ = (
        CheckConstraint("call_duration >= 0", name="ck_calls_duration_nonneg"),
        CheckConstraint("call_cost >= 0", name="ck_calls_cost_nonneg"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=False)
    caller_name: Mapped[str] = mapped_column(String(120))
    caller_number: Mapped[str] = mapped_column(String(20), index=True)
    receiver_number: Mapped[str] = mapped_column(String(20), index=True)
    city: Mapped[str] = mapped_column(String(120), index=True)
    call_direction: Mapped[bool] = mapped_column(Boolean)  # True = inbound, False = outbound
    call_status: Mapped[bool] = mapped_column(Boolean)  # True = successful
    call_duration: Mapped[int] = mapped_column(Integer)  # seconds
    call_cost: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    call_start_time: Mapped[datetime] = mapped_column(DateTime(timezone=True), index=True)
    call_end_time: Mapped[datetime] = mapped_column(DateTime(timezone=True))


class User(Base):
    __tablename__ = "users"
    __table_args__ = (
        CheckConstraint("role IN ('admin', 'analyst')", name="ck_users_role"),
        CheckConstraint("email = lower(email)", name="ck_users_email_lowercase"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    email: Mapped[str] = mapped_column(String(254), unique=True, index=True)
    password_hash: Mapped[str] = mapped_column(String(128))  # never the password itself
    full_name: Mapped[str] = mapped_column(String(120))
    role: Mapped[str] = mapped_column(String(20), default="analyst")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

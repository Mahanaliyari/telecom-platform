import os
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.auth import ADMIN, ANALYST, require_roles
from app.database import get_db
from app.errors import register_error_handlers
from app.routers import analytics, auth, calls, users

app = FastAPI(
    title="Telecom Intelligence Platform API",
    description="Call Data Record (CDR) access and analytics.",
    version="0.1.0",
)

# The frontend origin is configurable so local development and deployment can use the same API.
origins = [origin.strip() for origin in os.environ.get(
    "CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173"
).split(",") if origin.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
)

register_error_handlers(app)
# Public: sign up and log in. /auth/me needs any valid token (see the router).
app.include_router(auth.router, prefix="/api/v1")

# Role rules. A missing or invalid token is a 401; a valid token with the wrong role is a 403.
app.include_router(calls.router, prefix="/api/v1", dependencies=[Depends(require_roles(ADMIN))])
app.include_router(users.router, prefix="/api/v1", dependencies=[Depends(require_roles(ADMIN))])
app.include_router(
    analytics.router, prefix="/api/v1", dependencies=[Depends(require_roles(ADMIN, ANALYST))]
)


@app.get("/", include_in_schema=False)
def root():
    return {"name": app.title, "version": app.version, "docs": "/docs", "health": "/health"}


@app.get("/health", tags=["System"], summary="Is the API (and its database) up?")
def health(db: Annotated[Session, Depends(get_db)]):
    try:
        db.execute(text("SELECT 1"))
    except SQLAlchemyError:
        raise HTTPException(status_code=503, detail="Database unavailable")
    return {"status": "ok"}

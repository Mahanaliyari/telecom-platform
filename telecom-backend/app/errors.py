import logging
from http import HTTPStatus

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

logger = logging.getLogger("uvicorn.error")


def error_response(
    status_code: int, code: str, message: str, details=None, headers: dict | None = None
) -> JSONResponse:
    """Every error the API returns has this same shape."""
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message, "details": details}},
        headers=headers,
    )


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    if exc.status_code == 422:
        code = "validation_error"
    else:
        code = HTTPStatus(exc.status_code).phrase.lower().replace(" ", "_")
    return error_response(exc.status_code, code, str(exc.detail), None, exc.headers)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    details = [
        {"field": str(error["loc"][-1]), "message": error["msg"].removeprefix("Value error, ")}
        for error in exc.errors()
    ]
    return error_response(422, "validation_error", "Invalid request parameters.", details)


async def unhandled_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled error on %s %s", request.method, request.url.path)
    return error_response(500, "internal_server_error", "An unexpected error occurred.")


def register_error_handlers(app: FastAPI) -> None:
    app.add_exception_handler(StarletteHTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    app.add_exception_handler(Exception, unhandled_exception_handler)

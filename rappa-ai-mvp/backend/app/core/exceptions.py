"""Custom exceptions and comprehensive error handling for Rappa.AI.

This module provides:
- Custom exception classes
- Exception handlers for FastAPI
- Error response formatting
- Error tracking and logging
"""

import logging
import traceback
from typing import Any, Dict, Optional
from datetime import datetime

from fastapi import HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, OperationalError
from pydantic import ValidationError

logger = logging.getLogger(__name__)


# ============================================================================
# CUSTOM EXCEPTIONS
# ============================================================================

class RappaBaseException(Exception):
    """Base exception for all Rappa.AI custom exceptions."""

    def __init__(
        self,
        message: str,
        status_code: int = 500,
        error_code: Optional[str] = None,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.error_code = error_code or self.__class__.__name__
        self.details = details or {}
        super().__init__(self.message)


class InsufficientCreditsError(RappaBaseException):
    """Raised when user has insufficient credits."""

    def __init__(self, required: int, available: int):
        super().__init__(
            message=f"Insufficient credits. Required: {required}, Available: {available}",
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            error_code="INSUFFICIENT_CREDITS",
            details={"required": required, "available": available}
        )


class DocumentProcessingError(RappaBaseException):
    """Raised when document processing fails."""

    def __init__(self, message: str, document_id: Optional[int] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="DOCUMENT_PROCESSING_ERROR",
            details={"document_id": document_id} if document_id else {}
        )


class OCRError(RappaBaseException):
    """Raised when OCR processing fails."""

    def __init__(self, message: str):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="OCR_ERROR"
        )


class StorageError(RappaBaseException):
    """Raised when file storage operations fail."""

    def __init__(self, message: str, operation: Optional[str] = None):
        super().__init__(
            message=message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            error_code="STORAGE_ERROR",
            details={"operation": operation} if operation else {}
        )


class TemplateNotFoundError(RappaBaseException):
    """Raised when requested template is not found."""

    def __init__(self, template_id: str):
        super().__init__(
            message=f"Template not found: {template_id}",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="TEMPLATE_NOT_FOUND",
            details={"template_id": template_id}
        )


class JobNotFoundError(RappaBaseException):
    """Raised when requested job is not found."""

    def __init__(self, job_id: int):
        super().__init__(
            message=f"Job not found: {job_id}",
            status_code=status.HTTP_404_NOT_FOUND,
            error_code="JOB_NOT_FOUND",
            details={"job_id": job_id}
        )


class UnauthorizedAccessError(RappaBaseException):
    """Raised when user attempts unauthorized access."""

    def __init__(self, resource: str):
        super().__init__(
            message=f"Unauthorized access to {resource}",
            status_code=status.HTTP_403_FORBIDDEN,
            error_code="UNAUTHORIZED_ACCESS",
            details={"resource": resource}
        )


# ============================================================================
# ERROR RESPONSE FORMATTING
# ============================================================================

def format_error_response(
    error_code: str,
    message: str,
    status_code: int,
    details: Optional[Dict[str, Any]] = None,
    request_id: Optional[str] = None
) -> Dict[str, Any]:
    """Format a standardized error response.

    Args:
        error_code: Machine-readable error code
        message: Human-readable error message
        status_code: HTTP status code
        details: Additional error details
        request_id: Unique request identifier for tracking

    Returns:
        Formatted error response dictionary
    """
    response = {
        "error": {
            "code": error_code,
            "message": message,
            "status": status_code,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    }

    if details:
        response["error"]["details"] = details

    if request_id:
        response["error"]["request_id"] = request_id

    return response


# ============================================================================
# EXCEPTION HANDLERS
# ============================================================================

async def rappa_exception_handler(request: Request, exc: RappaBaseException) -> JSONResponse:
    """Handle custom Rappa.AI exceptions.

    Args:
        request: FastAPI request object
        exc: RappaBaseException instance

    Returns:
        JSONResponse with error details
    """
    logger.warning(
        f"RappaException on {request.url.path}: {exc.error_code} - {exc.message}",
        extra={
            "error_code": exc.error_code,
            "status_code": exc.status_code,
            "details": exc.details,
            "path": request.url.path,
            "method": request.method
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            error_code=exc.error_code,
            message=exc.message,
            status_code=exc.status_code,
            details=exc.details,
            request_id=request.headers.get("X-Request-ID")
        )
    )


async def http_exception_handler(request: Request, exc: HTTPException) -> JSONResponse:
    """Handle FastAPI HTTPException.

    Args:
        request: FastAPI request object
        exc: HTTPException instance

    Returns:
        JSONResponse with error details
    """
    logger.warning(
        f"HTTPException on {request.url.path}: {exc.status_code} - {exc.detail}",
        extra={
            "status_code": exc.status_code,
            "detail": exc.detail,
            "path": request.url.path,
            "method": request.method
        }
    )

    return JSONResponse(
        status_code=exc.status_code,
        content=format_error_response(
            error_code="HTTP_ERROR",
            message=exc.detail if isinstance(exc.detail, str) else str(exc.detail),
            status_code=exc.status_code,
            request_id=request.headers.get("X-Request-ID")
        )
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Handle Pydantic validation errors.

    Args:
        request: FastAPI request object
        exc: RequestValidationError instance

    Returns:
        JSONResponse with validation error details
    """
    errors = exc.errors()
    logger.warning(
        f"Validation error on {request.url.path}",
        extra={
            "errors": errors,
            "path": request.url.path,
            "method": request.method
        }
    )

    # Format validation errors for better readability
    formatted_errors = []
    for error in errors:
        formatted_errors.append({
            "field": " -> ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"]
        })

    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=format_error_response(
            error_code="VALIDATION_ERROR",
            message="Request validation failed",
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            details={"errors": formatted_errors},
            request_id=request.headers.get("X-Request-ID")
        )
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    """Handle SQLAlchemy database errors.

    Args:
        request: FastAPI request object
        exc: SQLAlchemyError instance

    Returns:
        JSONResponse with error details
    """
    error_message = "A database error occurred"
    error_code = "DATABASE_ERROR"
    details = {}

    # Handle specific database errors
    if isinstance(exc, IntegrityError):
        error_code = "INTEGRITY_ERROR"
        error_message = "Database integrity constraint violation"
        # Extract useful info from integrity error
        if "duplicate key" in str(exc).lower():
            error_message = "Duplicate entry. This record already exists."
        elif "foreign key" in str(exc).lower():
            error_message = "Referenced record not found or in use."

    elif isinstance(exc, OperationalError):
        error_code = "DATABASE_OPERATIONAL_ERROR"
        error_message = "Database connection or operation error"

    logger.error(
        f"Database error on {request.url.path}: {type(exc).__name__}",
        exc_info=True,
        extra={
            "error_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method
        }
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            error_code=error_code,
            message=error_message,
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            details=details,
            request_id=request.headers.get("X-Request-ID")
        )
    )


async def general_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    """Handle all uncaught exceptions.

    Args:
        request: FastAPI request object
        exc: Exception instance

    Returns:
        JSONResponse with error details
    """
    # Log full traceback for debugging
    logger.error(
        f"Unhandled exception on {request.url.path}: {type(exc).__name__} - {str(exc)}",
        exc_info=True,
        extra={
            "exception_type": type(exc).__name__,
            "path": request.url.path,
            "method": request.method,
            "traceback": traceback.format_exc()
        }
    )

    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=format_error_response(
            error_code="INTERNAL_SERVER_ERROR",
            message="An unexpected error occurred. Our team has been notified.",
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            request_id=request.headers.get("X-Request-ID")
        )
    )


# ============================================================================
# EXCEPTION HANDLER REGISTRATION
# ============================================================================

def register_exception_handlers(app):
    """Register all exception handlers with FastAPI app.

    Args:
        app: FastAPI application instance
    """
    # Custom Rappa exceptions
    app.add_exception_handler(RappaBaseException, rappa_exception_handler)

    # FastAPI exceptions
    app.add_exception_handler(HTTPException, http_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)

    # Database exceptions
    app.add_exception_handler(SQLAlchemyError, database_exception_handler)

    # Catch-all for any other exceptions
    app.add_exception_handler(Exception, general_exception_handler)

    logger.info("Exception handlers registered successfully")

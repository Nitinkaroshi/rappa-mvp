"""Security utilities for password hashing and verification.

This module provides secure password hashing using bcrypt and
cookie-based authentication.
"""

import logging
from passlib.context import CryptContext
from fastapi import Request, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional

logger = logging.getLogger(__name__)

# Configure password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    """Hash a plain-text password using bcrypt.

    Args:
        password: Plain-text password to hash

    Returns:
        str: Hashed password

    Example:
        hashed = hash_password("my_secure_password")
    """
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plain-text password against a hashed password.

    Args:
        plain_password: Plain-text password to verify
        hashed_password: Hashed password to compare against

    Returns:
        bool: True if password matches, False otherwise

    Example:
        is_valid = verify_password("user_input", stored_hash)
    """
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        logger.error(f"Password verification error: {str(e)}")
        return False


def validate_password_strength(password: str) -> tuple[bool, str]:
    """Validate password meets security requirements.

    Password must:
    - Be at least 8 characters long
    - Contain at least one uppercase letter (if required in config)
    - Contain at least one lowercase letter (if required in config)
    - Contain at least one digit (if required in config)

    Args:
        password: Password to validate

    Returns:
        tuple: (is_valid, error_message)

    Example:
        is_valid, error = validate_password_strength("MyPass123")
        if not is_valid:
            print(error)
    """
    from app.config import settings

    if len(password) < settings.PASSWORD_MIN_LENGTH:
        return False, f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long"

    if settings.PASSWORD_REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"

    if settings.PASSWORD_REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"

    if settings.PASSWORD_REQUIRE_DIGITS and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"

    if settings.PASSWORD_REQUIRE_SPECIAL:
        special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
        if not any(c in special_chars for c in password):
            return False, "Password must contain at least one special character"

    return True, ""


class CookieBearer(HTTPBearer):
    """
    Custom authentication class that supports both:
    1. HTTP Authorization header (Bearer token)
    2. HTTP-only cookies (access_token)

    This allows the same endpoint to work with both API clients
    (using Authorization header) and browsers (using cookies).
    """

    async def __call__(self, request: Request) -> Optional[str]:
        """
        Extract authentication token from request.

        Priority:
        1. Authorization header (for API clients)
        2. access_token cookie (for browsers)

        Args:
            request: FastAPI request object

        Returns:
            str: JWT token

        Raises:
            HTTPException: If no valid authentication found
        """
        # Try Authorization header first (for API clients, mobile apps, etc.)
        authorization = request.headers.get("Authorization")
        if authorization:
            try:
                credentials: HTTPAuthorizationCredentials = await super().__call__(request)
                return credentials.credentials
            except HTTPException:
                pass  # Fall through to cookie check

        # Try cookie (for browser-based clients)
        token = request.cookies.get("access_token")
        if token:
            return token

        # No authentication found
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated. Please login.",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Create singleton instance
cookie_bearer = CookieBearer(auto_error=False)

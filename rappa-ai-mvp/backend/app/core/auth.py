"""JWT authentication utilities for token creation and validation.

This module provides JWT token management for user authentication.
"""

import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import get_db
from app.core.security import cookie_bearer
from app.models.user import User

logger = logging.getLogger(__name__)

# HTTP Bearer token scheme (fallback, prefer cookie_bearer)
security = HTTPBearer()


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create a JWT access token.

    Args:
        data: Dictionary of claims to encode in the token
        expires_delta: Optional custom expiration time

    Returns:
        str: Encoded JWT token

    Example:
        token = create_access_token({"sub": user.email})
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(seconds=settings.jwt_expiration_seconds)

    to_encode.update({"exp": expire, "iat": datetime.now(timezone.utc)})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM
    )

    return encoded_jwt


def decode_access_token(token: str) -> Optional[dict]:
    """Decode and validate a JWT access token.

    Args:
        token: JWT token to decode

    Returns:
        dict: Decoded token payload, or None if invalid

    Example:
        payload = decode_access_token(token)
        if payload:
            email = payload.get("sub")
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except JWTError as e:
        logger.warning(f"JWT decode error: {str(e)}")
        return None


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """Get the current authenticated user from JWT token.

    This is a FastAPI dependency that:
    1. Extracts the JWT token from Authorization header OR cookies
    2. Validates and decodes the token
    3. Retrieves the user from the database
    4. Returns the user object

    Supports both:
    - Authorization: Bearer <token> (for API clients)
    - HTTP-only cookie 'access_token' (for browsers)

    Args:
        request: FastAPI request object
        db: Database session

    Returns:
        User: The authenticated user object

    Raises:
        HTTPException: If token is invalid or user not found

    Example:
        @app.get("/me")
        def get_me(current_user: User = Depends(get_current_user)):
            return current_user.to_dict()
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials. Please login.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # Extract token from Authorization header or cookie
    token = None

    # Try Authorization header first (for API clients)
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.startswith("Bearer "):
        token = auth_header.split(" ")[1]

    # Try cookie if no header (for browsers)
    if not token:
        token = request.cookies.get("access_token")

    if not token:
        raise credentials_exception

    # Decode token
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    # Extract email from token
    email: str = payload.get("sub")
    if email is None:
        raise credentials_exception

    # Get user from database
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise credentials_exception

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    return user


def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get the current active user.

    This is a stricter version of get_current_user that also checks
    if the user account is verified (if verification is required).

    Args:
        current_user: User from get_current_user dependency

    Returns:
        User: The authenticated and active user

    Raises:
        HTTPException: If user is not active or verified

    Example:
        @app.post("/upload")
        def upload_file(
            file: UploadFile,
            current_user: User = Depends(get_current_active_user)
        ):
            # Only active/verified users can upload
            ...
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Inactive user"
        )

    # Uncomment this if you want to enforce email verification
    # if not current_user.is_verified:
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Email not verified"
    #     )

    return current_user


def create_user_token(user: User) -> dict:
    """Create a complete authentication response for a user.

    Args:
        user: User object to create token for

    Returns:
        dict: Authentication response with token and user data

    Example:
        response = create_user_token(user)
        # Returns: {
        #   "access_token": "eyJ...",
        #   "token_type": "bearer",
        #   "user": {...}
        # }
    """
    access_token = create_access_token(data={"sub": user.email})

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user.to_dict()
    }

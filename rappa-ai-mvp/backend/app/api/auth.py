"""Authentication API endpoints for signup, login, and user management."""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_db
from app.core.security import hash_password, verify_password, validate_password_strength
from app.core.auth import get_current_user, create_user_token
from app.models.user import User
from app.config import settings
from app.services.email_service import get_email_service

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class SignupRequest(BaseModel):
    """Request schema for user signup."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")


class LoginRequest(BaseModel):
    """Request schema for user login."""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")


class AuthResponse(BaseModel):
    """Response schema for authentication endpoints."""
    access_token: str
    token_type: str
    user: dict


class UserResponse(BaseModel):
    """Response schema for user data."""
    id: int
    email: str
    credits: int
    is_active: bool
    is_verified: bool
    created_at: str
    last_login: str | None


class VerifyEmailRequest(BaseModel):
    """Request schema for email verification."""
    token: str = Field(..., description="Email verification token")


class ForgotPasswordRequest(BaseModel):
    """Request schema for forgot password."""
    email: EmailStr = Field(..., description="User email address")


class ResetPasswordRequest(BaseModel):
    """Request schema for password reset."""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, description="New password")


class ChangeEmailRequest(BaseModel):
    """Request schema for email change."""
    new_email: EmailStr = Field(..., description="New email address")
    password: str = Field(..., description="Current password for verification")


class VerifyEmailChangeRequest(BaseModel):
    """Request schema for email change verification."""
    token: str = Field(..., description="Email change verification token")


# ============================================================================
# Authentication Endpoints
# ============================================================================

@router.post("/signup", status_code=status.HTTP_201_CREATED)
def signup(
    request: SignupRequest,
    db: Session = Depends(get_db)
):
    """Register a new user account with email verification.

    Creates a new user with:
    - Email (unique)
    - Hashed password
    - Initial credits (from config)
    - Active status
    - Verification token (email sent)

    Args:
        request: Signup request with email and password
        db: Database session

    Returns:
        dict: Success message and email sent status

    Raises:
        HTTPException 400: If email already exists or password is weak
    """
    # Check if user already exists
    existing_user = db.query(User).filter(User.email == request.email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Validate password strength
    is_valid, error_message = validate_password_strength(request.password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )

    # Generate verification token
    verification_token = str(uuid.uuid4())
    verification_expires = datetime.now(timezone.utc) + timedelta(hours=24)

    # Auto-verify in development mode for testing
    auto_verify = settings.ENVIRONMENT == "development"

    # Create new user
    hashed_password = hash_password(request.password)
    new_user = User(
        email=request.email,
        password_hash=hashed_password,
        credits=settings.DEFAULT_CREDITS,
        is_active=True,
        is_verified=auto_verify,  # Auto-verify in development
        verification_token=None if auto_verify else verification_token,
        verification_token_expires=None if auto_verify else verification_expires,
        verified_at=datetime.now(timezone.utc) if auto_verify else None
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    logger.info(f"New user created: {new_user.email} (auto-verified: {auto_verify})")

    # Send verification email (skip if auto-verified)
    email_sent = False
    if not auto_verify:
        email_service = get_email_service()
        email_sent = email_service.send_verification_email(new_user.email, verification_token)

        if not email_sent:
            logger.warning(f"Failed to send verification email to {new_user.email}")

    message = "Account created successfully and auto-verified (development mode)." if auto_verify else "Account created successfully. Please check your email to verify your account."

    return {
        "message": message,
        "email": new_user.email,
        "email_sent": email_sent,
        "auto_verified": auto_verify
    }


@router.post("/login", response_model=AuthResponse)
def login(
    request: LoginRequest,
    response: Response,
    db: Session = Depends(get_db)
):
    """Authenticate user and return JWT token.

    Validates credentials and returns a JWT token for authenticated requests.
    Also sets HTTP-only cookies for browser-based authentication.
    Requires email verification before login is allowed.

    Args:
        request: Login request with email and password
        response: FastAPI response object (for setting cookies)
        db: Database session

    Returns:
        AuthResponse: JWT token and user data

    Raises:
        HTTPException 401: If credentials are invalid
        HTTPException 403: If email not verified or account inactive
    """
    # Find user by email
    user = db.query(User).filter(User.email == request.email).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Verify password
    if not verify_password(request.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    # Check if user is active
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive"
        )

    # Check if email is verified
    if not user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email before logging in. Check your inbox for the verification link."
        )

    # Update last login timestamp
    user.last_login = datetime.now(timezone.utc)
    db.commit()

    logger.info(f"User logged in: {user.email}")

    # Create JWT token
    auth_response = create_user_token(user)

    # Set HTTP-only cookie for browser authentication
    response.set_cookie(
        key="access_token",
        value=auth_response["access_token"],
        httponly=True,  # Cannot be accessed by JavaScript
        secure=settings.ENVIRONMENT == "production",  # Only HTTPS in production
        samesite="lax",  # CSRF protection
        max_age=settings.jwt_expiration_seconds,  # Cookie expiry matches token expiry
        path="/"
    )

    logger.info(f"HTTP-only cookie set for user: {user.email}")

    return auth_response


@router.get("/me", response_model=UserResponse)
def get_current_user_info(
    current_user: User = Depends(get_current_user)
):
    """Get current authenticated user information.

    Returns the profile data for the authenticated user.

    Args:
        current_user: Authenticated user from JWT token

    Returns:
        UserResponse: Current user data
    """
    return current_user.to_dict()


@router.post("/logout")
def logout(response: Response):
    """Logout endpoint - clears authentication cookies.

    Clears the HTTP-only access_token cookie to log the user out.
    Also works with Authorization header clients (they just delete the token).

    Args:
        response: FastAPI response object (for clearing cookies)

    Returns:
        dict: Logout confirmation message
    """
    # Clear the HTTP-only cookie by setting it with max_age=0
    # This is more reliable than delete_cookie for cross-origin scenarios
    response.set_cookie(
        key="access_token",
        value="",  # Empty value
        httponly=True,
        secure=settings.ENVIRONMENT == "production",
        samesite="lax",
        max_age=0,  # Expire immediately
        path="/"
    )

    logger.info("User logged out - cookie cleared")

    return {"message": "Logout successful. Cookie cleared."}


@router.get("/credits/history")
def get_credit_history(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get credit transaction history for the current user.

    Args:
        limit: Maximum number of transactions to return
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        dict: Credit history with transactions
    """
    from app.models.credit import CreditLog

    transactions = db.query(CreditLog)\
        .filter(CreditLog.user_id == current_user.id)\
        .order_by(CreditLog.timestamp.desc())\
        .limit(limit)\
        .all()

    return {
        "current_balance": current_user.credits,
        "transactions": [
            {
                "id": t.id,
                "amount": t.amount,
                "reason": t.reason,
                "timestamp": t.timestamp.isoformat(),
                "balance_after": current_user.credits  # Simplified for now
            }
            for t in transactions
        ]
    }


# ============================================================================
# Email Verification Endpoints
# ============================================================================

@router.post("/verify-email", response_model=AuthResponse)
def verify_email(
    request: VerifyEmailRequest,
    db: Session = Depends(get_db)
):
    """Verify user email with token.

    Validates the verification token and marks the user as verified.
    Returns a JWT token for automatic login after verification.

    Args:
        request: Verification request with token
        db: Database session

    Returns:
        AuthResponse: JWT token and user data

    Raises:
        HTTPException 400: If token is invalid or expired
    """
    # Find user by verification token
    user = db.query(User).filter(User.verification_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid verification token"
        )

    # Check if already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Check if token expired
    if datetime.now(timezone.utc) > user.verification_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token has expired. Please request a new verification email."
        )

    # Verify user
    user.is_verified = True
    user.verified_at = datetime.now(timezone.utc)
    user.verification_token = None
    user.verification_token_expires = None
    user.last_login = datetime.now(timezone.utc)

    db.commit()
    db.refresh(user)

    logger.info(f"Email verified for user: {user.email}")

    # Create and return JWT token for auto-login
    return create_user_token(user)


@router.post("/resend-verification")
def resend_verification(
    email: EmailStr,
    db: Session = Depends(get_db)
):
    """Resend email verification link.

    Generates a new verification token and sends it to the user's email.

    Args:
        email: User's email address
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException 400: If email not found or already verified
    """
    user = db.query(User).filter(User.email == email).first()

    # Don't reveal if email exists for security
    if not user:
        return {
            "message": "If the email exists and is not verified, a verification link has been sent."
        }

    # Check if already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already verified"
        )

    # Generate new verification token
    user.verification_token = str(uuid.uuid4())
    user.verification_token_expires = datetime.now(timezone.utc) + timedelta(hours=24)
    db.commit()

    # Send verification email
    email_service = get_email_service()
    email_sent = email_service.send_verification_email(user.email, user.verification_token)

    if email_sent:
        logger.info(f"Resent verification email to: {user.email}")
    else:
        logger.warning(f"Failed to resend verification email to: {user.email}")

    return {
        "message": "Verification email sent. Please check your inbox.",
        "email_sent": email_sent
    }


# ============================================================================
# Password Reset Endpoints
# ============================================================================

@router.post("/forgot-password")
def forgot_password(
    request: ForgotPasswordRequest,
    db: Session = Depends(get_db)
):
    """Request password reset link.

    Generates a reset token and sends it to the user's email.
    Always returns success to prevent email enumeration attacks.

    Args:
        request: Forgot password request with email
        db: Database session

    Returns:
        dict: Success message
    """
    print(f"\n{'='*80}")
    print(f"🔵 [AUTH] Forgot password request received for email: {request.email}")
    print(f"{'='*80}\n")
    logger.info(f"🔵 [AUTH] Forgot password request received for email: {request.email}")

    user = db.query(User).filter(User.email == request.email).first()
    print(f"🔵 [AUTH] User query result: {user}")

    # Always return success message to prevent email enumeration
    if not user:
        logger.info(f"🔵 [AUTH] User not found for email: {request.email}")
        return {
            "message": "If the email exists, a password reset link has been sent."
        }

    logger.info(f"🔵 [AUTH] User found: {user.email}, generating reset token...")

    # Generate reset token (expires in 1 hour)
    user.reset_token = str(uuid.uuid4())
    user.reset_token_expires = datetime.now(timezone.utc) + timedelta(hours=1)
    db.commit()

    logger.info(f"🔵 [AUTH] Reset token generated: {user.reset_token}")
    logger.info(f"🔵 [AUTH] Calling email service to send reset email...")

    # Send reset email
    email_service = get_email_service()
    email_sent = email_service.send_password_reset_email(user.email, user.reset_token)

    if email_sent:
        logger.info(f"✅ [AUTH] Password reset email sent successfully to: {user.email}")
    else:
        logger.error(f"❌ [AUTH] Failed to send password reset email to: {user.email}")

    return {
        "message": "If the email exists, a password reset link has been sent."
    }


@router.post("/reset-password")
def reset_password(
    request: ResetPasswordRequest,
    db: Session = Depends(get_db)
):
    """Reset password with token.

    Validates the reset token and updates the user's password.

    Args:
        request: Reset password request with token and new password
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException 400: If token is invalid, expired, or password is weak
    """
    # Find user by reset token
    user = db.query(User).filter(User.reset_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid reset token"
        )

    # Check if token expired
    if datetime.now(timezone.utc) > user.reset_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Reset token has expired. Please request a new password reset."
        )

    # Validate new password strength
    is_valid, error_message = validate_password_strength(request.new_password)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_message
        )

    # Update password
    user.password_hash = hash_password(request.new_password)
    user.reset_token = None
    user.reset_token_expires = None
    db.commit()

    logger.info(f"Password reset successful for user: {user.email}")

    return {
        "message": "Password reset successfully. You can now login with your new password."
    }


# ============================================================================
# Email Change Endpoints
# ============================================================================

@router.post("/change-email/request")
def request_email_change(
    request: ChangeEmailRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Request email change with verification.

    Validates the current password and sends a verification email to the NEW email address.
    The email change will only be completed after the new email is verified.

    Args:
        request: Email change request with new email and current password
        current_user: Authenticated user from JWT token
        db: Database session

    Returns:
        dict: Success message

    Raises:
        HTTPException 400: If new email is invalid, already in use, or password is incorrect
    """
    # Verify current password
    if not verify_password(request.password, current_user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Incorrect password"
        )

    # Check if new email is same as current
    if request.new_email == current_user.email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New email is the same as your current email"
        )

    # Check if new email is already in use
    existing_user = db.query(User).filter(User.email == request.new_email).first()
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use by another account"
        )

    # Check if there's a pending email change to this address
    pending_user = db.query(User).filter(User.pending_email == request.new_email).first()
    if pending_user and pending_user.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already pending verification by another account"
        )

    # Generate email change token (expires in 1 hour)
    email_change_token = str(uuid.uuid4())
    email_change_expires = datetime.now(timezone.utc) + timedelta(hours=1)

    # Store pending email change
    current_user.pending_email = request.new_email
    current_user.email_change_token = email_change_token
    current_user.email_change_token_expires = email_change_expires
    db.commit()

    # Send verification email to NEW email address
    email_service = get_email_service()
    email_sent = email_service.send_email_change_verification(request.new_email, email_change_token)

    if email_sent:
        logger.info(f"Email change verification sent to: {request.new_email} for user: {current_user.email}")
    else:
        logger.warning(f"Failed to send email change verification to: {request.new_email}")

    return {
        "message": f"Verification email sent to {request.new_email}. Please check your inbox to complete the email change.",
        "pending_email": request.new_email,
        "email_sent": email_sent
    }


@router.post("/change-email/verify")
def verify_email_change(
    request: VerifyEmailChangeRequest,
    db: Session = Depends(get_db)
):
    """Verify and complete email change.

    Validates the email change token and updates the user's email address.

    Args:
        request: Email change verification request with token
        db: Database session

    Returns:
        dict: Success message with new email

    Raises:
        HTTPException 400: If token is invalid or expired
    """
    # Find user by email change token
    user = db.query(User).filter(User.email_change_token == request.token).first()

    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email change token"
        )

    # Check if token expired
    if datetime.now(timezone.utc) > user.email_change_token_expires:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email change token has expired. Please request a new email change."
        )

    # Verify the new email is not taken (race condition check)
    existing_user = db.query(User).filter(User.email == user.pending_email).first()
    if existing_user:
        # Clear pending email change
        user.pending_email = None
        user.email_change_token = None
        user.email_change_token_expires = None
        db.commit()

        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already in use. Email change cancelled."
        )

    # Update email
    old_email = user.email
    user.email = user.pending_email
    user.pending_email = None
    user.email_change_token = None
    user.email_change_token_expires = None
    db.commit()

    logger.info(f"Email changed successfully from {old_email} to {user.email}")

    return {
        "message": "Email changed successfully. Please use your new email for future logins.",
        "new_email": user.email
    }

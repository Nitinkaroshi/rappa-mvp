"""User database model for authentication and credit tracking."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, Boolean
from sqlalchemy.orm import relationship

from app.core.database import Base


class User(Base):
    """User model for authentication and account management.

    This model stores user account information including:
    - Authentication credentials (email, password hash)
    - Credit balance for document processing
    - Account status and timestamps
    """

    __tablename__ = "users"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Authentication
    email = Column(String(255), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)

    # Credits System
    credits = Column(Integer, default=10, nullable=False)

    # Account Status
    is_active = Column(Boolean, default=True, nullable=False)
    is_verified = Column(Boolean, default=False, nullable=False)

    # Email Verification
    verification_token = Column(String(255), nullable=True, index=True)
    verification_token_expires = Column(DateTime, nullable=True)
    verified_at = Column(DateTime, nullable=True)

    # Password Reset
    reset_token = Column(String(255), nullable=True, index=True)
    reset_token_expires = Column(DateTime, nullable=True)

    # Email Change
    pending_email = Column(String(255), nullable=True)
    email_change_token = Column(String(255), nullable=True, index=True)
    email_change_token_expires = Column(DateTime, nullable=True)

    # Timestamps
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc), nullable=False)
    last_login = Column(DateTime, nullable=True)

    # Relationships
    jobs = relationship("Job", back_populates="user", cascade="all, delete-orphan")
    credit_logs = relationship("CreditLog", back_populates="user", cascade="all, delete-orphan")
    custom_fields = relationship("CustomField", back_populates="user", cascade="all, delete-orphan")
    tickets = relationship("Ticket", back_populates="user", cascade="all, delete-orphan")
    custom_templates = relationship("CustomTemplate", back_populates="user", cascade="all, delete-orphan")
    batches = relationship("Batch", back_populates="user", cascade="all, delete-orphan")
    accounting_configs = relationship("AccountingConfig", back_populates="user", cascade="all, delete-orphan")
    accounting_exports = relationship("AccountingExportHistory", back_populates="user", cascade="all, delete-orphan")

    def __repr__(self) -> str:
        """String representation of User."""
        return f"<User(id={self.id}, email='{self.email}', credits={self.credits})>"

    def to_dict(self) -> dict:
        """Convert user to dictionary (excludes password_hash).

        Returns:
            dict: User data without sensitive information
        """
        return {
            "id": self.id,
            "email": self.email,
            "credits": self.credits,
            "is_active": self.is_active,
            "is_verified": self.is_verified,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "last_login": self.last_login.isoformat() if self.last_login else None,
        }

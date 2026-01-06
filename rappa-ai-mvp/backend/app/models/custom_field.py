"""Custom fields database model for user-defined fields on documents."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class CustomField(Base):
    """Custom field model for user-defined fields added to jobs.

    This model allows users to add their own custom fields to any job/document:
    - Field name (user-defined label)
    - Field value (user-entered data)
    - Field type (text, number, date, etc.)
    - Linked to specific job and user
    """

    __tablename__ = "custom_fields"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Keys
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Field Information
    field_name = Column(String(100), nullable=False)  # e.g., "Notes", "Reference Number", "Department"
    field_value = Column(Text, nullable=True)  # The actual value entered by user
    field_type = Column(String(20), default="text", nullable=False)  # "text", "number", "date", "email", etc.

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="custom_fields")
    user = relationship("User", back_populates="custom_fields")

    def __repr__(self) -> str:
        """String representation of CustomField."""
        return f"<CustomField(id={self.id}, field_name='{self.field_name}', job_id={self.job_id})>"

    def to_dict(self) -> dict:
        """Convert custom field to dictionary.

        Returns:
            dict: Custom field data
        """
        return {
            "id": self.id,
            "job_id": self.job_id,
            "user_id": self.user_id,
            "field_name": self.field_name,
            "field_value": self.field_value,
            "field_type": self.field_type,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

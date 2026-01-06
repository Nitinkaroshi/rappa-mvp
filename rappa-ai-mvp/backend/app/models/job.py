"""Job database model for document processing tracking."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, ForeignKey, Enum as SQLEnum, JSON, Index
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class JobStatus(str, enum.Enum):
    """Job processing status enumeration."""

    QUEUED = "queued"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


class Job(Base):
    """Job model for tracking document processing tasks.

    This model stores information about each document processing job:
    - File metadata (name, type, S3 path)
    - Processing status and timestamps
    - Error messages if processing failed
    - Relationship to extracted fields
    """

    __tablename__ = "jobs"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # File Information
    filename = Column(String(255), nullable=False)
    s3_path = Column(String(500), nullable=False)
    file_type = Column(String(10), nullable=False)  # pdf, jpg, png
    file_hash = Column(String(64), nullable=True, index=True)  # SHA-256 hash for duplicate detection
    template_id = Column(String(100), nullable=True)  # Optional template ID for template-based processing

    # Processing Status
    status = Column(SQLEnum(JobStatus), default=JobStatus.QUEUED, nullable=False, index=True)
    error_message = Column(Text, nullable=True)

    # Fraud Detection
    fraud_analysis = Column(JSON, nullable=True)  # Stores fraud detection results

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    completed_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="jobs")
    extracted_fields = relationship("ExtractedField", back_populates="job", cascade="all, delete-orphan")
    custom_fields = relationship("CustomField", back_populates="job", cascade="all, delete-orphan")

    # Composite Indexes for Performance
    __table_args__ = (
        Index('idx_user_status', 'user_id', 'status'),  # For dashboard queries
        Index('idx_user_created', 'user_id', 'created_at'),  # For sorting by date
        Index('idx_status_created', 'status', 'created_at'),  # For filtering and sorting
    )

    def __repr__(self) -> str:
        """String representation of Job."""
        return f"<Job(id={self.id}, filename='{self.filename}', status='{self.status.value}')>"

    def to_dict(self) -> dict:
        """Convert job to dictionary.

        Returns:
            dict: Job data
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "filename": self.filename,
            "s3_path": self.s3_path,
            "file_type": self.file_type,
            "file_hash": self.file_hash,
            "template_id": self.template_id,
            "status": self.status.value,
            "error_message": self.error_message,
            "fraud_analysis": self.fraud_analysis,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
        }

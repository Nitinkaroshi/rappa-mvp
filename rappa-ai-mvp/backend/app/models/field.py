"""Extracted fields database model for storing OCR extraction results."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey, Index
from sqlalchemy.orm import relationship

from app.core.database import Base


class ExtractedField(Base):
    """Extracted field model for storing OCR/LLM extraction results.

    This model stores individual fields extracted from documents:
    - Original OCR value
    - User-edited value (if modified)
    - Confidence level from OCR/LLM
    - Edit history tracking
    """

    __tablename__ = "extracted_fields"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Keys
    job_id = Column(Integer, ForeignKey("jobs.id", ondelete="CASCADE"), nullable=False, index=True)

    # Field Information
    field_name = Column(String(100), nullable=False)  # e.g., "buyer_name", "seller_aadhaar"
    original_value = Column(Text, nullable=True)  # Original extracted value
    edited_value = Column(Text, nullable=True)  # User-edited value (null if not edited)

    # Metadata
    confidence = Column(String(10), nullable=True)  # "high", "medium", "low"
    is_edited = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    job = relationship("Job", back_populates="extracted_fields")

    # Composite Index for Performance
    __table_args__ = (
        Index('idx_job_field_name', 'job_id', 'field_name'),  # For field lookups
    )

    def __repr__(self) -> str:
        """String representation of ExtractedField."""
        return f"<ExtractedField(id={self.id}, field_name='{self.field_name}', is_edited={self.is_edited})>"

    def to_dict(self) -> dict:
        """Convert extracted field to dictionary.

        Returns:
            dict: Extracted field data
        """
        return {
            "id": self.id,
            "job_id": self.job_id,
            "field_name": self.field_name,
            "original_value": self.original_value,
            "edited_value": self.edited_value,
            "confidence": self.confidence,
            "is_edited": self.is_edited,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }

    @property
    def current_value(self) -> str:
        """Get the current value (edited if available, otherwise original).

        Returns:
            str: Current field value
        """
        return self.edited_value if self.is_edited else self.original_value

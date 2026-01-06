"""Batch processing model for bulk document processing."""

from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class Batch(Base):
    """Batch model for processing multiple documents with same template.

    Users can upload multiple documents and process them in batches:
    1. Select a custom template
    2. Upload multiple documents (images/PDFs)
    3. All documents are processed using the template schema
    4. Results are stored in JSONB for flexible querying
    5. Batches auto-expire after 30 days

    Attributes:
        id: Primary key
        user_id: Foreign key to users table
        custom_template_id: Foreign key to custom_templates table
        name: User-defined batch name
        description: Optional batch description
        document_count: Number of documents processed in this batch
        results: JSONB field containing all extracted data
            Example: [
                {
                    "filename": "invoice_001.pdf",
                    "s3_path": "batches/123/invoice_001.pdf",
                    "data": {
                        "invoice_number": "INV-001",
                        "total_amount": 1500.00
                    },
                    "processed_at": "2025-12-29T10:00:00Z"
                }
            ]
        status: Batch processing status (pending, processing, completed, failed)
        created_at: Timestamp when batch was created
        expires_at: Auto-delete timestamp (created_at + 30 days)
    """
    __tablename__ = "batches"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    custom_template_id = Column(Integer, ForeignKey("custom_templates.id", ondelete="CASCADE"), nullable=False, index=True)

    # Batch metadata
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    document_count = Column(Integer, default=0, nullable=False)

    # Results stored as JSONB (PostgreSQL)
    results = Column(JSONB, nullable=False, default=list)

    # Status tracking
    status = Column(String(20), default="pending", nullable=False, index=True)
    # Status: pending, processing, completed, failed

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    expires_at = Column(DateTime, default=lambda: datetime.utcnow() + timedelta(days=30), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="batches")
    custom_template = relationship("CustomTemplate", back_populates="batches")

    def __repr__(self):
        return f"<Batch(id={self.id}, name='{self.name}', template_id={self.custom_template_id}, docs={self.document_count})>"

    def is_expired(self):
        """Check if batch has expired."""
        return datetime.utcnow() > self.expires_at

    def days_until_expiry(self):
        """Calculate days until batch expires."""
        if self.is_expired():
            return 0
        delta = self.expires_at - datetime.utcnow()
        return delta.days

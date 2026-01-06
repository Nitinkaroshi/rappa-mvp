"""Custom template model for user-defined document schemas."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB

from app.core.database import Base


class CustomTemplate(Base):
    """Custom template model for user-defined document processing.

    Users can create their own templates by:
    1. Uploading a sample document
    2. AI extracts fields automatically
    3. User verifies/edits the schema
    4. Template is saved for batch processing

    Attributes:
        id: Primary key
        user_id: Foreign key to users table
        name: User-defined template name
        document_type: Auto-detected or user-provided document type
        description: Optional description of the template
        schema: JSONB field containing dynamic field definitions
            Example: [
                {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": true},
                {"name": "total_amount", "label": "Total Amount", "type": "number", "required": true}
            ]
        sample_image_path: S3 path to reference/sample document
        field_count: Number of fields in schema (for quick reference)
        created_at: Timestamp when template was created
        updated_at: Timestamp when template was last updated
    """
    __tablename__ = "custom_templates"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Template metadata
    name = Column(String(200), nullable=False)
    document_type = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)

    # Dynamic schema stored as JSONB (PostgreSQL)
    schema = Column(JSONB, nullable=False)

    # Reference document
    sample_image_path = Column(String(500), nullable=True)

    # Quick stats
    field_count = Column(Integer, default=0, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    user = relationship("User", back_populates="custom_templates")
    batches = relationship("Batch", back_populates="custom_template", cascade="all, delete-orphan")

    def __repr__(self):
        return f"<CustomTemplate(id={self.id}, name='{self.name}', user_id={self.user_id}, fields={self.field_count})>"

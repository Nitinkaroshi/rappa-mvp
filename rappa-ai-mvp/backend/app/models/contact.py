"""Contact form submission model."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, Text, Boolean
from app.core.database import Base


class Contact(Base):
    """Contact form submission model.

    Stores contact form submissions from the landing page.
    """

    __tablename__ = "contacts"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Contact Information
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, index=True)
    phone = Column(String(50), nullable=True)
    company = Column(String(255), nullable=True)

    # Message
    subject = Column(String(500), nullable=True)
    message = Column(Text, nullable=False)

    # Metadata
    is_read = Column(Boolean, default=False, nullable=False)
    is_replied = Column(Boolean, default=False, nullable=False)

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)
    replied_at = Column(DateTime, nullable=True)

    def __repr__(self) -> str:
        """String representation of Contact."""
        return f"<Contact(id={self.id}, name='{self.name}', email='{self.email}')>"

    def to_dict(self) -> dict:
        """Convert contact to dictionary.

        Returns:
            dict: Contact data
        """
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "phone": self.phone,
            "company": self.company,
            "subject": self.subject,
            "message": self.message,
            "is_read": self.is_read,
            "is_replied": self.is_replied,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "replied_at": self.replied_at.isoformat() if self.replied_at else None,
        }

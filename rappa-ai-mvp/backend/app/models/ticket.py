"""Support ticket model for user help requests and bug reports."""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Enum, JSON
from sqlalchemy.orm import relationship
import enum

from app.core.database import Base


class TicketStatus(str, enum.Enum):
    """Ticket status enumeration."""
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class TicketPriority(str, enum.Enum):
    """Ticket priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class TicketType(str, enum.Enum):
    """Ticket type enumeration."""
    BUG = "bug"
    FEATURE_REQUEST = "feature_request"
    HELP = "help"
    BILLING = "billing"
    OTHER = "other"


class Ticket(Base):
    """Support ticket model for user requests and issues.

    Attributes:
        id: Primary key
        user_id: Foreign key to users table
        ticket_type: Type of ticket (bug, feature_request, help, etc.)
        subject: Short subject line
        description: Detailed description of the issue
        status: Current status (open, in_progress, resolved, closed)
        priority: Priority level (low, medium, high, urgent)
        attached_file_path: Optional S3 path to attached file
        logs: JSON field containing error logs or system information
        admin_notes: Internal notes for admin/support team
        resolved_at: Timestamp when ticket was resolved
        created_at: Timestamp when ticket was created
        updated_at: Timestamp when ticket was last updated
    """
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Ticket classification
    ticket_type = Column(Enum(TicketType), default=TicketType.HELP, nullable=False)
    subject = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)

    # Status tracking
    status = Column(Enum(TicketStatus), default=TicketStatus.OPEN, nullable=False, index=True)
    priority = Column(Enum(TicketPriority), default=TicketPriority.MEDIUM, nullable=False)

    # Additional data
    attached_file_path = Column(String(500), nullable=True)  # S3 path to attached file
    logs = Column(JSON, nullable=True)  # Error logs, browser info, etc.
    admin_notes = Column(Text, nullable=True)  # Internal notes for support team

    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
    resolved_at = Column(DateTime, nullable=True)

    # Relationships
    user = relationship("User", back_populates="tickets")

    def __repr__(self):
        return f"<Ticket(id={self.id}, user_id={self.user_id}, type={self.ticket_type}, status={self.status})>"

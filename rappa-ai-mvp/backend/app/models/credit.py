"""Credit log database model for tracking credit transactions."""

from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.core.database import Base


class CreditLog(Base):
    """Credit log model for tracking credit additions and deductions.

    This model stores a history of all credit transactions:
    - Credit additions (purchases, bonuses)
    - Credit deductions (document processing)
    - Reason for the transaction
    """

    __tablename__ = "credit_logs"

    # Primary Key
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)

    # Foreign Keys
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    # Transaction Details
    amount = Column(Integer, nullable=False)  # Positive for additions, negative for deductions
    reason = Column(String(100), nullable=True)  # e.g., "Document processed", "Credit purchase"

    # Timestamps
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="credit_logs")

    def __repr__(self) -> str:
        """String representation of CreditLog."""
        return f"<CreditLog(id={self.id}, user_id={self.user_id}, amount={self.amount})>"

    def to_dict(self) -> dict:
        """Convert credit log to dictionary.

        Returns:
            dict: Credit log data
        """
        return {
            "id": self.id,
            "user_id": self.user_id,
            "amount": self.amount,
            "reason": self.reason,
            "timestamp": self.timestamp.isoformat() if self.timestamp else None,
        }

"""Accounting export configuration model."""

from sqlalchemy import Column, Integer, String, Boolean, JSON, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AccountingConfig(Base):
    """User's saved accounting export configurations.

    Stores software-specific settings like ledger mappings, voucher types,
    etc. so users don't have to configure every time.
    """

    __tablename__ = "accounting_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    software = Column(String(50), nullable=False)  # 'tally', 'quickbooks', 'zoho'
    config = Column(JSON, nullable=False)  # Software-specific configuration
    is_default = Column(Boolean, default=False)  # Default config for this software
    name = Column(String(200))  # Optional: Named configuration (e.g., "Purchase - ACME Corp")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # Relationships
    user = relationship("User", back_populates="accounting_configs")

    # Constraints
    __table_args__ = (
        UniqueConstraint('user_id', 'software', 'name', name='uq_user_software_name'),
    )

    def __repr__(self):
        return f"<AccountingConfig(id={self.id}, user_id={self.user_id}, software={self.software}, name={self.name})>"

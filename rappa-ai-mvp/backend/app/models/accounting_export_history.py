"""Accounting export history model."""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base


class AccountingExportHistory(Base):
    """History of accounting exports.

    Tracks when data was exported to accounting software, which jobs,
    configuration used, and export status.
    """

    __tablename__ = "accounting_export_history"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    job_ids = Column(JSON, nullable=False)  # List of job IDs included in this export
    software = Column(String(50), nullable=False)  # 'tally', 'quickbooks', 'zoho'
    config = Column(JSON, nullable=False)  # Configuration used for export
    file_name = Column(String(500))  # Generated file name
    file_path = Column(String(1000))  # Optional: Store file if needed
    voucher_count = Column(Integer, default=0)  # Number of vouchers/records exported
    status = Column(String(20), default="completed")  # 'completed', 'failed'
    error_message = Column(Text)  # Error details if failed
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False, index=True)

    # Relationships
    user = relationship("User", back_populates="accounting_exports")

    def __repr__(self):
        return f"<AccountingExportHistory(id={self.id}, software={self.software}, jobs={len(self.job_ids)})>"

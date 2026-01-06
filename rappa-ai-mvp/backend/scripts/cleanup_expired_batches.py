"""Scheduled task to clean up expired batches.

This script should be run daily via a cron job or task scheduler.
It deletes batches that have exceeded their 30-day expiration period.

Usage:
    python scripts/cleanup_expired_batches.py

Cron example (run daily at 2 AM):
    0 2 * * * cd /path/to/rappa-ai-mvp/backend && /path/to/.venv/bin/python scripts/cleanup_expired_batches.py
"""

import sys
import os
from datetime import datetime
import logging

# Add parent directory to path to import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app.core.database import SessionLocal
from app.models.batch import Batch

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('logs/batch_cleanup.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


def cleanup_expired_batches():
    """Delete all batches that have expired (past their expires_at timestamp)."""
    db = SessionLocal()

    try:
        # Find expired batches
        expired_batches = db.query(Batch).filter(
            Batch.expires_at <= datetime.utcnow()
        ).all()

        count = len(expired_batches)

        if count == 0:
            logger.info("No expired batches to clean up")
            return 0

        # Log details of batches being deleted
        logger.info(f"Found {count} expired batches to delete:")
        for batch in expired_batches:
            logger.info(
                f"  - Batch ID {batch.id}: '{batch.name}' "
                f"(User {batch.user_id}, Created: {batch.created_at}, "
                f"Expired: {batch.expires_at})"
            )

        # Delete expired batches
        for batch in expired_batches:
            db.delete(batch)

        db.commit()

        logger.info(f"Successfully deleted {count} expired batches")
        return count

    except Exception as e:
        logger.error(f"Failed to cleanup expired batches: {str(e)}", exc_info=True)
        db.rollback()
        raise

    finally:
        db.close()


if __name__ == "__main__":
    logger.info("Starting batch cleanup task...")

    try:
        deleted_count = cleanup_expired_batches()
        logger.info(f"Batch cleanup task completed: {deleted_count} batches deleted")
        sys.exit(0)

    except Exception as e:
        logger.error(f"Batch cleanup task failed: {str(e)}")
        sys.exit(1)

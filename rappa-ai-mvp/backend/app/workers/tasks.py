"""Celery background tasks for document processing.

This module contains all asynchronous tasks for OCR and field extraction.
"""

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

from celery import Celery
from celery.signals import worker_process_init
from sqlalchemy.orm import Session

from app.config import settings
from app.core.database import db_manager
from app.models.job import Job, JobStatus
from app.models.field import ExtractedField
from app.models.user import User  # Import User to ensure relationship mapping works
from app.models.credit import CreditLog  # Import CreditLog for User relationship
from app.services.document_processor import get_document_processor
from app.services.storage_service import get_storage_service
from app.services.fraud_detection import get_fraud_detection_service

logger = logging.getLogger(__name__)

# Initialize Celery app
celery_app = Celery(
    "rappa_tasks",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND
)

# Configure Celery
celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="UTC",
    enable_utc=True,
    task_track_started=True,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    # Connection resilience settings
    broker_connection_retry=True,
    broker_connection_retry_on_startup=True,
    broker_connection_max_retries=10,
    broker_pool_limit=None,
    # Prevent connection drops
    broker_heartbeat=10,
    broker_transport_options={
        'visibility_timeout': 3600,
        'socket_keepalive': True,
    },
    # Worker behavior
    worker_cancel_long_running_tasks_on_connection_loss=False,
    worker_prefetch_multiplier=1,
)


@worker_process_init.connect
def init_worker_process(sender=None, **kwargs):
    """Initialize database manager when Celery worker process starts.

    This signal is triggered once per worker process initialization,
    ensuring the database connection pool is properly set up.
    """
    logger.info("Initializing database manager for Celery worker process")
    db_manager.initialize()
    logger.info("Database manager initialized successfully")


@celery_app.task(bind=True, name="process_document")
def process_document(self, job_id: int) -> Dict[str, Any]:
    """Process a document: OCR + field extraction.

    This task:
    1. Downloads file from S3
    2. Performs OCR extraction
    3. Extracts fields using LLM
    4. Saves results to database
    5. Updates job status

    Args:
        job_id: ID of the job to process

    Returns:
        dict: Processing results
    """
    logger.info(f"Starting document processing for job {job_id}")

    # Get database session
    with db_manager.session_scope() as db:
        job = None  # Initialize job variable
        temp_file = None  # Initialize temp_file variable

        try:
            # Get job from database
            job = db.query(Job).filter(Job.id == job_id).first()
            if not job:
                logger.error(f"Job {job_id} not found")
                return {"success": False, "error": "Job not found"}

            # Update job status to processing
            job.status = JobStatus.PROCESSING
            db.commit()

            # Get services
            document_processor = get_document_processor()
            storage_service = get_storage_service()

            # Download file from S3 to temp location
            temp_dir = Path(settings.UPLOAD_TEMP_DIR)
            temp_dir.mkdir(parents=True, exist_ok=True)
            temp_file = temp_dir / f"job_{job_id}_{job.filename}"

            logger.info(f"Downloading file from S3: {job.s3_path}")
            storage_service.download_file(job.s3_path, temp_file)

            # Calculate file hash for duplicate detection
            fraud_service = get_fraud_detection_service()
            file_hash = fraud_service.calculate_file_hash(str(temp_file))
            job.file_hash = file_hash
            db.commit()

            logger.info(f"File hash calculated: {file_hash[:16]}...")

            # Process document (classification + OCR/Vision + field extraction)
            logger.info(f"Starting document processing for job {job_id}")
            result = document_processor.process_document(temp_file)

            # Check if processing was successful
            if not result.get("success", True):
                raise ValueError(f"Document processing failed: {result.get('error', 'Unknown error')}")

            # Save extracted fields to database
            logger.info(f"Saving extracted fields for job {job_id}")
            save_extracted_fields(db, job_id, result)

            # Get all extracted fields for fraud detection
            extracted_fields = db.query(ExtractedField).filter(ExtractedField.job_id == job_id).all()
            fields_list = [{
                "id": field.id,
                "field_name": field.field_name,
                "current_value": field.current_value or field.original_value,
                "confidence": field.confidence
            } for field in extracted_fields]

            # Perform fraud detection
            logger.info(f"Performing fraud detection for job {job_id}")
            fraud_analysis = fraud_service.perform_full_analysis(
                file_path=str(temp_file),
                file_hash=file_hash,
                user_id=job.user_id,
                extracted_fields=fields_list,
                db_session=db
            )

            # Save fraud analysis to job
            job.fraud_analysis = fraud_analysis
            db.commit()

            logger.info(f"Fraud detection complete: Risk={fraud_analysis['overall_risk_level']}, Score={fraud_analysis['risk_score']}/{fraud_analysis['max_risk_score']}")

            # Update job status to completed
            job.status = JobStatus.COMPLETED
            job.completed_at = datetime.now(timezone.utc)
            db.commit()

            # Clean up temp file
            if temp_file.exists():
                temp_file.unlink()

            logger.info(f"Job {job_id} completed successfully")

            # Extract field count from new format
            fields_count = len(result.get("extracted_data", [])) + 3  # +3 for document_type, summary, confidence

            return {
                "success": True,
                "job_id": job_id,
                "status": "completed",
                "method": result.get("method", "unknown"),
                "pdf_type": result.get("metadata", {}).get("pdf_type", "unknown"),
                "document_type": result.get("document_type", "Unknown"),
                "confidence": result.get("confidence", 0.0),
                "fields_count": fields_count
            }

        except Exception as e:
            logger.error(f"Error processing job {job_id}: {str(e)}", exc_info=True)

            # Update job status to failed (only if job was successfully retrieved)
            if job:
                job.status = JobStatus.FAILED
                job.error_message = str(e)
                job.completed_at = datetime.now(timezone.utc)
                db.commit()

            # Clean up temp file
            if temp_file and temp_file.exists():
                temp_file.unlink()

            return {
                "success": False,
                "job_id": job_id,
                "status": "failed",
                "error": str(e)
            }


def save_extracted_fields(db: Session, job_id: int, result_data: Dict[str, Any]) -> None:
    """Save extracted fields to database in new format.

    New structure from Gemini:
    - document_type: str
    - confidence: float
    - extracted_data: List[{key, value}]
    - summary: str

    Args:
        db: Database session
        job_id: Job ID
        result_data: Complete result data from document processor
    """
    # Save metadata fields (prefixed with _)
    metadata_fields = [
        ("_document_type", result_data.get("document_type", "Unknown")),
        ("_confidence", str(result_data.get("confidence", 0.0))),
        ("_summary", result_data.get("summary", "")),
        ("_method", result_data.get("method", "unknown")),
        ("_pdf_type", result_data.get("metadata", {}).get("pdf_type", "unknown"))
    ]

    for field_name, value in metadata_fields:
        if value:
            field = ExtractedField(
                job_id=job_id,
                field_name=field_name,
                original_value=str(value)[:500],  # Limit length for summary
                confidence="0.90"
            )
            db.add(field)

    # Save all extracted key-value pairs
    extracted_data = result_data.get("extracted_data", [])
    for item in extracted_data:
        if isinstance(item, dict) and "key" in item and "value" in item:
            value = item["value"]
            if value and value != "Not found":
                field = ExtractedField(
                    job_id=job_id,
                    field_name=item["key"],
                    original_value=str(value),
                    confidence="0.70"
                )
                db.add(field)

    db.commit()
    logger.info(f"Saved {len(metadata_fields) + len(extracted_data)} fields for job {job_id}")


@celery_app.task(name="test_task")
def test_task(message: str) -> str:
    """Simple test task to verify Celery is working.

    Args:
        message: Test message

    Returns:
        str: Echo of the message
    """
    logger.info(f"Test task received: {message}")
    return f"Test task completed: {message}"

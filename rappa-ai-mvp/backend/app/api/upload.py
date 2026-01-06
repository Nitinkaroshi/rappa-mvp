"""File upload API endpoints for document processing."""

import logging
import io
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from sqlalchemy.orm import Session
from pydantic import BaseModel
from PyPDF2 import PdfReader

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.job import Job, JobStatus
from app.models.credit import CreditLog
from app.services.storage_service import get_storage_service, StorageService
from app.services.credit_service import get_credit_service, CreditService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class UploadResponse(BaseModel):
    """Response schema for file upload."""
    job_id: int
    filename: str
    status: str
    message: str
    credits_remaining: int


# ============================================================================
# Helper Functions
# ============================================================================

def validate_file_type(filename: str) -> str:
    """Validate file extension and return file type.

    Args:
        filename: Name of the uploaded file

    Returns:
        str: File type (pdf, jpg, png, jpeg)

    Raises:
        HTTPException: If file type is not allowed
    """
    file_extension = Path(filename).suffix.lower().lstrip('.')

    if file_extension not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type '.{file_extension}' not allowed. Allowed types: {', '.join(settings.ALLOWED_EXTENSIONS)}"
        )

    return file_extension


def count_pdf_pages(file_content: bytes) -> int:
    """Count number of pages in a PDF file.

    Args:
        file_content: PDF file content as bytes

    Returns:
        int: Number of pages in the PDF

    Raises:
        Exception: If PDF is corrupted or cannot be read
    """
    try:
        pdf_file = io.BytesIO(file_content)
        pdf_reader = PdfReader(pdf_file)
        page_count = len(pdf_reader.pages)
        logger.info(f"PDF contains {page_count} pages")
        return page_count
    except Exception as e:
        logger.error(f"Failed to count PDF pages: {str(e)}")
        # If we can't count pages, assume 1 page as fallback
        return 1


def check_user_credits(
    user: User,
    file_type: str,
    page_count: int,
    credit_service: CreditService
) -> None:
    """Check if user has enough credits to process a document.

    Args:
        user: User object
        file_type: File extension (pdf, jpg, png, etc.)
        page_count: Number of pages in document
        credit_service: Credit service instance

    Raises:
        HTTPException: If user has insufficient credits
    """
    has_credits, _, message = credit_service.check_sufficient_credits(
        user, file_type, page_count
    )

    if not has_credits:
        raise HTTPException(
            status_code=status.HTTP_402_PAYMENT_REQUIRED,
            detail=message
        )


# ============================================================================
# Upload Endpoints
# ============================================================================

@router.post("/document", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(..., description="Document file (PDF, JPG, PNG)"),
    template_id: str = None,  # Optional template ID for template-based processing
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
    credit_service: CreditService = Depends(get_credit_service)
):
    """Upload a document for OCR processing with two-way logic.

    **Way 1 - Template-based** (if template_id provided):
    1. User selects template
    2. Document is processed using template-specific fields
    3. Higher accuracy for known document types

    **Way 2 - Auto-detection** (if template_id is None):
    1. Gemini AI automatically detects document type
    2. Extracts fields based on detected type
    3. Works with any document type

    This endpoint:
    1. Validates file type and size
    2. Checks user has sufficient credits
    3. Uploads file to S3
    4. Creates a job record with template_id (if provided)
    5. Deducts credits
    6. Queues job for background processing

    Args:
        file: Uploaded file
        template_id: Optional template ID for template-based processing
        current_user: Authenticated user
        db: Database session
        storage: Storage service

    Returns:
        UploadResponse: Job information and status

    Raises:
        HTTPException 400: If file is invalid or template not found
        HTTPException 402: If insufficient credits
        HTTPException 413: If file too large
    """
    # Validate file is provided
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    # Validate file type
    file_type = validate_file_type(file.filename)

    # Check file size
    file.file.seek(0, 2)  # Seek to end
    file_size = file.file.tell()
    file.file.seek(0)  # Reset to beginning

    if file_size > settings.MAX_UPLOAD_SIZE:
        size_mb = file_size / (1024 * 1024)
        max_mb = settings.MAX_UPLOAD_SIZE / (1024 * 1024)
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File too large ({size_mb:.2f} MB). Maximum size is {max_mb:.2f} MB"
        )

    # Check if file is empty
    if file_size == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File is empty"
        )

    # Validate template_id if provided
    if template_id:
        # Check if template exists (import templates module to verify)
        from app.data.templates import get_template
        template = get_template(template_id)
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Template not found: {template_id}"
            )
        logger.info(f"Using template-based processing: {template_id}")
    else:
        logger.info("Using auto-detection mode (no template specified)")

    # Read file content for page counting (PDFs only)
    file_content = await file.read()
    await file.seek(0)  # Reset file pointer for later upload

    # Count pages for PDFs
    page_count = 1  # Default for images
    if file_type == 'pdf':
        page_count = count_pdf_pages(file_content)
        logger.info(f"PDF has {page_count} pages, will cost {page_count} credits")

    # Check user has sufficient credits based on document type and page count
    check_user_credits(current_user, file_type, page_count, credit_service)

    try:
        # Upload to S3
        s3_path = storage.upload_file(
            file_obj=io.BytesIO(file_content),  # Use the content we already read
            filename=file.filename,
            user_id=current_user.id,
            content_type=file.content_type
        )

        # Create job record with optional template_id
        job = Job(
            user_id=current_user.id,
            filename=file.filename,
            s3_path=s3_path,
            file_type=file_type,
            template_id=template_id,  # Store template_id for processing (None for auto-detect)
            status=JobStatus.QUEUED
        )

        db.add(job)
        db.commit()
        db.refresh(job)

        logger.info(f"Job {job.id} created for user {current_user.id}: {file.filename}")

        # Deduct credits using new credit service with page-based pricing
        credit_service.deduct_credits(
            user=current_user,
            db=db,
            file_type=file_type,
            page_count=page_count,
            filename=file.filename,
            job_id=job.id
        )

        # Queue job for background processing with Celery
        from app.workers.tasks import process_document
        process_document.delay(job.id)

        return UploadResponse(
            job_id=job.id,
            filename=file.filename,
            status=job.status.value,
            message="Document uploaded successfully and queued for processing",
            credits_remaining=current_user.credits
        )

    except Exception as e:
        logger.error(f"Upload failed for user {current_user.id}: {str(e)}")
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload document: {str(e)}"
        )


@router.get("/limits")
def get_upload_limits(
    current_user: User = Depends(get_current_active_user),
    credit_service: CreditService = Depends(get_credit_service)
):
    """Get file upload limits, credit pricing info, and user's remaining credits.

    Args:
        current_user: Authenticated user
        credit_service: Credit service instance

    Returns:
        dict: Upload limits, pricing info, and user credits
    """
    return {
        "max_file_size_bytes": settings.MAX_UPLOAD_SIZE,
        "max_file_size_mb": settings.MAX_UPLOAD_SIZE / (1024 * 1024),
        "allowed_extensions": settings.ALLOWED_EXTENSIONS,
        "user_credits": current_user.credits,
        "can_upload": current_user.credits >= 1,  # At least 1 credit needed
        "pricing": credit_service.get_pricing_info()
    }

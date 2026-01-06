"""Batch processing API endpoints for custom templates."""

import logging
import io
import csv
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field
import pandas as pd

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.batch import Batch
from app.models.custom_template import CustomTemplate
from app.services.storage_service import get_storage_service, StorageService
from app.services.gemini_service import get_gemini_service, GeminiService

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Configuration
# ============================================================================

MAX_BATCHES_PER_USER = 5
MAX_DOCUMENTS_PER_BATCH = 100


# ============================================================================
# Pydantic Schemas
# ============================================================================

class BatchCreate(BaseModel):
    """Schema for creating a batch."""
    custom_template_id: int
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None


class BatchResponse(BaseModel):
    """Response schema for batch."""
    id: int
    user_id: int
    custom_template_id: int
    name: str
    description: Optional[str]
    document_count: int
    results: List[dict]
    status: str
    created_at: datetime
    expires_at: datetime
    days_until_expiry: int
    is_expired: bool

    class Config:
        from_attributes = True

    @classmethod
    def from_orm(cls, batch: Batch):
        """Create response from ORM model."""
        return cls(
            id=batch.id,
            user_id=batch.user_id,
            custom_template_id=batch.custom_template_id,
            name=batch.name,
            description=batch.description,
            document_count=batch.document_count,
            results=batch.results,
            status=batch.status,
            created_at=batch.created_at,
            expires_at=batch.expires_at,
            days_until_expiry=batch.days_until_expiry(),
            is_expired=batch.is_expired()
        )


class BatchListResponse(BaseModel):
    """Response schema for batch list."""
    id: int
    custom_template_id: int
    name: str
    document_count: int
    status: str
    created_at: datetime
    expires_at: datetime
    days_until_expiry: int

    class Config:
        from_attributes = True


class BatchStatsResponse(BaseModel):
    """Response schema for batch statistics."""
    total_batches: int
    active_batches: int
    completed_batches: int
    expired_batches: int
    max_allowed: int
    slots_available: int


# ============================================================================
# Batch Endpoints
# ============================================================================

@router.get("/stats", response_model=BatchStatsResponse)
def get_batch_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get batch statistics for the current user.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        BatchStatsResponse: Batch statistics
    """
    # Count batches by status
    total_batches = db.query(func.count(Batch.id)).filter(
        Batch.user_id == current_user.id
    ).scalar() or 0

    active_batches = db.query(func.count(Batch.id)).filter(
        Batch.user_id == current_user.id,
        Batch.status.in_(["pending", "processing"]),
        Batch.expires_at > datetime.utcnow()
    ).scalar() or 0

    completed_batches = db.query(func.count(Batch.id)).filter(
        Batch.user_id == current_user.id,
        Batch.status == "completed"
    ).scalar() or 0

    expired_batches = db.query(func.count(Batch.id)).filter(
        Batch.user_id == current_user.id,
        Batch.expires_at <= datetime.utcnow()
    ).scalar() or 0

    slots_available = max(0, MAX_BATCHES_PER_USER - active_batches)

    return BatchStatsResponse(
        total_batches=total_batches,
        active_batches=active_batches,
        completed_batches=completed_batches,
        expired_batches=expired_batches,
        max_allowed=MAX_BATCHES_PER_USER,
        slots_available=slots_available
    )


@router.post("/", response_model=BatchResponse, status_code=status.HTTP_201_CREATED)
async def create_batch(
    custom_template_id: int = Form(...),
    name: str = Form(...),
    description: Optional[str] = Form(None),
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
    gemini_service: GeminiService = Depends(get_gemini_service)
):
    """Create a new batch and process documents.

    Args:
        custom_template_id: Template to use for extraction
        name: Batch name
        description: Optional description
        files: Documents to process
        current_user: Authenticated user
        db: Database session
        storage: Storage service
        gemini_service: Gemini service for extraction

    Returns:
        BatchResponse: Created batch with processing results

    Raises:
        HTTPException 400: If validation fails or batch limit reached
        HTTPException 404: If template not found
    """
    # Check batch limit
    active_batches = db.query(func.count(Batch.id)).filter(
        Batch.user_id == current_user.id,
        Batch.status.in_(["pending", "processing"]),
        Batch.expires_at > datetime.utcnow()
    ).scalar() or 0

    if active_batches >= MAX_BATCHES_PER_USER:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum batch limit reached ({MAX_BATCHES_PER_USER}). "
                   "Please complete or delete existing batches first."
        )

    # Validate template
    template = db.query(CustomTemplate).filter(
        CustomTemplate.id == custom_template_id,
        CustomTemplate.user_id == current_user.id
    ).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Validate file count
    if len(files) > MAX_DOCUMENTS_PER_BATCH:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Maximum {MAX_DOCUMENTS_PER_BATCH} documents per batch"
        )

    if len(files) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one document is required"
        )

    # Create batch
    batch = Batch(
        user_id=current_user.id,
        custom_template_id=custom_template_id,
        name=name,
        description=description,
        document_count=len(files),
        results=[],
        status="processing"
    )

    db.add(batch)
    db.commit()
    db.refresh(batch)

    logger.info(f"Created batch {batch.id} for user {current_user.id}: {name} ({len(files)} documents)")

    # Process documents
    results = []
    for idx, file in enumerate(files):
        try:
            # Read file content
            file_content = await file.read()

            # Upload to S3
            s3_path = storage.upload_file(
                file_obj=io.BytesIO(file_content),
                filename=f"batch_{batch.id}_{idx}_{file.filename}",
                user_id=current_user.id,
                content_type=file.content_type,
                folder="batches"
            )

            # Extract data using Gemini with template schema
            extraction_result = gemini_service.extract_with_schema(
                file_content=file_content,
                schema=template.schema,
                document_type=template.document_type
            )

            # Add result
            results.append({
                "filename": file.filename,
                "s3_path": s3_path,
                "data": extraction_result,
                "processed_at": datetime.utcnow().isoformat(),
                "status": "success"
            })

            logger.info(f"Processed document {idx + 1}/{len(files)} in batch {batch.id}")

        except Exception as e:
            logger.error(f"Failed to process document {file.filename} in batch {batch.id}: {str(e)}")
            results.append({
                "filename": file.filename,
                "s3_path": None,
                "data": {},
                "processed_at": datetime.utcnow().isoformat(),
                "status": "failed",
                "error": str(e)
            })

    # Update batch with results
    batch.results = results
    batch.status = "completed"
    db.commit()
    db.refresh(batch)

    logger.info(f"Batch {batch.id} completed: {len(results)} documents processed")

    return BatchResponse.from_orm(batch)


@router.get("/", response_model=List[BatchListResponse])
def get_batches(
    status_filter: Optional[str] = None,
    include_expired: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all batches for the current user.

    Args:
        status_filter: Optional status filter
        include_expired: Include expired batches
        current_user: Authenticated user
        db: Database session

    Returns:
        List[BatchListResponse]: List of batches
    """
    query = db.query(Batch).filter(Batch.user_id == current_user.id)

    if status_filter:
        query = query.filter(Batch.status == status_filter)

    if not include_expired:
        query = query.filter(Batch.expires_at > datetime.utcnow())

    batches = query.order_by(Batch.created_at.desc()).all()

    return [
        BatchListResponse(
            id=batch.id,
            custom_template_id=batch.custom_template_id,
            name=batch.name,
            document_count=batch.document_count,
            status=batch.status,
            created_at=batch.created_at,
            expires_at=batch.expires_at,
            days_until_expiry=batch.days_until_expiry()
        )
        for batch in batches
    ]


@router.get("/{batch_id}", response_model=BatchResponse)
def get_batch(
    batch_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific batch by ID.

    Args:
        batch_id: Batch ID
        current_user: Authenticated user
        db: Database session

    Returns:
        BatchResponse: Batch details with results

    Raises:
        HTTPException 404: If batch not found
        HTTPException 403: If batch doesn't belong to user
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    # Check ownership
    if batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this batch"
        )

    return BatchResponse.from_orm(batch)


@router.delete("/{batch_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_batch(
    batch_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a batch.

    Args:
        batch_id: Batch ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException 404: If batch not found
        HTTPException 403: If batch doesn't belong to user
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    # Check ownership
    if batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this batch"
        )

    db.delete(batch)
    db.commit()

    logger.info(f"Deleted batch {batch_id} by user {current_user.id}")


@router.get("/{batch_id}/download/csv")
def download_batch_csv(
    batch_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download batch results as CSV.

    Args:
        batch_id: Batch ID
        current_user: Authenticated user
        db: Database session

    Returns:
        StreamingResponse: CSV file download

    Raises:
        HTTPException 404: If batch not found
        HTTPException 403: If batch doesn't belong to user
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    if batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this batch"
        )

    # Get template for field order
    template = db.query(CustomTemplate).filter(
        CustomTemplate.id == batch.custom_template_id
    ).first()

    # Build CSV
    output = io.StringIO()
    writer = csv.writer(output)

    # Header row: filename + schema fields in order
    field_names = [field["name"] for field in template.schema]
    header = ["filename", "status"] + field_names
    writer.writerow(header)

    # Data rows
    for result in batch.results:
        row = [result["filename"], result.get("status", "success")]
        for field_name in field_names:
            row.append(result.get("data", {}).get(field_name, ""))
        writer.writerow(row)

    # Create response
    output.seek(0)
    return StreamingResponse(
        io.BytesIO(output.getvalue().encode("utf-8")),
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=batch_{batch_id}_{batch.name}.csv"
        }
    )


@router.get("/{batch_id}/download/excel")
def download_batch_excel(
    batch_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Download batch results as Excel.

    Args:
        batch_id: Batch ID
        current_user: Authenticated user
        db: Database session

    Returns:
        StreamingResponse: Excel file download

    Raises:
        HTTPException 404: If batch not found
        HTTPException 403: If batch doesn't belong to user
    """
    batch = db.query(Batch).filter(Batch.id == batch_id).first()

    if not batch:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Batch not found"
        )

    if batch.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this batch"
        )

    # Get template for field order
    template = db.query(CustomTemplate).filter(
        CustomTemplate.id == batch.custom_template_id
    ).first()

    # Build DataFrame
    field_names = [field["name"] for field in template.schema]
    rows = []

    for result in batch.results:
        row = {
            "filename": result["filename"],
            "status": result.get("status", "success")
        }
        for field_name in field_names:
            row[field_name] = result.get("data", {}).get(field_name, "")
        rows.append(row)

    df = pd.DataFrame(rows)

    # Write to Excel
    output = io.BytesIO()
    with pd.ExcelWriter(output, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Batch Results")

    output.seek(0)

    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={
            "Content-Disposition": f"attachment; filename=batch_{batch_id}_{batch.name}.xlsx"
        }
    )


# ============================================================================
# Cleanup Endpoint (for scheduled tasks)
# ============================================================================

@router.post("/cleanup-expired", status_code=status.HTTP_200_OK)
def cleanup_expired_batches(
    db: Session = Depends(get_db)
):
    """Clean up expired batches (intended for scheduled tasks).

    This endpoint should be called by a scheduled task (cron job)
    to automatically delete batches older than 30 days.

    Args:
        db: Database session

    Returns:
        dict: Cleanup statistics
    """
    # Find expired batches
    expired_batches = db.query(Batch).filter(
        Batch.expires_at <= datetime.utcnow()
    ).all()

    count = len(expired_batches)

    # Delete expired batches
    for batch in expired_batches:
        db.delete(batch)

    db.commit()

    logger.info(f"Cleaned up {count} expired batches")

    return {
        "cleaned_up": count,
        "timestamp": datetime.utcnow().isoformat()
    }

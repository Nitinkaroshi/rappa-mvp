"""Fields API endpoints for managing extracted document fields."""

import logging
from typing import List, Dict
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.models.field import ExtractedField

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class FieldResponse(BaseModel):
    """Response schema for a single field."""
    id: int
    field_name: str
    original_value: str
    edited_value: str | None
    current_value: str
    confidence: str | None
    is_edited: bool


class UpdateFieldRequest(BaseModel):
    """Request schema for updating a single field."""
    edited_value: str = Field(..., description="New value for the field")


class BatchUpdateRequest(BaseModel):
    """Request schema for batch updating multiple fields."""
    updates: List[Dict[str, str]] = Field(
        ...,
        description="List of field updates with field_id and edited_value"
    )


# ============================================================================
# Field Management Endpoints
# ============================================================================

@router.get("/job/{job_id}", response_model=List[FieldResponse])
def get_job_fields(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all extracted fields for a specific job.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List[FieldResponse]: List of extracted fields

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Get all fields for this job
    fields = db.query(ExtractedField).filter(
        ExtractedField.job_id == job_id
    ).all()

    logger.info(f"Retrieved {len(fields)} fields for job {job_id}")

    return [
        FieldResponse(
            id=f.id,
            field_name=f.field_name,
            original_value=f.original_value or "",
            edited_value=f.edited_value,
            current_value=f.edited_value if f.is_edited else (f.original_value or ""),
            confidence=f.confidence,
            is_edited=f.is_edited
        )
        for f in fields
    ]


@router.patch("/{field_id}", response_model=Dict)
def update_field(
    field_id: int,
    request: UpdateFieldRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a single field value.

    Args:
        field_id: Field ID to update
        request: Update request with new value
        current_user: Authenticated user
        db: Database session

    Returns:
        dict: Success message with updated field info

    Raises:
        HTTPException 404: If field not found or doesn't belong to user
    """
    # Find field and verify ownership through job
    field = db.query(ExtractedField).join(Job).filter(
        ExtractedField.id == field_id,
        Job.user_id == current_user.id
    ).first()

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    # Update field
    field.edited_value = request.edited_value
    field.is_edited = True
    db.commit()
    db.refresh(field)

    logger.info(
        f"Field {field_id} updated by user {current_user.id}: "
        f"{field.field_name} = '{request.edited_value}'"
    )

    return {
        "message": "Field updated successfully",
        "field_id": field_id,
        "field_name": field.field_name,
        "new_value": request.edited_value
    }


@router.post("/job/{job_id}/batch-update", response_model=Dict)
def batch_update_fields(
    job_id: int,
    request: BatchUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update multiple fields at once.

    Args:
        job_id: Job ID
        request: Batch update request with list of field updates
        current_user: Authenticated user
        db: Database session

    Returns:
        dict: Success message with count of updated fields

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    updated_count = 0
    failed_updates = []

    # Update each field
    for update in request.updates:
        field_id = update.get("field_id")
        edited_value = update.get("edited_value")

        if not field_id or edited_value is None:
            failed_updates.append({
                "field_id": field_id,
                "error": "Missing field_id or edited_value"
            })
            continue

        try:
            field = db.query(ExtractedField).filter(
                ExtractedField.id == int(field_id),
                ExtractedField.job_id == job_id
            ).first()

            if field:
                field.edited_value = edited_value
                field.is_edited = True
                updated_count += 1
            else:
                failed_updates.append({
                    "field_id": field_id,
                    "error": "Field not found"
                })
        except Exception as e:
            failed_updates.append({
                "field_id": field_id,
                "error": str(e)
            })

    db.commit()

    logger.info(
        f"Batch update for job {job_id}: {updated_count} fields updated, "
        f"{len(failed_updates)} failed"
    )

    response = {
        "message": f"Successfully updated {updated_count} field(s)",
        "updated_count": updated_count,
        "total_requested": len(request.updates)
    }

    if failed_updates:
        response["failed_updates"] = failed_updates

    return response


@router.post("/{field_id}/reset", response_model=Dict)
def reset_field(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Reset a field to its original value.

    Args:
        field_id: Field ID to reset
        current_user: Authenticated user
        db: Database session

    Returns:
        dict: Success message with reset field info

    Raises:
        HTTPException 404: If field not found or doesn't belong to user
    """
    # Find field and verify ownership through job
    field = db.query(ExtractedField).join(Job).filter(
        ExtractedField.id == field_id,
        Job.user_id == current_user.id
    ).first()

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    # Reset field
    field.edited_value = None
    field.is_edited = False
    db.commit()
    db.refresh(field)

    logger.info(
        f"Field {field_id} reset to original value by user {current_user.id}: "
        f"{field.field_name} = '{field.original_value}'"
    )

    return {
        "message": "Field reset to original value",
        "field_id": field_id,
        "field_name": field.field_name,
        "original_value": field.original_value
    }

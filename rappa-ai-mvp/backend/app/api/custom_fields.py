"""Custom fields API endpoints for managing user-defined fields on jobs."""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.models.custom_field import CustomField
from app.models.job import Job
from app.models.user import User
from app.core.auth import get_current_active_user


import logging
logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class CustomFieldCreate(BaseModel):
    """Schema for creating a custom field."""

    field_name: str = Field(..., min_length=1, max_length=100, description="Name of the custom field")
    field_value: str = Field(None, description="Value of the custom field")
    field_type: str = Field(default="text", description="Type of field: text, number, date, email, etc.")


class CustomFieldUpdate(BaseModel):
    """Schema for updating a custom field."""

    field_name: str = Field(None, min_length=1, max_length=100, description="Updated name of the custom field")
    field_value: str = Field(None, description="Updated value of the custom field")
    field_type: str = Field(None, description="Updated type of field")


class CustomFieldResponse(BaseModel):
    """Schema for custom field response."""

    id: int
    job_id: int
    user_id: int
    field_name: str
    field_value: str | None
    field_type: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


# ============================================================================
# API Endpoints
# ============================================================================

@router.post("/job/{job_id}", response_model=CustomFieldResponse, status_code=status.HTTP_201_CREATED)
def create_custom_field(
    job_id: int,
    custom_field: CustomFieldCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Create a new custom field for a job.

    Args:
        job_id: ID of the job to add custom field to
        custom_field: Custom field data
        db: Database session
        current_user: Authenticated user

    Returns:
        CustomFieldResponse: Created custom field

    Raises:
        404: Job not found
        403: User doesn't own this job
    """
    # Verify job exists and belongs to user
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this job"
        )

    try:
        # Create custom field
        new_field = CustomField(
            job_id=job_id,
            user_id=current_user.id,
            field_name=custom_field.field_name,
            field_value=custom_field.field_value,
            field_type=custom_field.field_type
        )

        db.add(new_field)
        db.commit()
        db.refresh(new_field)

        return new_field
    except Exception as e:
        logger.error(f"Failed to create custom field: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create custom field: {str(e)}"
        )


@router.get("/job/{job_id}", response_model=List[CustomFieldResponse])
def get_custom_fields_for_job(
    job_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Get all custom fields for a job.

    Args:
        job_id: ID of the job
        db: Database session
        current_user: Authenticated user

    Returns:
        List[CustomFieldResponse]: List of custom fields

    Raises:
        404: Job not found
        403: User doesn't own this job
    """
    # Verify job exists and belongs to user
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if job.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this job"
        )

    # Get all custom fields for this job
    custom_fields = db.query(CustomField).filter(
        CustomField.job_id == job_id,
        CustomField.user_id == current_user.id
    ).all()

    return custom_fields


@router.patch("/{field_id}", response_model=CustomFieldResponse)
def update_custom_field(
    field_id: int,
    custom_field: CustomFieldUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Update a custom field.

    Args:
        field_id: ID of the custom field to update
        custom_field: Updated field data
        db: Database session
        current_user: Authenticated user

    Returns:
        CustomFieldResponse: Updated custom field

    Raises:
        404: Custom field not found
        403: User doesn't own this custom field
    """
    # Find custom field
    field = db.query(CustomField).filter(CustomField.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom field not found"
        )

    # Check ownership
    if field.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to modify this custom field"
        )

    # Update fields (only if provided)
    if custom_field.field_name is not None:
        field.field_name = custom_field.field_name
    if custom_field.field_value is not None:
        field.field_value = custom_field.field_value
    if custom_field.field_type is not None:
        field.field_type = custom_field.field_type

    db.commit()
    db.refresh(field)

    return field


@router.delete("/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_custom_field(
    field_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    """Delete a custom field.

    Args:
        field_id: ID of the custom field to delete
        db: Database session
        current_user: Authenticated user

    Raises:
        404: Custom field not found
        403: User doesn't own this custom field
    """
    # Find custom field
    field = db.query(CustomField).filter(CustomField.id == field_id).first()
    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Custom field not found"
        )

    # Check ownership
    if field.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this custom field"
        )

    db.delete(field)
    db.commit()

    return None

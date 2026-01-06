"""Validation API endpoints for field validation."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.services.validation_service import get_validation_service, ValidationService

logger = logging.getLogger(__name__)

router = APIRouter()


class ValidationResponse(BaseModel):
    """Response schema for validation results."""
    job_id: int
    total_validated: int
    valid_count: int
    invalid_count: int
    validation_results: list


@router.get("/job/{job_id}", response_model=ValidationResponse)
def validate_job_fields(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    validation_service: ValidationService = Depends(get_validation_service)
):
    """Validate all fields for a job.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        validation_service: Validation service instance

    Returns:
        ValidationResponse: Validation results for all fields

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

    try:
        validation_results = validation_service.validate_job_fields(job_id, db)
        logger.info(
            f"Validated {validation_results['total_validated']} fields for job {job_id} "
            f"(valid: {validation_results['valid_count']}, invalid: {validation_results['invalid_count']})"
        )
        return validation_results

    except Exception as e:
        logger.error(f"Validation failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )


@router.get("/field/{field_id}")
def validate_single_field(
    field_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    validation_service: ValidationService = Depends(get_validation_service)
):
    """Validate a single field.

    Args:
        field_id: Field ID
        current_user: Authenticated user
        db: Database session
        validation_service: Validation service instance

    Returns:
        dict: Validation result for the field

    Raises:
        HTTPException 404: If field not found or doesn't belong to user's job
    """
    from app.models.field import ExtractedField

    # Get field and verify job ownership
    field = db.query(ExtractedField).filter(
        ExtractedField.id == field_id
    ).first()

    if not field:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Field not found"
        )

    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == field.job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        is_valid, error_message = validation_service.validate_single_field(field_id, db)

        return {
            "field_id": field_id,
            "field_name": field.field_name,
            "is_valid": is_valid,
            "error_message": error_message
        }

    except Exception as e:
        logger.error(f"Validation failed for field {field_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )

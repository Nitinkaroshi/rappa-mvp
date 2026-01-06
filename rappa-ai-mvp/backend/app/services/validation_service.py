"""Field validation service for extracted document fields."""

import logging
from typing import Dict, List, Tuple, Optional
from sqlalchemy.orm import Session

from app.models.field import ExtractedField
from app.utils.validators import validate_field, auto_detect_field_type, VALIDATORS

logger = logging.getLogger(__name__)


class ValidationService:
    """Service for validating extracted field values."""

    def validate_job_fields(self, job_id: int, db: Session) -> Dict[str, any]:
        """Validate all fields for a job.

        Args:
            job_id: Job ID to validate
            db: Database session

        Returns:
            Dict with validation results for each field
        """
        fields = db.query(ExtractedField).filter(
            ExtractedField.job_id == job_id
        ).all()

        validation_results = []
        valid_count = 0
        invalid_count = 0

        for field in fields:
            # Skip metadata fields
            if field.field_name.startswith('_'):
                continue

            # Auto-detect field type from field name
            field_type = auto_detect_field_type(field.field_name)

            if not field_type:
                # No validator for this field type
                continue

            # Get current value
            current_value = field.edited_value if field.is_edited else field.original_value

            if not current_value:
                # Empty value - skip validation
                continue

            # Validate
            is_valid, error_message = validate_field(field_type, current_value)

            result = {
                "field_id": field.id,
                "field_name": field.field_name,
                "field_type": field_type,
                "value": current_value,
                "is_valid": is_valid,
                "error_message": error_message,
                "format_template": VALIDATORS[field_type].format_template if field_type in VALIDATORS else None
            }

            validation_results.append(result)

            if is_valid:
                valid_count += 1
            else:
                invalid_count += 1

        return {
            "job_id": job_id,
            "total_validated": len(validation_results),
            "valid_count": valid_count,
            "invalid_count": invalid_count,
            "validation_results": validation_results
        }

    def validate_single_field(
        self,
        field_id: int,
        db: Session
    ) -> Tuple[bool, Optional[str]]:
        """Validate a single field.

        Args:
            field_id: Field ID to validate
            db: Database session

        Returns:
            Tuple of (is_valid, error_message)
        """
        field = db.query(ExtractedField).filter(
            ExtractedField.id == field_id
        ).first()

        if not field:
            return False, "Field not found"

        # Auto-detect field type
        field_type = auto_detect_field_type(field.field_name)

        if not field_type:
            return True, None  # No validator = assume valid

        # Get current value
        current_value = field.edited_value if field.is_edited else field.original_value

        if not current_value:
            return True, None  # Empty = assume valid

        # Validate
        return validate_field(field_type, current_value)


def get_validation_service() -> ValidationService:
    """Dependency injection for validation service."""
    return ValidationService()

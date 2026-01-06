"""Accounting export API endpoints."""

import logging
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from pydantic import BaseModel
import io

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.job import Job
from app.models.accounting_config import AccountingConfig
from app.models.accounting_export_history import AccountingExportHistory
from app.services.accounting.tally_exporter import TallyExporter

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize exporters
EXPORTERS = {
    "tally": TallyExporter(),
    # Future: Add QuickBooks, Zoho, etc.
}


# ============================================================================
# Pydantic Schemas
# ============================================================================

class SupportedSoftware(BaseModel):
    """Information about supported accounting software."""
    id: str
    name: str
    description: str
    file_format: str
    required_fields: List[str]


class ValidationRequest(BaseModel):
    """Request to validate data for accounting export."""
    job_id: int
    software: str


class ValidationResponse(BaseModel):
    """Response from data validation."""
    valid: bool
    errors: List[str]
    warnings: List[str]
    total_documents: int


class PreviewRequest(BaseModel):
    """Request to preview accounting export."""
    job_id: int
    software: str
    config: Dict[str, Any]
    limit: int = 5


class PreviewResponse(BaseModel):
    """Response with preview data."""
    preview_data: List[Dict[str, Any]]
    total_count: int


class ExportRequest(BaseModel):
    """Request to generate accounting export file."""
    job_id: int
    software: str
    config: Dict[str, Any]


class ConfigSchemaResponse(BaseModel):
    """Response with configuration schema."""
    model_config = {"protected_namespaces": ()}

    schema: Dict[str, Any]
    default_config: Dict[str, Any]


class SavedConfigResponse(BaseModel):
    """Response for saved configuration."""
    id: int
    software: str
    config: Dict[str, Any]
    name: str
    is_default: bool
    created_at: Any
    updated_at: Any

    class Config:
        from_attributes = True


class BatchExportRequest(BaseModel):
    """Request to export multiple jobs at once."""
    job_ids: List[int]
    software: str
    config: Dict[str, Any]


class ExportHistoryResponse(BaseModel):
    """Response for export history."""
    id: int
    job_ids: List[int]
    software: str
    file_name: str
    voucher_count: int
    status: str
    created_at: Any

    class Config:
        from_attributes = True


# ============================================================================
# API Endpoints
# ============================================================================

@router.get("/supported-software", response_model=List[SupportedSoftware])
def get_supported_software(
    current_user: User = Depends(get_current_active_user)
):
    """Get list of supported accounting software.

    Returns:
        List of supported accounting software with their details
    """
    supported = []

    for software_id, exporter in EXPORTERS.items():
        if software_id == "tally":
            supported.append(SupportedSoftware(
                id=software_id,
                name="Tally Prime",
                description="Export as Tally XML vouchers (Purchase, Sales, Payment, Receipt)",
                file_format="XML",
                required_fields=exporter.get_required_fields()
            ))

    return supported


@router.get("/{software}/config", response_model=ConfigSchemaResponse)
def get_config_schema(
    software: str,
    current_user: User = Depends(get_current_active_user)
):
    """Get configuration schema for a specific accounting software.

    Args:
        software: Software ID (e.g., 'tally', 'quickbooks')

    Returns:
        Configuration schema and default values
    """
    if software not in EXPORTERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Software '{software}' not supported"
        )

    exporter = EXPORTERS[software]

    return ConfigSchemaResponse(
        schema=exporter.get_config_schema(),
        default_config=exporter.get_default_config()
    )


@router.post("/validate", response_model=ValidationResponse)
def validate_data(
    request: ValidationRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Validate that job data is compatible with accounting software.

    Args:
        request: Validation request with job_id and software

    Returns:
        Validation results with errors and warnings
    """
    # Check software exists
    if request.software not in EXPORTERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Software '{request.software}' not supported"
        )

    # Get job
    job = db.query(Job).filter(
        Job.id == request.job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job must be completed before export"
        )

    # Get extracted data
    extracted_data = job.results or []

    if not extracted_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no extracted data"
        )

    # Validate with exporter
    exporter = EXPORTERS[request.software]
    validation_result = exporter.validate_data(extracted_data)

    logger.info(
        f"Validated job {request.job_id} for {request.software}: "
        f"valid={validation_result['valid']}, "
        f"errors={len(validation_result['errors'])}, "
        f"warnings={len(validation_result['warnings'])}"
    )

    return ValidationResponse(
        valid=validation_result["valid"],
        errors=validation_result["errors"],
        warnings=validation_result["warnings"],
        total_documents=len(extracted_data)
    )


@router.post("/preview", response_model=PreviewResponse)
def preview_export(
    request: PreviewRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Preview how data will look after transformation.

    Args:
        request: Preview request with job_id, software, and config

    Returns:
        Preview of transformed data
    """
    # Check software exists
    if request.software not in EXPORTERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Software '{request.software}' not supported"
        )

    # Get job
    job = db.query(Job).filter(
        Job.id == request.job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    # Get extracted data
    extracted_data = job.results or []

    if not extracted_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no extracted data"
        )

    # Generate preview
    exporter = EXPORTERS[request.software]
    preview_data = exporter.preview_data(
        extracted_data,
        request.config,
        limit=request.limit
    )

    logger.info(
        f"Generated preview for job {request.job_id} with {request.software}"
    )

    return PreviewResponse(
        preview_data=preview_data,
        total_count=len(extracted_data)
    )


@router.post("/generate")
def generate_export(
    request: ExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate accounting export file.

    Args:
        request: Export request with job_id, software, and config

    Returns:
        Export file as download
    """
    # Check software exists
    if request.software not in EXPORTERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Software '{request.software}' not supported"
        )

    # Get job
    job = db.query(Job).filter(
        Job.id == request.job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    if job.status != "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job must be completed before export"
        )

    # Get extracted data
    extracted_data = job.results or []

    if not extracted_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Job has no extracted data"
        )

    # Validate data first
    exporter = EXPORTERS[request.software]
    validation_result = exporter.validate_data(extracted_data)

    if not validation_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data validation failed: {', '.join(validation_result['errors'])}"
        )

    # Transform data
    try:
        transformed_data = exporter.transform_data(extracted_data, request.config)
    except Exception as e:
        logger.error(f"Failed to transform data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transform data: {str(e)}"
        )

    # Generate export file
    try:
        file_content = exporter.generate_export_file(transformed_data)
    except Exception as e:
        logger.error(f"Failed to generate export file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate export file: {str(e)}"
        )

    # Determine filename and media type
    if request.software == "tally":
        filename = f"tally_export_{job.id}.xml"
        media_type = "application/xml"
    else:
        filename = f"{request.software}_export_{job.id}.txt"
        media_type = "text/plain"

    logger.info(
        f"Generated {request.software} export for job {request.job_id}: "
        f"{len(transformed_data)} vouchers"
    )

    # Save export history
    try:
        export_history = AccountingExportHistory(
            user_id=current_user.id,
            job_ids=[request.job_id],
            software=request.software,
            config=request.config,
            file_name=filename,
            voucher_count=len(transformed_data),
            status="completed"
        )
        db.add(export_history)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to save export history: {str(e)}")
        # Don't fail the export if history save fails

    # Return file as download
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ============================================================================
# Configuration Management Endpoints
# ============================================================================

@router.post("/config/save", response_model=SavedConfigResponse)
def save_config(
    software: str,
    config: Dict[str, Any],
    name: str = "Default",
    is_default: bool = False,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Save accounting export configuration.

    Args:
        software: Software ID
        config: Configuration to save
        name: Configuration name
        is_default: Set as default for this software
        current_user: Authenticated user
        db: Database session

    Returns:
        Saved configuration
    """
    # Check if config with same name exists
    existing = db.query(AccountingConfig).filter(
        AccountingConfig.user_id == current_user.id,
        AccountingConfig.software == software,
        AccountingConfig.name == name
    ).first()

    if existing:
        # Update existing
        existing.config = config
        existing.is_default = is_default
        existing.updated_at = func.now()
        db.commit()
        db.refresh(existing)
        logger.info(f"Updated config '{name}' for {software} by user {current_user.id}")
        return existing

    # If setting as default, unset other defaults
    if is_default:
        db.query(AccountingConfig).filter(
            AccountingConfig.user_id == current_user.id,
            AccountingConfig.software == software
        ).update({"is_default": False})

    # Create new config
    new_config = AccountingConfig(
        user_id=current_user.id,
        software=software,
        config=config,
        name=name,
        is_default=is_default
    )
    db.add(new_config)
    db.commit()
    db.refresh(new_config)

    logger.info(f"Saved new config '{name}' for {software} by user {current_user.id}")
    return new_config


@router.get("/config/{software}", response_model=List[SavedConfigResponse])
def get_saved_configs(
    software: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all saved configurations for a software.

    Args:
        software: Software ID
        current_user: Authenticated user
        db: Database session

    Returns:
        List of saved configurations
    """
    configs = db.query(AccountingConfig).filter(
        AccountingConfig.user_id == current_user.id,
        AccountingConfig.software == software
    ).order_by(AccountingConfig.is_default.desc(), AccountingConfig.updated_at.desc()).all()

    return configs


@router.delete("/config/{config_id}")
def delete_config(
    config_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a saved configuration.

    Args:
        config_id: Configuration ID
        current_user: Authenticated user
        db: Database session

    Returns:
        Success message
    """
    config = db.query(AccountingConfig).filter(
        AccountingConfig.id == config_id,
        AccountingConfig.user_id == current_user.id
    ).first()

    if not config:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Configuration not found"
        )

    db.delete(config)
    db.commit()

    logger.info(f"Deleted config {config_id} by user {current_user.id}")
    return {"message": "Configuration deleted successfully"}


# ============================================================================
# Batch Export Endpoint
# ============================================================================

@router.post("/batch-generate")
def batch_generate_export(
    request: BatchExportRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Generate accounting export for multiple jobs.

    Args:
        request: Batch export request with job_ids, software, and config

    Returns:
        Combined export file as download
    """
    # Check software exists
    if request.software not in EXPORTERS:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Software '{request.software}' not supported"
        )

    # Get all jobs
    jobs = db.query(Job).filter(
        Job.id.in_(request.job_ids),
        Job.user_id == current_user.id,
        Job.status == "completed"
    ).all()

    if not jobs:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed jobs found"
        )

    if len(jobs) != len(request.job_ids):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Some jobs not found or not completed. Found {len(jobs)} of {len(request.job_ids)} jobs."
        )

    # Collect all extracted data
    all_extracted_data = []
    for job in jobs:
        extracted_data = job.results or []
        if extracted_data:
            all_extracted_data.extend(extracted_data)

    if not all_extracted_data:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No extracted data found in any of the jobs"
        )

    # Validate combined data
    exporter = EXPORTERS[request.software]
    validation_result = exporter.validate_data(all_extracted_data)

    if not validation_result["valid"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Data validation failed: {', '.join(validation_result['errors'])}"
        )

    # Transform data
    try:
        transformed_data = exporter.transform_data(all_extracted_data, request.config)
    except Exception as e:
        logger.error(f"Failed to transform batch data: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to transform data: {str(e)}"
        )

    # Generate export file
    try:
        file_content = exporter.generate_export_file(transformed_data)
    except Exception as e:
        logger.error(f"Failed to generate batch export file: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate export file: {str(e)}"
        )

    # Determine filename and media type
    job_ids_str = "_".join(str(jid) for jid in request.job_ids[:3])
    if len(request.job_ids) > 3:
        job_ids_str += f"_plus{len(request.job_ids) - 3}"

    if request.software == "tally":
        filename = f"tally_batch_{job_ids_str}.xml"
        media_type = "application/xml"
    else:
        filename = f"{request.software}_batch_{job_ids_str}.txt"
        media_type = "text/plain"

    logger.info(
        f"Generated batch {request.software} export for {len(request.job_ids)} jobs: "
        f"{len(transformed_data)} vouchers"
    )

    # Save export history
    try:
        export_history = AccountingExportHistory(
            user_id=current_user.id,
            job_ids=request.job_ids,
            software=request.software,
            config=request.config,
            file_name=filename,
            voucher_count=len(transformed_data),
            status="completed"
        )
        db.add(export_history)
        db.commit()
    except Exception as e:
        logger.warning(f"Failed to save batch export history: {str(e)}")

    # Return file as download
    return StreamingResponse(
        io.BytesIO(file_content),
        media_type=media_type,
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"'
        }
    )


# ============================================================================
# Export History Endpoint
# ============================================================================

@router.get("/history", response_model=List[ExportHistoryResponse])
def get_export_history(
    software: str = None,
    limit: int = 50,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get export history for the current user.

    Args:
        software: Optional filter by software
        limit: Maximum number of records to return
        current_user: Authenticated user
        db: Database session

    Returns:
        List of export history records
    """
    query = db.query(AccountingExportHistory).filter(
        AccountingExportHistory.user_id == current_user.id
    )

    if software:
        query = query.filter(AccountingExportHistory.software == software)

    history = query.order_by(
        AccountingExportHistory.created_at.desc()
    ).limit(limit).all()

    return history

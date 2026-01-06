"""Custom template API endpoints for user-defined document processing."""

import logging
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import func
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.custom_template import CustomTemplate
from app.services.storage_service import get_storage_service, StorageService
from app.services.schema_generation_service import get_schema_service, SchemaGenerationService

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class SchemaField(BaseModel):
    """Schema for a single field definition."""
    model_config = {"protected_namespaces": ()}

    name: str = Field(..., min_length=1, max_length=100)
    label: str = Field(..., min_length=1, max_length=200)
    type: str = Field(..., pattern="^(text|number|date|email|phone|currency|boolean)$")
    required: bool = False
    description: Optional[str] = ""


class TemplateCreate(BaseModel):
    """Schema for creating a custom template."""
    model_config = {"protected_namespaces": ()}

    name: str = Field(..., min_length=1, max_length=200)
    document_type: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    schema: List[SchemaField]


class TemplateUpdate(BaseModel):
    """Schema for updating a custom template."""
    model_config = {"protected_namespaces": ()}

    name: Optional[str] = Field(None, min_length=1, max_length=200)
    document_type: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    schema: Optional[List[SchemaField]] = None


class TemplateResponse(BaseModel):
    """Response schema for custom template."""
    model_config = {"from_attributes": True, "protected_namespaces": ()}

    id: int
    user_id: int
    name: str
    document_type: str
    description: Optional[str]
    schema: List[dict]
    sample_image_path: Optional[str]
    field_count: int
    created_at: datetime
    updated_at: datetime


class SchemaGenerationResponse(BaseModel):
    """Response for AI-generated schema."""
    model_config = {"protected_namespaces": ()}

    schema: List[dict]
    field_count: int


class SchemaValidationResponse(BaseModel):
    """Response for schema validation."""
    model_config = {"protected_namespaces": ()}

    valid: bool
    extracted_data: dict
    warnings: List[str]
    coverage: float


# ============================================================================
# Custom Template Endpoints
# ============================================================================

@router.post("/generate-schema", response_model=SchemaGenerationResponse)
async def generate_schema(
    file: UploadFile = File(...),
    document_type: Optional[str] = Form(None),
    user_instructions: Optional[str] = Form(None),
    current_user: User = Depends(get_current_active_user),
    schema_service: SchemaGenerationService = Depends(get_schema_service)
):
    """Generate a schema from a sample document using AI.

    This endpoint allows users to upload a sample document and get an
    AI-suggested schema of fields to extract.

    Args:
        file: Sample document (image or PDF)
        document_type: Optional hint about document type
        user_instructions: Optional additional instructions
        current_user: Authenticated user
        schema_service: Schema generation service

    Returns:
        SchemaGenerationResponse: AI-suggested schema fields

    Raises:
        HTTPException 400: If file type not supported or generation fails
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/jpg", "image/png", "application/pdf"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unsupported file type. Allowed: {', '.join(allowed_types)}"
        )

    try:
        # Read file content
        file_content = await file.read()

        # Generate schema based on file type
        if file.content_type == "application/pdf":
            # For PDFs, we need to save temporarily
            import tempfile
            import os

            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(file_content)
                tmp_path = tmp_file.name

            try:
                schema = schema_service.generate_schema_from_pdf(
                    pdf_path=tmp_path,
                    document_type=document_type,
                    user_instructions=user_instructions
                )
            finally:
                os.unlink(tmp_path)
        else:
            # For images, use direct content
            schema = schema_service.generate_schema_from_image(
                image_content=file_content,
                document_type=document_type,
                user_instructions=user_instructions
            )

        logger.info(f"Generated schema with {len(schema)} fields for user {current_user.id}")

        return SchemaGenerationResponse(
            schema=schema,
            field_count=len(schema)
        )

    except Exception as e:
        logger.error(f"Schema generation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to generate schema: {str(e)}"
        )


@router.post("/validate-schema", response_model=SchemaValidationResponse)
async def validate_schema(
    file: UploadFile = File(...),
    schema_json: str = Form(..., alias="schema"),
    current_user: User = Depends(get_current_active_user),
    schema_service: SchemaGenerationService = Depends(get_schema_service)
):
    """Validate a modified schema against the original document.

    This allows users to verify that their edited schema can still
    extract data from the document.

    Args:
        file: Sample document file
        schema_json: JSON string of the schema
        current_user: Authenticated user
        schema_service: Schema generation service

    Returns:
        SchemaValidationResponse: Validation results with sample extraction

    Raises:
        HTTPException 400: If validation fails
    """
    import json

    try:
        logger.info(f"Validating schema for file: {file.filename}")
        logger.info(f"Schema JSON type: {type(schema_json)}, length: {len(schema_json) if schema_json else 0}")

        # Ensure schema_json is a string
        if not isinstance(schema_json, str):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Schema must be a JSON string, got {type(schema_json)}"
            )

        # Parse schema JSON
        try:
            schema_data = json.loads(schema_json)
            if not isinstance(schema_data, list):
                raise ValueError("Schema must be a JSON array")
            logger.info(f"Parsed schema with {len(schema_data)} fields")
        except json.JSONDecodeError as e:
            logger.error(f"JSON decode error: {str(e)}, schema: {schema_json[:200]}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid schema JSON: {str(e)}"
            )
        except ValueError as e:
            logger.error(f"Schema validation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

        # Validate each schema field
        try:
            validated_schema = []
            for i, field in enumerate(schema_data):
                try:
                    validated_field = SchemaField(**field)
                    validated_schema.append(validated_field)
                except Exception as field_error:
                    logger.error(f"Field {i} validation error: {str(field_error)}, field data: {field}")
                    raise ValueError(f"Field {i} is invalid: {str(field_error)}")
        except Exception as e:
            logger.error(f"Schema field validation error: {str(e)}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid schema format: {str(e)}"
            )

        # Read file content
        file_content = await file.read()

        # Convert Pydantic models to dicts
        schema_dicts = [field.model_dump() for field in validated_schema]

        # Validate schema
        validation_result = schema_service.validate_schema_against_document(
            schema=schema_dicts,
            image_content=file_content
        )

        logger.info(f"Schema validation for user {current_user.id}: "
                   f"valid={validation_result['valid']}, coverage={validation_result['coverage']}%")

        return SchemaValidationResponse(**validation_result)

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Schema validation failed: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation failed: {str(e)}"
        )


@router.post("/", response_model=TemplateResponse, status_code=status.HTTP_201_CREATED)
async def create_template(
    name: str = Form(...),
    document_type: str = Form(...),
    description: Optional[str] = Form(None),
    schema: str = Form(...),  # JSON string
    sample_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service)
):
    """Create a new custom template.

    Args:
        name: Template name
        document_type: Type of document
        description: Optional description
        schema: JSON string of schema fields
        sample_image: Optional sample document image
        current_user: Authenticated user
        db: Database session
        storage: Storage service

    Returns:
        TemplateResponse: Created template

    Raises:
        HTTPException 400: If validation fails
    """
    import json

    # Parse schema JSON
    try:
        schema_data = json.loads(schema)
        if not isinstance(schema_data, list):
            raise ValueError("Schema must be a JSON array")
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid schema JSON"
        )

    # Validate schema fields
    try:
        validated_schema = [SchemaField(**field) for field in schema_data]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid schema format: {str(e)}"
        )

    # Upload sample image if provided
    sample_image_path = None
    if sample_image and sample_image.filename:
        try:
            file_content = await sample_image.read()
            sample_image_path = storage.upload_file(
                file_obj=io.BytesIO(file_content),
                filename=f"template_{datetime.utcnow().timestamp()}_{sample_image.filename}",
                user_id=current_user.id,
                content_type=sample_image.content_type,
                folder="templates"
            )
            logger.info(f"Uploaded template sample image to {sample_image_path}")
        except Exception as e:
            logger.error(f"Failed to upload sample image: {str(e)}")

    # Create template
    template = CustomTemplate(
        user_id=current_user.id,
        name=name,
        document_type=document_type,
        description=description,
        schema=[field.model_dump() for field in validated_schema],
        sample_image_path=sample_image_path,
        field_count=len(validated_schema)
    )

    db.add(template)
    db.commit()
    db.refresh(template)

    logger.info(f"Created custom template {template.id} for user {current_user.id}: {name}")

    return template


@router.get("/", response_model=List[TemplateResponse])
def get_templates(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all custom templates for the current user.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        List[TemplateResponse]: List of user's templates
    """
    templates = db.query(CustomTemplate).filter(
        CustomTemplate.user_id == current_user.id
    ).order_by(CustomTemplate.created_at.desc()).all()

    return templates


@router.get("/{template_id}", response_model=TemplateResponse)
def get_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific template by ID.

    Args:
        template_id: Template ID
        current_user: Authenticated user
        db: Database session

    Returns:
        TemplateResponse: Template details

    Raises:
        HTTPException 404: If template not found
        HTTPException 403: If template doesn't belong to user
    """
    template = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Check ownership
    if template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this template"
        )

    return template


@router.patch("/{template_id}", response_model=TemplateResponse)
async def update_template(
    template_id: int,
    name: Optional[str] = Form(None),
    document_type: Optional[str] = Form(None),
    description: Optional[str] = Form(None),
    schema: Optional[str] = Form(None),  # JSON string
    sample_image: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service)
):
    """Update a custom template.

    Args:
        template_id: Template ID
        name: New template name
        document_type: New document type
        description: New description
        schema: New schema JSON string
        sample_image: New sample image
        current_user: Authenticated user
        db: Database session
        storage: Storage service

    Returns:
        TemplateResponse: Updated template

    Raises:
        HTTPException 404: If template not found
        HTTPException 403: If template doesn't belong to user
        HTTPException 400: If validation fails
    """
    import json

    template = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Check ownership
    if template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this template"
        )

    # Update fields
    if name is not None:
        template.name = name

    if document_type is not None:
        template.document_type = document_type

    if description is not None:
        template.description = description

    if schema is not None:
        try:
            schema_data = json.loads(schema)
            validated_schema = [SchemaField(**field) for field in schema_data]
            template.schema = [field.model_dump() for field in validated_schema]
            template.field_count = len(validated_schema)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid schema: {str(e)}"
            )

    if sample_image and sample_image.filename:
        try:
            file_content = await sample_image.read()
            sample_image_path = storage.upload_file(
                file_obj=io.BytesIO(file_content),
                filename=f"template_{datetime.utcnow().timestamp()}_{sample_image.filename}",
                user_id=current_user.id,
                content_type=sample_image.content_type,
                folder="templates"
            )
            template.sample_image_path = sample_image_path
        except Exception as e:
            logger.error(f"Failed to upload sample image: {str(e)}")

    db.commit()
    db.refresh(template)

    logger.info(f"Updated template {template_id} by user {current_user.id}")

    return template


@router.delete("/{template_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_template(
    template_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a custom template.

    Args:
        template_id: Template ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException 404: If template not found
        HTTPException 403: If template doesn't belong to user
        HTTPException 400: If template has active batches
    """
    template = db.query(CustomTemplate).filter(CustomTemplate.id == template_id).first()

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Template not found"
        )

    # Check ownership
    if template.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this template"
        )

    # Check for active batches
    from app.models.batch import Batch
    active_batches = db.query(func.count(Batch.id)).filter(
        Batch.custom_template_id == template_id,
        Batch.status.in_(["pending", "processing"])
    ).scalar()

    if active_batches > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot delete template with {active_batches} active batches. "
                   "Please complete or cancel batches first."
        )

    db.delete(template)
    db.commit()

    logger.info(f"Deleted template {template_id} by user {current_user.id}")

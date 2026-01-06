"""Templates API endpoints for document template management."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict

from app.services.template_service import get_template_service, TemplateService
from app.services.cache_service import cache

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/", response_model=List[Dict])
def list_templates(
    template_service: TemplateService = Depends(get_template_service)
):
    """List all available document templates.

    Returns a list of all templates with basic metadata including:
    - Template ID
    - Name
    - Description
    - Category
    - Country
    - Field count

    Returns:
        List[Dict]: List of template metadata
    """
    # Cache templates for 1 hour (they rarely change)
    cache_key = "templates:all"

    def fetch_templates():
        templates = template_service.get_all_templates()
        logger.info(f"Retrieved {len(templates)} templates from database")
        return templates

    templates = cache.get_or_set(cache_key, fetch_templates, ttl=3600)
    return templates


@router.get("/categories", response_model=List[Dict])
def list_categories(
    template_service: TemplateService = Depends(get_template_service)
):
    """List all template categories with counts.

    Returns:
        List[Dict]: List of categories with template counts
    """
    # Cache categories for 1 hour
    cache_key = "templates:categories"

    def fetch_categories():
        categories = template_service.get_template_categories()
        logger.info(f"Retrieved {len(categories)} categories from database")
        return categories

    categories = cache.get_or_set(cache_key, fetch_categories, ttl=3600)
    return categories


@router.get("/category/{category_name}", response_model=List[Dict])
def list_templates_by_category(
    category_name: str,
    template_service: TemplateService = Depends(get_template_service)
):
    """List all templates in a specific category.

    Args:
        category_name: Category name (financial, identity, etc.)

    Returns:
        List[Dict]: List of templates in the category

    Raises:
        HTTPException 404: If category has no templates
    """
    templates = template_service.get_templates_by_category(category_name)

    if not templates:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No templates found in category: {category_name}"
        )

    logger.info(f"Retrieved {len(templates)} templates in category: {category_name}")
    return templates


@router.get("/{template_id}", response_model=Dict)
def get_template(
    template_id: str,
    template_service: TemplateService = Depends(get_template_service)
):
    """Get detailed template information including all fields.

    Args:
        template_id: Template identifier

    Returns:
        Dict: Complete template definition with all fields

    Raises:
        HTTPException 404: If template not found
    """
    template = template_service.get_template(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )

    logger.info(f"Retrieved template details: {template_id}")
    return template


@router.get("/{template_id}/fields", response_model=List[Dict])
def get_template_fields(
    template_id: str,
    template_service: TemplateService = Depends(get_template_service)
):
    """Get field definitions for a specific template.

    Args:
        template_id: Template identifier

    Returns:
        List[Dict]: List of field definitions

    Raises:
        HTTPException 404: If template not found
    """
    template = template_service.get_template(template_id)

    if not template:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )

    logger.info(f"Retrieved {len(template['fields'])} fields for template: {template_id}")
    return template['fields']


@router.get("/{template_id}/required-fields", response_model=List[str])
def get_required_fields(
    template_id: str,
    template_service: TemplateService = Depends(get_template_service)
):
    """Get list of required field names for a template.

    Args:
        template_id: Template identifier

    Returns:
        List[str]: List of required field names

    Raises:
        HTTPException 404: If template not found
    """
    if not template_service.validate_template_id(template_id):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Template not found: {template_id}"
        )

    required_fields = template_service.get_required_fields(template_id)
    logger.info(f"Retrieved {len(required_fields)} required fields for template: {template_id}")
    return required_fields

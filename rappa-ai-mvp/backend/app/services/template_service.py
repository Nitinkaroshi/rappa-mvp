"""Template service for managing document templates."""

import json
import logging
from pathlib import Path
from typing import List, Dict, Optional

logger = logging.getLogger(__name__)


class TemplateService:
    """Service for managing document extraction templates."""

    def __init__(self):
        """Initialize template service by loading templates from JSON file."""
        template_file = Path(__file__).parent.parent / "data" / "templates.json"

        try:
            with open(template_file, 'r', encoding='utf-8') as f:
                data = json.load(f)
                self.templates = {t['id']: t for t in data['templates']}
                logger.info(f"Loaded {len(self.templates)} templates successfully")
        except FileNotFoundError:
            logger.error(f"Templates file not found: {template_file}")
            self.templates = {}
        except json.JSONDecodeError as e:
            logger.error(f"Error parsing templates JSON: {e}")
            self.templates = {}

    def get_all_templates(self) -> List[Dict]:
        """Get list of all templates with basic information.

        Returns:
            List[Dict]: List of template metadata (without full field definitions)
        """
        return [
            {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "category": t["category"],
                "country": t.get("country", "general"),
                "field_count": len(t["fields"])
            }
            for t in self.templates.values()
        ]

    def get_template(self, template_id: str) -> Optional[Dict]:
        """Get full template definition by ID.

        Args:
            template_id: Template identifier

        Returns:
            Optional[Dict]: Template definition with all fields, or None if not found
        """
        template = self.templates.get(template_id)
        if template:
            logger.debug(f"Retrieved template: {template_id}")
        else:
            logger.warning(f"Template not found: {template_id}")
        return template

    def get_templates_by_category(self, category: str) -> List[Dict]:
        """Get all templates in a specific category.

        Args:
            category: Category name (e.g., 'financial', 'identity')

        Returns:
            List[Dict]: List of templates in the category
        """
        return [
            {
                "id": t["id"],
                "name": t["name"],
                "description": t["description"],
                "country": t.get("country", "general"),
                "field_count": len(t["fields"])
            }
            for t in self.templates.values()
            if t.get("category") == category
        ]

    def get_extraction_prompt(self, template_id: str, base_prompt: str) -> str:
        """Generate template-specific extraction prompt for LLM.

        Combines the base extraction prompt with template-specific instructions
        and expected field descriptions.

        Args:
            template_id: Template identifier
            base_prompt: Base prompt for field extraction

        Returns:
            str: Enhanced prompt with template-specific instructions
        """
        template = self.get_template(template_id)
        if not template:
            logger.warning(f"Template {template_id} not found, using base prompt")
            return base_prompt

        # Build field descriptions
        field_descriptions = []
        for field in template['fields']:
            required_marker = " (REQUIRED)" if field.get('required') else ""
            hint = field.get('extraction_hint', 'Extract as shown in document')
            field_descriptions.append(
                f"  - {field['label']} ({field['name']}){required_marker}: {hint}"
            )

        # Combine prompts
        enhanced_prompt = f"""{base_prompt}

DOCUMENT TYPE: {template['name']}
DESCRIPTION: {template['description']}

EXPECTED FIELDS:
{chr(10).join(field_descriptions)}

TEMPLATE-SPECIFIC INSTRUCTIONS:
{template.get('prompt_template', 'Extract all relevant information from the document.')}

IMPORTANT:
- Extract ONLY fields that are clearly visible in the document
- For required fields, make every effort to find the information
- Use "Not found" for fields that cannot be located
- Maintain exact formatting for special fields (Aadhaar: XXXX XXXX XXXX, PAN: ABCDE1234F, GSTIN: 15 characters)
- Preserve original currency symbols and formats
- For Indian documents, handle both English and regional languages (Hindi, Kannada, Tamil, etc.)
"""

        return enhanced_prompt

    def validate_template_id(self, template_id: str) -> bool:
        """Check if a template ID exists.

        Args:
            template_id: Template identifier to validate

        Returns:
            bool: True if template exists, False otherwise
        """
        return template_id in self.templates

    def get_required_fields(self, template_id: str) -> List[str]:
        """Get list of required field names for a template.

        Args:
            template_id: Template identifier

        Returns:
            List[str]: List of required field names
        """
        template = self.get_template(template_id)
        if not template:
            return []

        return [
            field['name']
            for field in template['fields']
            if field.get('required', False)
        ]

    def get_template_categories(self) -> List[Dict]:
        """Get all unique template categories.

        Returns:
            List[Dict]: List of categories with count
        """
        categories = {}
        for template in self.templates.values():
            category = template.get('category', 'general')
            if category not in categories:
                categories[category] = {
                    'category': category,
                    'count': 0
                }
            categories[category]['count'] += 1

        return list(categories.values())


def get_template_service() -> TemplateService:
    """Get TemplateService instance.

    Returns:
        TemplateService: Singleton template service instance
    """
    return TemplateService()

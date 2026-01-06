"""Schema generation service using Gemini AI for custom templates."""

import logging
import base64
from typing import List, Dict, Any, Optional
import google.generativeai as genai
from PIL import Image
import io
import json

from app.config import settings

logger = logging.getLogger(__name__)


class SchemaGenerationService:
    """Service for generating document schemas using Gemini AI.

    This service analyzes sample documents and suggests field schemas
    that can be used to create custom templates for batch processing.
    """

    def __init__(self):
        """Initialize the schema generation service with Gemini API."""
        if not settings.GEMINI_API_KEY:
            raise ValueError("GEMINI_API_KEY not configured")

        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(settings.GEMINI_MODEL)
        logger.info(f"Initialized SchemaGenerationService with model: {settings.GEMINI_MODEL}")

    def generate_schema_from_image(
        self,
        image_content: bytes,
        document_type: Optional[str] = None,
        user_instructions: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        """Generate schema fields from a document image using Gemini Vision.

        Args:
            image_content: Raw image bytes (JPG, PNG, etc.)
            document_type: Optional hint about document type (e.g., "Invoice", "Receipt")
            user_instructions: Optional additional instructions from user

        Returns:
            List of field definitions:
            [
                {
                    "name": "invoice_number",
                    "label": "Invoice Number",
                    "type": "text",
                    "required": true,
                    "description": "Unique invoice identifier"
                },
                ...
            ]

        Raises:
            Exception: If AI extraction fails
        """
        try:
            # Load image
            image = Image.open(io.BytesIO(image_content))

            # Build prompt for Gemini
            prompt = self._build_schema_prompt(document_type, user_instructions)

            # Generate schema using Gemini Vision
            logger.info(f"Generating schema for document type: {document_type or 'auto-detect'}")
            response = self.model.generate_content([prompt, image])

            # Parse JSON response
            schema = self._parse_schema_response(response.text)

            logger.info(f"Generated schema with {len(schema)} fields")
            return schema

        except Exception as e:
            logger.error(f"Failed to generate schema from image: {str(e)}")
            raise Exception(f"Schema generation failed: {str(e)}")

    def generate_schema_from_pdf(
        self,
        pdf_path: str,
        document_type: Optional[str] = None,
        user_instructions: Optional[str] = None,
        page_number: int = 1
    ) -> List[Dict[str, Any]]:
        """Generate schema from a PDF document (analyzes first page by default).

        Args:
            pdf_path: Path to PDF file
            document_type: Optional document type hint
            user_instructions: Optional user instructions
            page_number: Page to analyze (default: 1)

        Returns:
            List of field definitions (same format as generate_schema_from_image)

        Raises:
            Exception: If PDF processing or AI extraction fails
        """
        try:
            from pdf2image import convert_from_path

            # Convert first page of PDF to image
            logger.info(f"Converting PDF page {page_number} to image")
            images = convert_from_path(pdf_path, first_page=page_number, last_page=page_number)

            if not images:
                raise Exception("Failed to convert PDF to image")

            # Convert PIL Image to bytes
            img_byte_arr = io.BytesIO()
            images[0].save(img_byte_arr, format='PNG')
            img_byte_arr.seek(0)

            # Use image-based extraction
            return self.generate_schema_from_image(
                img_byte_arr.read(),
                document_type=document_type,
                user_instructions=user_instructions
            )

        except ImportError:
            logger.error("pdf2image library not installed")
            raise Exception("PDF processing requires pdf2image library")
        except Exception as e:
            logger.error(f"Failed to generate schema from PDF: {str(e)}")
            raise Exception(f"PDF schema generation failed: {str(e)}")

    def validate_schema_against_document(
        self,
        schema: List[Dict[str, Any]],
        image_content: bytes
    ) -> Dict[str, Any]:
        """Validate that a modified schema can extract data from the document.

        This is used when users modify the AI-suggested schema to ensure
        the new schema can still extract meaningful data.

        Args:
            schema: User-modified schema to validate
            image_content: Original document image bytes

        Returns:
            {
                "valid": bool,
                "extracted_data": dict,  # Sample extraction using the schema
                "warnings": list,  # Any validation warnings
                "coverage": float  # % of fields that could be extracted (0-100)
            }

        Raises:
            Exception: If validation fails
        """
        try:
            image = Image.open(io.BytesIO(image_content))

            # Filter out fields with no name or invalid structure
            valid_schema_fields = []
            for field in schema:
                if isinstance(field, dict) and field.get('name'):
                    valid_schema_fields.append(field)
                else:
                    logger.warning(f"Skipping invalid schema field: {field}")

            if not valid_schema_fields:
                return {
                    "valid": False,
                    "extracted_data": {},
                    "warnings": ["No valid fields in schema"],
                    "coverage": 0.0
                }

            # Build validation prompt
            prompt = f"""
You are validating a document processing schema. Given this schema definition and the document image,
extract data for ONLY the fields listed below and report if they can be found in the document.

Schema fields to validate (validate ONLY these fields):
{json.dumps(valid_schema_fields, indent=2)}

Instructions:
1. For EACH field in the schema above, try to extract its value from the document image
2. If the field exists in the document, extract its exact value
3. If the field doesn't exist, set value to null
4. Be flexible - the field might have slight variations in naming

Return your response as a VALID JSON object (no markdown, no code blocks) with this exact structure:
{{
    "valid": true,
    "extracted_data": {{
        "field1_name": "extracted_value_or_null",
        "field2_name": "extracted_value_or_null"
    }},
    "warnings": [],
    "coverage": 85.5
}}

CRITICAL: Return ONLY valid JSON, no markdown formatting, no code blocks.
"""

            response = self.model.generate_content([prompt, image])
            validation_result = self._parse_json_response(response.text)

            logger.info(f"Schema validation: {validation_result.get('valid', False)}, "
                       f"coverage: {validation_result.get('coverage', 0)}%")

            return validation_result

        except Exception as e:
            logger.error(f"Schema validation failed: {str(e)}")
            raise Exception(f"Validation failed: {str(e)}")

    def _build_schema_prompt(
        self,
        document_type: Optional[str] = None,
        user_instructions: Optional[str] = None
    ) -> str:
        """Build the prompt for Gemini to extract schema fields.

        Args:
            document_type: Optional document type hint
            user_instructions: Optional additional user instructions

        Returns:
            Formatted prompt string
        """
        base_prompt = """
You are an expert at analyzing documents and identifying data fields that should be extracted.

Analyze this document image and generate a comprehensive schema of fields that should be extracted.
For each field you identify, provide:
- name: snake_case field name (e.g., "invoice_number", "total_amount")
- label: Human-readable label (e.g., "Invoice Number", "Total Amount")
- type: Data type - one of: "text", "number", "date", "email", "phone", "currency", "boolean"
- required: Whether this field is typically required (true/false)
- description: Brief description of what this field contains

"""

        if document_type:
            base_prompt += f"\nDocument type hint: {document_type}\n"

        if user_instructions:
            base_prompt += f"\nAdditional instructions: {user_instructions}\n"

        base_prompt += """
Return your response as a JSON array with this exact format:
[
    {
        "name": "field_name",
        "label": "Field Label",
        "type": "text",
        "required": true,
        "description": "Field description"
    }
]

IMPORTANT:
- Return ONLY the JSON array, no markdown code blocks or extra text
- Include ALL visible fields you can identify in the document
- Use appropriate data types (text, number, date, currency, etc.)
- Be thorough - extract as many relevant fields as possible
"""

        return base_prompt

    def _parse_schema_response(self, response_text: str) -> List[Dict[str, Any]]:
        """Parse Gemini's response into a structured schema.

        Args:
            response_text: Raw text response from Gemini

        Returns:
            Parsed schema as list of field definitions

        Raises:
            Exception: If parsing fails
        """
        try:
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            cleaned = cleaned.strip()

            # Parse JSON
            schema = json.loads(cleaned)

            # Validate schema structure
            if not isinstance(schema, list):
                raise ValueError("Schema must be a JSON array")

            for field in schema:
                if not isinstance(field, dict):
                    raise ValueError("Each field must be a JSON object")

                required_keys = ["name", "label", "type"]
                for key in required_keys:
                    if key not in field:
                        raise ValueError(f"Field missing required key: {key}")

                # Set defaults
                field.setdefault("required", False)
                field.setdefault("description", "")

            return schema

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON response: {response_text}")
            raise Exception(f"Invalid JSON response from AI: {str(e)}")
        except Exception as e:
            logger.error(f"Failed to parse schema response: {str(e)}")
            raise Exception(f"Schema parsing failed: {str(e)}")

    def _parse_json_response(self, response_text: str) -> Dict[str, Any]:
        """Parse a JSON response from Gemini.

        Args:
            response_text: Raw response text

        Returns:
            Parsed JSON object

        Raises:
            Exception: If parsing fails
        """
        try:
            # Remove markdown code blocks if present
            cleaned = response_text.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            elif cleaned.startswith("```"):
                cleaned = cleaned[3:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]

            cleaned = cleaned.strip()

            return json.loads(cleaned)

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse JSON: {response_text}")
            raise Exception(f"Invalid JSON response: {str(e)}")


# Singleton instance
_schema_service: Optional[SchemaGenerationService] = None


def get_schema_service() -> SchemaGenerationService:
    """Get or create the schema generation service singleton.

    Returns:
        SchemaGenerationService instance

    Raises:
        ValueError: If GEMINI_API_KEY not configured
    """
    global _schema_service
    if _schema_service is None:
        _schema_service = SchemaGenerationService()
    return _schema_service

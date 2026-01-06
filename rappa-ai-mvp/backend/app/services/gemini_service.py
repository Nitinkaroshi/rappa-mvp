"""Gemini API service for field extraction from documents."""

import logging
import json
from typing import Dict, Any, List, Optional
from PIL import Image
import io
import base64

import google.generativeai as genai

from app.config import settings

logger = logging.getLogger(__name__)


# Enhanced JSON schema for intelligent field extraction
FIELD_EXTRACTION_PROMPT = """You are an expert document analyst specializing in extracting structured information from various types of documents (legal, financial, government, certificates, etc.).

Analyze this document and provide a comprehensive structured extraction in the following JSON format:

{
  "document_type": "Classify the document (e.g., Sale Deed, Rent Agreement, Birth Certificate, Aadhar Card, Driving License, Bank Statement, Invoice, etc.)",
  "confidence": 0.95,
  "extracted_data": [
    {"key": "Field Name 1", "value": "Extracted Value 1"},
    {"key": "Field Name 2", "value": "Extracted Value 2"},
    {"key": "Field Name 3", "value": "Extracted Value 3"}
  ],
  "summary": "A concise 2-3 sentence summary of the key information in this document, including main parties involved, purpose, dates, and amounts if applicable."
}

INSTRUCTIONS:
1. **document_type**: Intelligently classify the document type based on content, format, and purpose
2. **confidence**: Your confidence in the extraction (0.0-1.0), considering text quality and clarity
3. **extracted_data**: Extract ALL relevant key-value pairs from the document
   - For Sale Deeds/Property: buyer names, seller names, property location, survey number, sale amount, registration details, boundaries
   - For Certificates: holder name, father/mother name, date of birth/issue, certificate number, issuing authority
   - For IDs: name, ID number, address, date of issue, validity
   - For Financial docs: account number, transaction details, amounts, dates, parties
   - Use clear, descriptive key names (e.g., "Buyer Name" not just "Name")
   - Extract values exactly as they appear in the document
   - Preserve original language/script if in regional languages (Kannada, Hindi, etc.)
4. **summary**: Provide a brief but informative summary highlighting the document's purpose and key details

IMPORTANT:
- Extract ONLY information clearly present in the document
- Use "Not found" for fields you're uncertain about
- Be comprehensive - extract all relevant information
- Ensure the response is valid JSON
- Do not add explanatory text outside the JSON structure

Return ONLY the JSON object, nothing else."""


class GeminiService:
    """Service for extracting fields using Google Gemini API."""

    def __init__(self):
        """Initialize Gemini service."""
        if not settings.GEMINI_API_KEY:
            raise RuntimeError("GEMINI_API_KEY not configured in settings")

        genai.configure(api_key=settings.GEMINI_API_KEY)

        # Use Gemini 2.0 Flash for fast processing
        self.model = genai.GenerativeModel('gemini-2.0-flash-exp')

        logger.info("GeminiService initialized with gemini-2.0-flash-exp")

    def extract_fields_from_text(self, text: str, ocr_confidence: float = None) -> Dict[str, Any]:
        """Extract structured fields from text using Gemini.

        Args:
            text: Extracted text from document
            ocr_confidence: Optional OCR confidence score (0.0-1.0)

        Returns:
            dict: Extracted fields with document_type, confidence, data array, summary
        """
        logger.info(f"Extracting fields from text ({len(text)} characters)")

        try:
            # Construct prompt
            full_prompt = f"{FIELD_EXTRACTION_PROMPT}\n\n--- DOCUMENT TEXT ---\n{text}"

            # Call Gemini API
            response = self.model.generate_content(full_prompt)

            # Parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]  # Remove ```json
            if response_text.startswith('```'):
                response_text = response_text[3:]  # Remove ```
            if response_text.endswith('```'):
                response_text = response_text[:-3]  # Remove trailing ```

            response_text = response_text.strip()

            # Parse JSON
            result = json.loads(response_text)

            # Calculate overall confidence (combine OCR + API confidence)
            api_confidence = result.get('confidence', 0.9)  # Default 0.9 if not provided

            if ocr_confidence is not None:
                # Average OCR and API confidence
                overall_confidence = (ocr_confidence + api_confidence) / 2.0
            else:
                # Text-based document, use API confidence only
                overall_confidence = api_confidence

            ocr_conf_str = f"{ocr_confidence:.2%}" if ocr_confidence is not None else "N/A"
            logger.info(
                f"Successfully extracted fields from text "
                f"(API conf: {api_confidence:.2%}, OCR conf: {ocr_conf_str}, "
                f"Overall: {overall_confidence:.2%})"
            )

            return {
                "success": True,
                "document_type": result.get("document_type", "Unknown"),
                "confidence": overall_confidence,
                "extracted_data": result.get("extracted_data", []),
                "summary": result.get("summary", ""),
                "method": "gemini_text",
                "ocr_confidence": ocr_confidence,
                "api_confidence": api_confidence
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")

            return {
                "success": False,
                "error": "Failed to process document response",
                "raw_response": response_text[:500],
                "method": "gemini_text"
            }

        except Exception as e:
            logger.error(f"Gemini API error: {e}", exc_info=True)

            return {
                "success": False,
                "error": "Document processing service error",
                "method": "gemini_text"
            }

    def extract_fields_from_images(
        self,
        images: List[Image.Image],
        text_context: Optional[str] = None
    ) -> Dict[str, Any]:
        """Extract structured fields from images using Gemini Vision.

        Args:
            images: List of PIL Images (rendered PDF pages)
            text_context: Optional text context to include

        Returns:
            dict: Extracted fields in structured format
        """
        # Limit images to avoid API issues (Gemini Vision works best with 1-10 images)
        max_images = 10
        if len(images) > max_images:
            logger.warning(
                f"Document has {len(images)} pages. "
                f"Gemini Vision API works best with 1-{max_images} images. "
                f"Processing first {max_images} pages only. "
                f"For documents with many pages, OCR method is recommended."
            )
            images = images[:max_images]

        logger.info(f"Extracting fields from {len(images)} images using Gemini Vision")

        try:
            # Construct prompt
            prompt_parts = [FIELD_EXTRACTION_PROMPT]

            if text_context:
                prompt_parts.append(f"\n\n--- ADDITIONAL TEXT CONTEXT ---\n{text_context}")

            prompt_parts.append("\n\n--- DOCUMENT IMAGES ---")

            # Add images to prompt
            content_parts = ["\n".join(prompt_parts)]

            for i, img in enumerate(images):
                content_parts.append(img)

            # Call Gemini Vision API
            response = self.model.generate_content(content_parts)

            # Parse JSON response
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            # Parse JSON
            result = json.loads(response_text)

            # Extract confidence from API response
            api_confidence = result.get('confidence', 0.9)

            logger.info(
                f"Successfully extracted fields from images "
                f"(API conf: {api_confidence:.2%})"
            )

            return {
                "success": True,
                "document_type": result.get("document_type", "Unknown"),
                "confidence": api_confidence,
                "extracted_data": result.get("extracted_data", []),
                "summary": result.get("summary", ""),
                "method": "gemini_vision",
                "api_confidence": api_confidence
            }

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse Gemini response as JSON: {e}")
            logger.error(f"Response was: {response_text[:500]}")

            return {
                "success": False,
                "error": "Failed to process document response",
                "raw_response": response_text[:500],
                "method": "gemini_vision"
            }

        except Exception as e:
            logger.error(f"Gemini Vision API error: {e}", exc_info=True)

            return {
                "success": False,
                "error": "Document processing service error",
                "method": "gemini_vision"
            }

    def extract_with_schema(
        self,
        file_content: bytes,
        schema: List[Dict[str, Any]],
        document_type: str
    ) -> Dict[str, Any]:
        """Extract data from document using a predefined schema.

        This method is used for batch processing with custom templates.
        It extracts only the fields defined in the schema.

        Args:
            file_content: Document file bytes (image or PDF)
            schema: List of field definitions from custom template
            document_type: Expected document type

        Returns:
            dict: Extracted data matching schema fields

        Raises:
            Exception: If extraction fails
        """
        logger.info(f"Extracting {len(schema)} fields for document type: {document_type}")

        try:
            # Load image
            image = Image.open(io.BytesIO(file_content))

            # Build schema-based prompt
            field_list = []
            for field in schema:
                field_list.append(f"- {field['name']}: {field['label']} ({field['type']})")

            schema_prompt = f"""You are extracting data from a {document_type} document.

Extract ONLY the following fields from this document:

{chr(10).join(field_list)}

Return your response as a JSON object with field names as keys:
{{
    "field_name_1": "extracted value",
    "field_name_2": "extracted value",
    ...
}}

IMPORTANT:
- Return ONLY the JSON object, no markdown formatting
- Use exact field names from the list above
- If a field is not found in the document, use null
- Extract values exactly as they appear
- For dates, use ISO format (YYYY-MM-DD) if possible
- For numbers/currency, use numeric values without symbols
"""

            # Call Gemini Vision
            response = self.model.generate_content([schema_prompt, image])
            response_text = response.text.strip()

            # Remove markdown code blocks if present
            if response_text.startswith('```json'):
                response_text = response_text[7:]
            if response_text.startswith('```'):
                response_text = response_text[3:]
            if response_text.endswith('```'):
                response_text = response_text[:-3]

            response_text = response_text.strip()

            # Parse JSON
            result = json.loads(response_text)

            logger.info(f"Successfully extracted schema-based data: {len(result)} fields")

            return result

        except Exception as e:
            logger.error(f"Schema-based extraction failed: {str(e)}")
            raise Exception(f"Extraction failed: {str(e)}")


def get_gemini_service() -> GeminiService:
    """Get Gemini service instance.

    Returns:
        GeminiService instance
    """
    return GeminiService()

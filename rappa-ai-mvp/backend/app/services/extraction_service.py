"""Extraction Service - Wrapper for V1 Legacy Field Extraction.

This service wraps the V1 LLM-based field extraction and provides a clean
interface for extracting structured data from sales deed documents.
"""

import logging
from pathlib import Path
from typing import Optional, Dict, Any

from app.config import settings

logger = logging.getLogger(__name__)


class ExtractionService:
    """Field extraction service using V1 legacy LLM integration.

    This service provides:
    - LLM-based structured field extraction
    - Registration fee extraction (table detection + OCR)
    - Field validation and cleaning
    - Multiple LLM backend support (Gemini, Groq, Ollama)
    """

    def __init__(self):
        """Initialize extraction service."""
        self._llm_service = None
        self._registration_fee_extractor = None
        self._validation_service = None
        self._yolo_detector = None

        logger.info(f"Extraction Service initialized (LLM backend: {settings.LLM_BACKEND})")

    def _get_llm_service(self):
        """Lazy load LLM service from V1 legacy."""
        if self._llm_service is None:
            try:
                from v1_legacy.services.llm_service_factory import get_llm_service
                self._llm_service = get_llm_service()
                logger.info(f"LLM service loaded: {settings.LLM_BACKEND}")
            except ImportError as e:
                logger.error(f"Failed to import LLM service: {e}")
                raise RuntimeError(
                    "V1 LLM service not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._llm_service

    def _get_registration_fee_extractor(self):
        """Lazy load registration fee extractor."""
        if self._registration_fee_extractor is None:
            try:
                from v1_legacy.services.registration_fee_extractor import RegistrationFeeExtractor
                self._registration_fee_extractor = RegistrationFeeExtractor()
                logger.info("Registration fee extractor loaded")
            except ImportError as e:
                logger.error(f"Failed to import registration fee extractor: {e}")
                raise RuntimeError(
                    "Registration fee extractor not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._registration_fee_extractor

    def _get_validation_service(self):
        """Lazy load validation service."""
        if self._validation_service is None:
            try:
                from v1_legacy.services.validation_service import ValidationService
                self._validation_service = ValidationService()
                logger.info("Validation service loaded")
            except ImportError as e:
                logger.error(f"Failed to import validation service: {e}")
                raise RuntimeError(
                    "Validation service not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._validation_service

    def _get_yolo_detector(self):
        """Lazy load YOLO table detector."""
        if self._yolo_detector is None:
            try:
                from v1_legacy.services.yolo_detector import YOLOTableDetector
                self._yolo_detector = YOLOTableDetector()
                logger.info("YOLO table detector loaded")
            except ImportError as e:
                logger.error(f"Failed to import YOLO detector: {e}")
                raise RuntimeError(
                    "YOLO detector not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._yolo_detector

    def extract_registration_fee(
        self,
        pdf_path: str | Path,
        ocr_text: Optional[str] = None
    ) -> Optional[float]:
        """Extract registration fee from PDF using table detection.

        This uses the V1 multi-stage approach:
        1. Try pdfplumber extraction from tables
        2. If that fails, use YOLO to detect table and extract from image
        3. If that fails, use regex on OCR text

        Args:
            pdf_path: Path to the PDF file
            ocr_text: Optional OCR text to use as fallback

        Returns:
            Registration fee as float, or None if extraction failed
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        logger.info(f"Extracting registration fee from: {pdf_path.name}")

        try:
            extractor = self._get_registration_fee_extractor()

            # Try pdfplumber extraction first (fastest)
            fee = extractor.extract(str(pdf_path))

            if fee is not None:
                logger.info(f"Registration fee extracted (pdfplumber): {fee}")
                return fee

            # Fallback to OCR text extraction
            if ocr_text:
                fee = extractor.extract_from_ocr_text(ocr_text)
                if fee is not None:
                    logger.info(f"Registration fee extracted (OCR text): {fee}")
                    return fee

            logger.warning(f"Failed to extract registration fee from {pdf_path.name}")
            return None

        except Exception as e:
            logger.error(f"Registration fee extraction error: {str(e)}")
            return None

    def extract_fields_from_text(
        self,
        ocr_text: str,
        registration_fee: Optional[float] = None
    ) -> Dict[str, Any]:
        """Extract structured fields from OCR text using LLM.

        This uses the V1 LLM service with prompts optimized for
        Kannada sales deed documents.

        Args:
            ocr_text: Full OCR text from the document
            registration_fee: Pre-extracted registration fee (optional)

        Returns:
            Dictionary with extracted fields:
            - buyers: List[Dict] with buyer details
            - sellers: List[Dict] with seller details
            - property: Dict with property details
            - document: Dict with document metadata
        """
        logger.info("Extracting fields using LLM")

        try:
            llm_service = self._get_llm_service()

            # Get extraction prompt from V1
            from v1_legacy.utils.prompts import get_sale_deed_extraction_prompt
            system_prompt = get_sale_deed_extraction_prompt()

            # Build user message
            user_message = f"Extract all fields from this sales deed document:\n\n{ocr_text}"

            if registration_fee:
                user_message += f"\n\nNote: Registration fee is {registration_fee}"

            # Call LLM service
            response = llm_service.extract_structured_data(
                system_prompt=system_prompt,
                user_message=user_message
            )

            logger.info("Field extraction completed successfully")
            return response

        except Exception as e:
            logger.error(f"Field extraction error: {str(e)}")
            raise

    def validate_and_clean_fields(
        self,
        extracted_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Validate and clean extracted fields.

        This applies V1 validation rules:
        - Aadhaar: 12 digits
        - PAN: ABCDE1234F format
        - Pincode: 6 digits
        - Registration fee: >= MIN_REGISTRATION_FEE

        Args:
            extracted_data: Raw extracted data from LLM

        Returns:
            Cleaned and validated data with validation flags
        """
        logger.info("Validating and cleaning extracted fields")

        try:
            validation_service = self._get_validation_service()
            cleaned_data = validation_service.validate_and_clean_data(extracted_data)

            logger.info("Validation completed")
            return cleaned_data

        except Exception as e:
            logger.error(f"Validation error: {str(e)}")
            raise

    def process_document(
        self,
        pdf_path: str | Path,
        ocr_text: str
    ) -> Dict[str, Any]:
        """Complete end-to-end document processing.

        This orchestrates the full V1 pipeline:
        1. Extract registration fee
        2. Extract fields using LLM
        3. Validate and clean data

        Args:
            pdf_path: Path to the PDF file
            ocr_text: OCR text extracted from the document

        Returns:
            Dictionary with:
            - extracted_fields: Structured field data
            - registration_fee: Extracted fee
            - validation_status: Validation results
        """
        pdf_path = Path(pdf_path)
        logger.info(f"Processing document: {pdf_path.name}")

        try:
            # Step 1: Extract registration fee
            registration_fee = self.extract_registration_fee(pdf_path, ocr_text)

            # Step 2: Extract fields using LLM
            extracted_fields = self.extract_fields_from_text(ocr_text, registration_fee)

            # Step 3: Validate and clean
            validated_data = self.validate_and_clean_fields(extracted_fields)

            # Combine results
            result = {
                "extracted_fields": validated_data,
                "registration_fee": registration_fee,
                "validation_status": "completed",
                "document_name": pdf_path.name,
            }

            logger.info(f"Document processing completed: {pdf_path.name}")
            return result

        except Exception as e:
            logger.error(f"Document processing failed: {str(e)}")
            raise


# Global service instance
_extraction_service: Optional[ExtractionService] = None


def get_extraction_service() -> ExtractionService:
    """Get the global extraction service instance.

    This function provides dependency injection for FastAPI routes.

    Returns:
        ExtractionService: The global extraction service instance

    Example:
        @app.post("/extract")
        def extract_fields(
            file: UploadFile,
            extraction_service: ExtractionService = Depends(get_extraction_service)
        ):
            result = extraction_service.process_document(file.filename, ocr_text)
            return result
    """
    global _extraction_service
    if _extraction_service is None:
        _extraction_service = ExtractionService()
    return _extraction_service

"""Unified document processing service with smart PDF routing."""

import logging
from pathlib import Path
from typing import Dict, Any, List
from PIL import Image

from app.services.pdf_classifier import get_pdf_classifier, PDFType
from app.services.simple_ocr_service import get_simple_ocr_service
from app.services.gemini_service import get_gemini_service

logger = logging.getLogger(__name__)


class DocumentProcessor:
    """Unified document processor that routes PDFs to appropriate processing method."""

    def __init__(self):
        """Initialize document processor with all sub-services."""
        self.pdf_classifier = get_pdf_classifier()
        self.ocr_service = get_simple_ocr_service()
        self.gemini_service = get_gemini_service()
        logger.info("DocumentProcessor initialized")

    def process_document(self, pdf_path: Path) -> Dict[str, Any]:
        """Process document using appropriate method based on content type.

        Processing Strategy:
        1. TEXT_ONLY: Extract text directly, send to Gemini for field extraction
        2. IMAGE_LIGHT (<=2 images): Render PDF pages at 250 DPI, send to Gemini Vision
        3. IMAGE_HEAVY (>2 images): Use OCR (pytesseract) to extract text, then Gemini
        4. MIXED: Combine text + OCR from images, send to Gemini

        Args:
            pdf_path: Path to PDF file

        Returns:
            dict: Extracted fields and metadata
        """
        logger.info(f"Processing document: {pdf_path}")

        # Step 1: Classify PDF
        classification = self.pdf_classifier.classify_pdf(pdf_path)

        logger.info(f"PDF Type: {classification.pdf_type.value}")
        logger.info(f"Pages: {classification.page_count}, Images: {classification.image_count}")
        logger.info(f"Has Text: {classification.has_text}, Text Length: {classification.text_length}")

        # Step 2: Extract content based on type
        extracted_text = ""
        page_images = []
        ocr_confidence = None

        if classification.pdf_type == PDFType.TEXT_ONLY:
            # Direct text extraction
            logger.info("Processing as TEXT_ONLY: Using extracted text directly")
            extracted_text = classification.text_content

        elif classification.pdf_type == PDFType.IMAGE_LIGHT:
            # Render pages at 250 DPI for Gemini Vision
            logger.info("Processing as IMAGE_LIGHT: Rendering pages for Gemini Vision")
            page_images = self.pdf_classifier.render_all_pages_to_images(pdf_path, dpi=250)

            # Also include any text that exists
            if classification.has_text:
                extracted_text = classification.text_content

        elif classification.pdf_type == PDFType.IMAGE_HEAVY:
            # Use OCR on images
            logger.info("Processing as IMAGE_HEAVY: Using OCR on images")

            if classification.images:
                # OCR on extracted images with confidence
                extracted_text, ocr_confidence = self.ocr_service.extract_text_from_images(
                    classification.images,
                    languages=['eng', 'kan'],  # English + Kannada
                    psm=6  # PSM 6 for robust table detection
                )
            else:
                # Fallback: render pages and OCR
                page_images = self.pdf_classifier.render_all_pages_to_images(pdf_path, dpi=300)
                extracted_text, ocr_confidence = self.ocr_service.extract_text_from_images(
                    page_images,
                    languages=['eng', 'kan'],
                    psm=6
                )

        else:  # MIXED
            logger.info("Processing as MIXED: Combining text + OCR")

            # Start with existing text
            text_parts = []

            if classification.has_text:
                text_parts.append("=== Extracted Text ===")
                text_parts.append(classification.text_content)

            # Add OCR from images
            if classification.images:
                text_parts.append("\n=== OCR from Images ===")
                ocr_text, ocr_confidence = self.ocr_service.extract_text_from_images(
                    classification.images,
                    languages=['eng', 'kan'],
                    psm=6
                )
                text_parts.append(ocr_text)

            extracted_text = "\n\n".join(text_parts)

        # Step 3: Send to Gemini for field extraction
        logger.info(f"Sending to Gemini for field extraction (text_len={len(extracted_text)}, images={len(page_images)})")

        if page_images and classification.pdf_type == PDFType.IMAGE_LIGHT:
            # Use Gemini Vision API with images
            result = self.gemini_service.extract_fields_from_images(
                images=page_images,
                text_context=extracted_text if extracted_text else None
            )
        else:
            # Use Gemini with text only (pass OCR confidence if available)
            result = self.gemini_service.extract_fields_from_text(
                extracted_text,
                ocr_confidence=ocr_confidence
            )

        # Add metadata
        result['metadata'] = {
            'pdf_type': classification.pdf_type.value,
            'page_count': classification.page_count,
            'image_count': classification.image_count,
            'has_text': classification.has_text,
            'text_length': classification.text_length
        }

        logger.info(f"Document processing completed successfully")

        return result


def get_document_processor() -> DocumentProcessor:
    """Get DocumentProcessor instance.

    Returns:
        DocumentProcessor instance
    """
    return DocumentProcessor()

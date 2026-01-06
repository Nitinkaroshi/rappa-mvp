"""Simplified OCR service using pytesseract."""

import logging
from pathlib import Path
from typing import List, Tuple
from PIL import Image

try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

from app.config import settings

logger = logging.getLogger(__name__)


class SimpleOCRService:
    """Simple OCR service using pytesseract for image-to-text extraction."""

    def __init__(self):
        """Initialize OCR service."""
        if not PYTESSERACT_AVAILABLE:
            raise RuntimeError("pytesseract is not installed. Run: pip install pytesseract")

        # Set tesseract path if configured
        if settings.TESSERACT_CMD:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_CMD
            logger.info(f"Tesseract path set to: {settings.TESSERACT_CMD}")

        # Test if tesseract is available
        try:
            version = pytesseract.get_tesseract_version()
            logger.info(f"Tesseract OCR initialized successfully (version: {version})")
        except Exception as e:
            logger.warning(f"Tesseract not found or not configured: {e}")
            logger.warning("OCR will not be available. Install Tesseract or configure TESSERACT_PATH")

    def extract_text_from_image(
        self,
        image: Image.Image,
        languages: List[str] = None,
        psm: int = 6
    ) -> tuple[str, float]:
        """Extract text from a single image using OCR with confidence scoring.

        Args:
            image: PIL Image object
            languages: List of language codes (e.g., ['eng', 'kan'])
            psm: Page segmentation mode (default 6 = uniform block of text, good for tables)

        Returns:
            Tuple[str, float]: (extracted_text, confidence_score 0.0-1.0)
        """
        if not languages:
            languages = ['eng']  # Default to English

        lang_param = '+'.join(languages)
        config = f'--psm {psm}'

        try:
            # Use pytesseract to extract text with PSM mode
            text = pytesseract.image_to_string(image, lang=lang_param, config=config)

            # Get confidence data
            data = pytesseract.image_to_data(
                image,
                lang=lang_param,
                config=config,
                output_type=pytesseract.Output.DICT
            )

            # Calculate average confidence (filter out -1 which means no text detected)
            confidences = [float(conf) for conf in data['conf'] if conf != '-1']
            avg_confidence = sum(confidences) / len(confidences) if confidences else 0.0

            # Convert to 0.0-1.0 range
            confidence_score = avg_confidence / 100.0

            logger.info(
                f"Extracted {len(text)} characters from image using OCR "
                f"(confidence: {confidence_score:.2%})"
            )

            return text.strip(), confidence_score

        except Exception as e:
            logger.error(f"OCR failed: {e}")
            raise RuntimeError(f"OCR extraction failed: {str(e)}")

    def extract_text_from_images(
        self,
        images: List[Image.Image],
        languages: List[str] = None,
        psm: int = 6
    ) -> tuple[str, float]:
        """Extract text from multiple images with average confidence.

        Args:
            images: List of PIL Image objects
            languages: List of language codes
            psm: Page segmentation mode

        Returns:
            Tuple[str, float]: (combined_text, average_confidence)
        """
        all_text = []
        all_confidences = []

        for i, image in enumerate(images):
            logger.info(f"Processing image {i+1}/{len(images)}")
            text, confidence = self.extract_text_from_image(image, languages, psm)
            all_text.append(f"--- Page/Image {i+1} ---\n{text}")
            all_confidences.append(confidence)

        combined_text = "\n\n".join(all_text)
        avg_confidence = sum(all_confidences) / len(all_confidences) if all_confidences else 0.0

        logger.info(
            f"Total extracted text: {len(combined_text)} characters from {len(images)} images "
            f"(avg confidence: {avg_confidence:.2%})"
        )

        return combined_text, avg_confidence


def get_simple_ocr_service() -> SimpleOCRService:
    """Get SimpleOCR service instance.

    Returns:
        SimpleOCRService instance
    """
    return SimpleOCRService()

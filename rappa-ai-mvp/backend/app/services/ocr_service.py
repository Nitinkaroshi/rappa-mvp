"""OCR Service - Wrapper for V1 Legacy OCR Integration.

This service wraps the existing V1 OCR code and adapts it to the new
FastAPI structure. It provides a clean interface for document processing
while reusing the battle-tested V1 implementation.
"""

import logging
from pathlib import Path
from typing import Optional, Tuple, List
from PIL import Image

from app.config import settings

logger = logging.getLogger(__name__)


class OCRService:
    """OCR Service that wraps V1 legacy OCR implementation.

    This service provides:
    - PDF to image conversion (Poppler-based)
    - Image OCR using Tesseract (English + Kannada)
    - PyMuPDF embedded OCR (fallback for text-based PDFs)
    - Automatic mode selection based on configuration
    """

    def __init__(self):
        """Initialize OCR service with configuration from settings."""
        self.use_embedded_ocr = settings.USE_EMBEDDED_OCR
        self._v1_service = None
        self._pymupdf_reader = None

        # Lazy initialization - services will be created on first use
        logger.info(f"OCR Service initialized (mode: {'embedded' if self.use_embedded_ocr else 'tesseract'})")

    def _get_v1_service(self):
        """Lazy load V1 OCR service to avoid import errors if files not copied yet."""
        if self._v1_service is None:
            try:
                from v1_legacy.services.ocr_service import OCRService as V1OCRService
                self._v1_service = V1OCRService()
                logger.info("V1 OCR service loaded successfully")
            except ImportError as e:
                logger.error(f"Failed to import V1 OCR service: {e}")
                logger.error("Make sure you've copied V1 files using copy_v1_files.bat")
                raise RuntimeError(
                    "V1 OCR service not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._v1_service

    def _get_pymupdf_reader(self):
        """Lazy load PyMuPDF reader."""
        if self._pymupdf_reader is None:
            try:
                from v1_legacy.services.pymupdf_reader import PyMuPDFReader
                self._pymupdf_reader = PyMuPDFReader()
                logger.info("PyMuPDF reader loaded successfully")
            except ImportError as e:
                logger.error(f"Failed to import PyMuPDF reader: {e}")
                raise RuntimeError(
                    "PyMuPDF reader not available. "
                    "Run 'copy_v1_files.bat' to copy V1 legacy files."
                ) from e
        return self._pymupdf_reader

    def extract_text_from_pdf(
        self,
        pdf_path: str | Path,
        max_pages: Optional[int] = None,
        return_images: bool = False
    ) -> Tuple[str, Optional[List[Image.Image]]]:
        """Extract text from PDF using appropriate OCR method.

        This is the main entry point for PDF text extraction. It automatically
        selects between Tesseract OCR and embedded OCR based on configuration.

        Args:
            pdf_path: Path to the PDF file
            max_pages: Maximum number of pages to process (default from config)
            return_images: Whether to return the processed images

        Returns:
            Tuple of (extracted_text, images_list)
            - extracted_text: Full text with page markers
            - images_list: List of PIL images (None if return_images=False)

        Raises:
            RuntimeError: If V1 services are not available
            FileNotFoundError: If PDF file doesn't exist
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        logger.info(f"Extracting text from PDF: {pdf_path.name}")

        max_pages = max_pages or settings.MAX_OCR_PAGES

        try:
            if self.use_embedded_ocr:
                # Use PyMuPDF for embedded OCR
                reader = self._get_pymupdf_reader()
                text = reader.get_full_text(str(pdf_path), max_pages=max_pages)
                images = None  # PyMuPDF doesn't return images

                logger.info(f"Extracted {len(text)} characters using PyMuPDF")
                return text, images

            else:
                # Use Tesseract OCR
                service = self._get_v1_service()
                text, images = service.get_full_text(
                    str(pdf_path),
                    max_pages=max_pages,
                    return_images=return_images
                )

                logger.info(f"Extracted {len(text)} characters using Tesseract")
                return text, images if return_images else None

        except Exception as e:
            logger.error(f"OCR extraction failed for {pdf_path.name}: {str(e)}")
            raise

    def extract_text_from_image(
        self,
        image_path: str | Path
    ) -> str:
        """Extract text from a single image using Tesseract.

        Args:
            image_path: Path to the image file

        Returns:
            Extracted text from the image

        Raises:
            RuntimeError: If V1 services are not available
            FileNotFoundError: If image file doesn't exist
        """
        image_path = Path(image_path)

        if not image_path.exists():
            raise FileNotFoundError(f"Image file not found: {image_path}")

        logger.info(f"Extracting text from image: {image_path.name}")

        try:
            service = self._get_v1_service()
            text = service.ocr_image(str(image_path))

            logger.info(f"Extracted {len(text)} characters from image")
            return text

        except Exception as e:
            logger.error(f"Image OCR failed for {image_path.name}: {str(e)}")
            raise

    def pdf_to_images(
        self,
        pdf_path: str | Path,
        max_pages: Optional[int] = None
    ) -> List[Image.Image]:
        """Convert PDF to list of PIL images.

        Useful for preview generation or custom processing pipelines.

        Args:
            pdf_path: Path to the PDF file
            max_pages: Maximum number of pages to convert

        Returns:
            List of PIL Image objects

        Raises:
            RuntimeError: If V1 services are not available
            FileNotFoundError: If PDF file doesn't exist
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        logger.info(f"Converting PDF to images: {pdf_path.name}")

        max_pages = max_pages or settings.MAX_OCR_PAGES

        try:
            service = self._get_v1_service()
            images = service.pdf_to_images(str(pdf_path), max_pages=max_pages)

            logger.info(f"Converted {len(images)} pages to images")
            return images

        except Exception as e:
            logger.error(f"PDF to images conversion failed for {pdf_path.name}: {str(e)}")
            raise

    def get_page_count(self, pdf_path: str | Path) -> int:
        """Get the number of pages in a PDF.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            Number of pages in the PDF

        Raises:
            FileNotFoundError: If PDF file doesn't exist
        """
        pdf_path = Path(pdf_path)

        if not pdf_path.exists():
            raise FileNotFoundError(f"PDF file not found: {pdf_path}")

        try:
            # Use PyMuPDF for page counting (faster than Poppler)
            import fitz  # PyMuPDF
            doc = fitz.open(str(pdf_path))
            page_count = len(doc)
            doc.close()
            return page_count

        except Exception as e:
            logger.error(f"Failed to get page count for {pdf_path.name}: {str(e)}")
            # Fallback: try with pdf2image
            try:
                from pdf2image import pdfinfo_from_path
                info = pdfinfo_from_path(
                    str(pdf_path),
                    poppler_path=settings.POPPLER_PATH
                )
                return info.get("Pages", 0)
            except Exception:
                raise RuntimeError(f"Could not determine page count: {str(e)}") from e


# Global service instance
_ocr_service: Optional[OCRService] = None


def get_ocr_service() -> OCRService:
    """Get the global OCR service instance.

    This function provides dependency injection for FastAPI routes.

    Returns:
        OCRService: The global OCR service instance

    Example:
        @app.post("/process")
        def process_document(
            file: UploadFile,
            ocr_service: OCRService = Depends(get_ocr_service)
        ):
            text, _ = ocr_service.extract_text_from_pdf(file.filename)
            return {"text": text}
    """
    global _ocr_service
    if _ocr_service is None:
        _ocr_service = OCRService()
    return _ocr_service

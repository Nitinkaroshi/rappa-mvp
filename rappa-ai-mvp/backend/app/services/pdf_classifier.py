"""PDF classification service to determine processing strategy."""

import logging
from pathlib import Path
from typing import Tuple, List
from dataclasses import dataclass
from enum import Enum

import fitz  # PyMuPDF
from PIL import Image
import io

logger = logging.getLogger(__name__)


class PDFType(str, Enum):
    """PDF content type classification."""
    TEXT_ONLY = "text_only"  # PDF with extractable text, no images
    IMAGE_HEAVY = "image_heavy"  # PDF with >2 images
    IMAGE_LIGHT = "image_light"  # PDF with <=2 images
    MIXED = "mixed"  # PDF with both text and images


@dataclass
class PDFClassification:
    """Result of PDF classification."""
    pdf_type: PDFType
    page_count: int
    image_count: int
    has_text: bool
    text_length: int
    images: List[Image.Image]  # PIL Images extracted from PDF
    text_content: str  # Extracted text if available


class PDFClassifier:
    """Classifier to analyze PDF content and determine processing strategy."""

    def __init__(
        self,
        image_threshold: int = 2,
        min_image_width: int = 200,
        min_image_height: int = 200,
        min_image_area: int = 40000  # 200x200 minimum
    ):
        """Initialize PDF classifier.

        Args:
            image_threshold: Number of images to differentiate light vs heavy
            min_image_width: Minimum width to consider as real image (filter logos)
            min_image_height: Minimum height to consider as real image (filter logos)
            min_image_area: Minimum area (width * height) to consider as real image
        """
        self.image_threshold = image_threshold
        self.min_image_width = min_image_width
        self.min_image_height = min_image_height
        self.min_image_area = min_image_area
        logger.info(
            f"PDFClassifier initialized (threshold={image_threshold}, "
            f"min_size={min_image_width}x{min_image_height})"
        )

    def classify_pdf(self, pdf_path: Path) -> PDFClassification:
        """Classify PDF content type and extract relevant data.

        Args:
            pdf_path: Path to PDF file

        Returns:
            PDFClassification with detected type and extracted content
        """
        logger.info(f"Classifying PDF: {pdf_path}")

        doc = fitz.open(pdf_path)
        page_count = len(doc)

        # Extract all text
        text_content = ""
        for page in doc:
            text_content += page.get_text()

        has_text = len(text_content.strip()) > 50  # At least 50 chars of meaningful text
        text_length = len(text_content.strip())

        # Extract all images (filter out logos/icons)
        images = []
        real_image_count = 0
        total_images_found = 0

        for page_num in range(len(doc)):
            page = doc[page_num]
            image_list = page.get_images()
            total_images_found += len(image_list)

            # Extract actual image data
            for img_index, img in enumerate(image_list):
                try:
                    xref = img[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]

                    # Convert to PIL Image
                    pil_image = Image.open(io.BytesIO(image_bytes))

                    # Get image dimensions
                    width, height = pil_image.size
                    area = width * height

                    # Filter out small images (logos, icons)
                    if (width >= self.min_image_width and
                        height >= self.min_image_height and
                        area >= self.min_image_area):

                        # Convert to RGB if needed
                        if pil_image.mode != 'RGB':
                            pil_image = pil_image.convert('RGB')

                        images.append(pil_image)
                        real_image_count += 1
                        logger.debug(f"Image {img_index} on page {page_num}: {width}x{height} (kept)")
                    else:
                        logger.debug(f"Image {img_index} on page {page_num}: {width}x{height} (filtered as logo/icon)")

                except Exception as e:
                    logger.warning(f"Failed to extract image {img_index} from page {page_num}: {e}")

        doc.close()

        logger.info(f"Found {total_images_found} total images, {real_image_count} real images (filtered {total_images_found - real_image_count} logos/icons)")
        image_count = real_image_count

        # Classify PDF type
        logger.info(f"Classification: images={image_count}, has_text={has_text}, text_len={text_length}, threshold={self.image_threshold}")

        if image_count == 0 and has_text:
            pdf_type = PDFType.TEXT_ONLY
            logger.info("→ Classified as TEXT_ONLY (no images)")
        elif image_count > self.image_threshold and not has_text:
            pdf_type = PDFType.IMAGE_HEAVY
            logger.info("→ Classified as IMAGE_HEAVY (many images, no text)")
        elif image_count <= self.image_threshold and not has_text and page_count <= 5:
            # Only use Vision API for small documents (≤5 pages)
            # This prevents merged invoices from using Vision API
            pdf_type = PDFType.IMAGE_LIGHT
            logger.info("→ Classified as IMAGE_LIGHT (few images, no text, ≤5 pages)")
        elif image_count <= self.image_threshold and not has_text and page_count > 5:
            # Document has too many pages for Vision API, use OCR instead
            pdf_type = PDFType.IMAGE_HEAVY
            logger.info("→ Classified as IMAGE_HEAVY (few images but >5 pages, using OCR)")
        else:
            # Has both text and images - decide based on text content
            logger.info(f"Has both text+images, checking text_length {text_length} > 500")
            if has_text and text_length > 500:
                # Substantial text content - treat as TEXT_ONLY
                # Images are likely just logos/signatures/decorative
                pdf_type = PDFType.TEXT_ONLY
                logger.info("→ Classified as TEXT_ONLY (substantial text >500 chars)")
            elif image_count <= self.image_threshold and page_count <= 5:
                # Limited text with few images and ≤5 pages - use Gemini Vision
                pdf_type = PDFType.IMAGE_LIGHT
                logger.info("→ Classified as IMAGE_LIGHT (limited text with few images, ≤5 pages)")
            elif image_count <= self.image_threshold and page_count > 5:
                # Limited text with few images but >5 pages - use OCR
                pdf_type = PDFType.IMAGE_HEAVY
                logger.info("→ Classified as IMAGE_HEAVY (limited text, few images, >5 pages)")
            else:
                # Limited text with many images - use OCR
                pdf_type = PDFType.MIXED
                logger.info("→ Classified as MIXED (limited text with many images)")

        classification = PDFClassification(
            pdf_type=pdf_type,
            page_count=page_count,
            image_count=image_count,
            has_text=has_text,
            text_length=text_length,
            images=images,
            text_content=text_content
        )

        logger.info(
            f"PDF classified: type={pdf_type.value}, "
            f"pages={page_count}, images={image_count}, "
            f"has_text={has_text}, text_len={text_length}"
        )

        return classification

    def render_page_to_image(self, pdf_path: Path, page_num: int = 0, dpi: int = 250) -> Image.Image:
        """Render a PDF page to high-resolution image for Gemini Vision API.

        Args:
            pdf_path: Path to PDF file
            page_num: Page number to render (0-indexed)
            dpi: Resolution for rendering (default 250 for good quality)

        Returns:
            PIL Image of the rendered page
        """
        doc = fitz.open(pdf_path)
        page = doc[page_num]

        # Calculate zoom factor for desired DPI
        # PyMuPDF default is 72 DPI
        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)

        # Render page to pixmap
        pix = page.get_pixmap(matrix=mat)

        # Convert to PIL Image
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        doc.close()

        logger.info(f"Rendered page {page_num} at {dpi} DPI: {img.width}x{img.height}")

        return img

    def render_all_pages_to_images(self, pdf_path: Path, dpi: int = 250) -> List[Image.Image]:
        """Render all PDF pages to high-resolution images.

        Args:
            pdf_path: Path to PDF file
            dpi: Resolution for rendering

        Returns:
            List of PIL Images, one per page
        """
        doc = fitz.open(pdf_path)
        images = []

        zoom = dpi / 72.0
        mat = fitz.Matrix(zoom, zoom)

        for page_num in range(len(doc)):
            page = doc[page_num]
            pix = page.get_pixmap(matrix=mat)
            img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)
            images.append(img)

        doc.close()

        logger.info(f"Rendered {len(images)} pages at {dpi} DPI")

        return images


def process_tiff_to_images(tiff_path: Path) -> List[Image.Image]:
    """Process TIFF file (single or multi-page) into list of PIL Images.

    Args:
        tiff_path: Path to TIFF file

    Returns:
        List[Image.Image]: List of pages as PIL Images

    Raises:
        ValueError: If file is not a valid TIFF
    """
    logger.info(f"Processing TIFF file: {tiff_path}")

    try:
        img = Image.open(tiff_path)
        pages = []

        # Handle multi-page TIFF
        try:
            page_num = 0
            while True:
                img.seek(page_num)

                # Convert to RGB if needed (TIFF can be CMYK, grayscale, etc.)
                if img.mode not in ('RGB', 'L'):
                    page_img = img.convert('RGB')
                else:
                    page_img = img.copy()

                pages.append(page_img)
                logger.debug(f"Extracted TIFF page {page_num}: {page_img.width}x{page_img.height}, mode={img.mode}")

                page_num += 1
        except EOFError:
            # End of frames
            pass

        if not pages:
            raise ValueError("No valid pages found in TIFF file")

        logger.info(f"Extracted {len(pages)} page(s) from TIFF file")
        return pages

    except Exception as e:
        logger.error(f"Error processing TIFF file: {e}")
        raise ValueError(f"Invalid TIFF file: {str(e)}")


def process_image_file(image_path: Path) -> List[Image.Image]:
    """Process single image file (JPG, PNG) into list with one PIL Image.

    Args:
        image_path: Path to image file

    Returns:
        List[Image.Image]: List with single PIL Image

    Raises:
        ValueError: If file is not a valid image
    """
    logger.info(f"Processing image file: {image_path}")

    try:
        img = Image.open(image_path)

        # Convert to RGB if needed
        if img.mode not in ('RGB', 'L'):
            img = img.convert('RGB')

        logger.info(f"Loaded image: {img.width}x{img.height}, mode={img.mode}")
        return [img]

    except Exception as e:
        logger.error(f"Error processing image file: {e}")
        raise ValueError(f"Invalid image file: {str(e)}")


def get_pdf_classifier() -> PDFClassifier:
    """Get PDF classifier instance.

    Returns:
        PDFClassifier instance
    """
    return PDFClassifier(image_threshold=2)

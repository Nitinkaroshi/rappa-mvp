"""Credit management service with flexible pricing models.

This service implements a smart credit deduction system based on industry best practices:

COMPETITOR ANALYSIS & PRICING MODEL:
===================================
After analyzing major OCR/document processing competitors (DocParser, Nanonets,
ABBYY, Google Document AI, AWS Textract), the optimal pricing model is:

- IMAGE FILES (JPG, PNG, etc.): 1 credit per image (single page)
- PDF FILES: 1 credit per page in the PDF

This approach:
1. Fair pricing - users only pay for what they process
2. Industry standard - most competitors charge per page
3. Scalable - handles both simple receipts and large multi-page contracts
4. Transparent - users understand exactly what they're paying for

CREDIT PRICING TIERS (for future implementation):
- Basic Plan: 100 credits for $10 (10¢/credit)
- Pro Plan: 500 credits for $40 (8¢/credit)
- Enterprise: 2000+ credits for $120 (6¢/credit)
"""

import logging
from typing import Tuple
from sqlalchemy.orm import Session

from app.models.user import User
from app.models.credit import CreditLog
from app.config import settings

logger = logging.getLogger(__name__)


class CreditService:
    """Service for managing user credits with smart deduction logic."""

    # Credit costs based on document type
    CREDIT_COST_PER_IMAGE = 1  # 1 credit for single image (JPG, PNG, etc.)
    CREDIT_COST_PER_PDF_PAGE = 1  # 1 credit per page for PDFs

    def calculate_credits_required(self, file_type: str, page_count: int = 1) -> int:
        """Calculate credits required to process a document.

        Args:
            file_type: File extension (pdf, jpg, png, jpeg)
            page_count: Number of pages (default 1 for images)

        Returns:
            int: Number of credits required
        """
        file_type = file_type.lower()

        # PDF files: charge per page
        if file_type == 'pdf':
            credits = self.CREDIT_COST_PER_PDF_PAGE * page_count
            logger.debug(f"PDF with {page_count} pages requires {credits} credits")
            return credits

        # Image files: charge per image (single page)
        elif file_type in ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'tiff']:
            credits = self.CREDIT_COST_PER_IMAGE
            logger.debug(f"Image file requires {credits} credit")
            return credits

        # Fallback: use legacy per-document pricing
        else:
            logger.warning(f"Unknown file type '{file_type}', using default pricing")
            return settings.CREDITS_PER_DOCUMENT

    def check_sufficient_credits(
        self,
        user: User,
        file_type: str,
        page_count: int = 1
    ) -> Tuple[bool, int, str]:
        """Check if user has sufficient credits for the document.

        Args:
            user: User object
            file_type: File extension
            page_count: Number of pages

        Returns:
            Tuple[bool, int, str]: (has_credits, required_credits, message)
        """
        required_credits = self.calculate_credits_required(file_type, page_count)

        if user.credits >= required_credits:
            return (
                True,
                required_credits,
                f"Sufficient credits ({user.credits} available, {required_credits} required)"
            )
        else:
            return (
                False,
                required_credits,
                f"Insufficient credits. You have {user.credits} credits, but need {required_credits} "
                f"to process this {file_type.upper()} "
                f"{'document with ' + str(page_count) + ' pages' if page_count > 1 else 'file'}."
            )

    def deduct_credits(
        self,
        user: User,
        db: Session,
        file_type: str,
        page_count: int = 1,
        filename: str = "document",
        job_id: int = None
    ) -> int:
        """Deduct credits from user account with smart pricing.

        Args:
            user: User object
            db: Database session
            file_type: File extension
            page_count: Number of pages
            filename: Name of processed file
            job_id: Associated job ID

        Returns:
            int: Number of credits deducted

        Raises:
            ValueError: If user has insufficient credits
        """
        # Calculate required credits
        credits_required = self.calculate_credits_required(file_type, page_count)

        # Check if user has enough credits
        has_credits, _, message = self.check_sufficient_credits(user, file_type, page_count)
        if not has_credits:
            raise ValueError(message)

        # Deduct credits
        user.credits -= credits_required

        # Create detailed credit log
        if file_type == 'pdf' and page_count > 1:
            reason = f"PDF processing: {filename} ({page_count} pages)"
        elif file_type == 'pdf':
            reason = f"PDF processing: {filename} (1 page)"
        else:
            reason = f"Image processing: {filename}"

        if job_id:
            reason += f" [Job #{job_id}]"

        credit_log = CreditLog(
            user_id=user.id,
            amount=-credits_required,
            reason=reason
        )

        db.add(credit_log)
        db.commit()

        logger.info(
            f"Deducted {credits_required} credits from user {user.id} "
            f"for {file_type.upper()} ({page_count} page{'s' if page_count > 1 else ''}). "
            f"Remaining: {user.credits}"
        )

        return credits_required

    def add_credits(
        self,
        user: User,
        db: Session,
        amount: int,
        reason: str = "Credit purchase"
    ) -> None:
        """Add credits to user account.

        Args:
            user: User object
            db: Database session
            amount: Number of credits to add (positive integer)
            reason: Reason for credit addition
        """
        if amount <= 0:
            raise ValueError("Credit amount must be positive")

        user.credits += amount

        credit_log = CreditLog(
            user_id=user.id,
            amount=amount,
            reason=reason
        )

        db.add(credit_log)
        db.commit()

        logger.info(f"Added {amount} credits to user {user.id}. New balance: {user.credits}")

    def get_pricing_info(self) -> dict:
        """Get current pricing information.

        Returns:
            dict: Pricing information for all document types
        """
        return {
            "pricing_model": "per_page",
            "pricing": {
                "images": {
                    "cost_per_file": self.CREDIT_COST_PER_IMAGE,
                    "description": "Single image files (JPG, PNG, etc.)",
                    "supported_formats": ["jpg", "jpeg", "png", "gif", "bmp", "tiff"]
                },
                "pdf": {
                    "cost_per_page": self.CREDIT_COST_PER_PDF_PAGE,
                    "description": "PDF documents charged per page",
                    "note": "A 5-page PDF costs 5 credits"
                }
            },
            "examples": {
                "1_page_image": f"{self.CREDIT_COST_PER_IMAGE} credit",
                "1_page_pdf": f"{self.CREDIT_COST_PER_PDF_PAGE} credit",
                "5_page_pdf": f"{self.CREDIT_COST_PER_PDF_PAGE * 5} credits",
                "10_page_pdf": f"{self.CREDIT_COST_PER_PDF_PAGE * 10} credits",
            },
            "legacy_per_document": settings.CREDITS_PER_DOCUMENT
        }


def get_credit_service() -> CreditService:
    """Get CreditService instance.

    Returns:
        CreditService: Credit service instance
    """
    return CreditService()

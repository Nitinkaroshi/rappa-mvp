"""Contact form API endpoints."""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr, Field

from app.core.database import get_db
from app.models.contact import Contact

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/contact", tags=["contact"])


class ContactSubmission(BaseModel):
    """Contact form submission schema."""

    name: str = Field(..., min_length=2, max_length=255, description="Full name")
    email: EmailStr = Field(..., description="Email address")
    phone: str | None = Field(None, max_length=50, description="Phone number (optional)")
    company: str | None = Field(None, max_length=255, description="Company name (optional)")
    subject: str | None = Field(None, max_length=500, description="Subject (optional)")
    message: str = Field(..., min_length=10, max_length=5000, description="Message")


@router.post("/submit", status_code=status.HTTP_201_CREATED)
def submit_contact_form(
    submission: ContactSubmission,
    db: Session = Depends(get_db)
):
    """Submit contact form.

    Args:
        submission: Contact form data
        db: Database session

    Returns:
        Success message
    """
    try:
        # Create contact record
        contact = Contact(
            name=submission.name,
            email=submission.email,
            phone=submission.phone,
            company=submission.company,
            subject=submission.subject,
            message=submission.message,
            is_read=False,
            is_replied=False
        )

        db.add(contact)
        db.commit()
        db.refresh(contact)

        logger.info(f"Contact form submitted: {submission.email}")

        return {
            "success": True,
            "message": "Thank you for contacting us! We'll get back to you soon.",
            "contact_id": contact.id
        }

    except Exception as e:
        logger.error(f"Error submitting contact form: {e}", exc_info=True)
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit contact form. Please try again later."
        )

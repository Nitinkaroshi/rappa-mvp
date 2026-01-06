"""Support ticket API endpoints."""

import logging
import io
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, Field

from app.core.database import get_db
from app.core.auth import get_current_active_user
from app.models.user import User
from app.models.ticket import Ticket, TicketStatus, TicketPriority, TicketType
from app.services.storage_service import get_storage_service, StorageService
from app.services.email_service import get_email_service, EmailService
from app.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ============================================================================
# Pydantic Schemas
# ============================================================================

class TicketCreate(BaseModel):
    """Schema for creating a new ticket."""
    ticket_type: TicketType
    subject: str = Field(..., min_length=5, max_length=200)
    description: str = Field(..., min_length=10)
    priority: TicketPriority = TicketPriority.MEDIUM
    logs: Optional[dict] = None


class TicketUpdate(BaseModel):
    """Schema for updating a ticket (admin only for now)."""
    status: Optional[TicketStatus] = None
    priority: Optional[TicketPriority] = None
    admin_notes: Optional[str] = None


class TicketResponse(BaseModel):
    """Response schema for ticket."""
    id: int
    user_id: int
    ticket_type: str
    subject: str
    description: str
    status: str
    priority: str
    attached_file_path: Optional[str] = None
    logs: Optional[dict] = None
    admin_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None

    class Config:
        from_attributes = True


# ============================================================================
# Ticket Endpoints
# ============================================================================

@router.post("/", response_model=TicketResponse, status_code=status.HTTP_201_CREATED)
async def create_ticket(
    ticket_type: str = Form(...),
    subject: str = Form(...),
    description: str = Form(...),
    priority: str = Form(TicketPriority.MEDIUM.value),
    logs: Optional[str] = Form(None),
    file: Optional[UploadFile] = File(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
    storage: StorageService = Depends(get_storage_service),
    email_service: EmailService = Depends(get_email_service)
):
    """Create a new support ticket.

    Users can submit tickets with:
    - ticket_type: Type of issue (bug, feature_request, help, billing, other)
    - subject: Short subject line
    - description: Detailed description
    - priority: Priority level (defaults to MEDIUM)
    - logs: Optional JSON logs data (browser info, errors, etc.)
    - file: Optional file attachment (screenshot, document, etc.)

    Args:
        ticket_type: Type of ticket
        subject: Subject line
        description: Detailed description
        priority: Priority level
        logs: Optional logs JSON string
        file: Optional file attachment
        current_user: Authenticated user
        db: Database session
        storage: Storage service

    Returns:
        TicketResponse: Created ticket

    Raises:
        HTTPException 400: If validation fails
    """
    # Validate ticket type
    try:
        ticket_type_enum = TicketType(ticket_type)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid ticket type. Must be one of: {', '.join([t.value for t in TicketType])}"
        )

    # Validate priority
    try:
        priority_enum = TicketPriority(priority)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid priority. Must be one of: {', '.join([p.value for p in TicketPriority])}"
        )

    # Validate subject and description lengths
    if len(subject) < 5 or len(subject) > 200:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Subject must be between 5 and 200 characters"
        )

    if len(description) < 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Description must be at least 10 characters"
        )

    # Parse logs if provided
    logs_dict = None
    if logs:
        import json
        try:
            logs_dict = json.loads(logs)
        except json.JSONDecodeError:
            logger.warning(f"Failed to parse logs JSON: {logs}")

    # Upload file if provided
    attached_file_path = None
    if file and file.filename:
        try:
            # Read file content
            file_content = await file.read()

            # Upload to S3 in tickets folder
            attached_file_path = storage.upload_file(
                file_obj=io.BytesIO(file_content),
                filename=f"ticket_{datetime.utcnow().timestamp()}_{file.filename}",
                user_id=current_user.id,
                content_type=file.content_type,
                folder="tickets"
            )
            logger.info(f"Uploaded ticket attachment to {attached_file_path}")
        except Exception as e:
            logger.error(f"Failed to upload ticket attachment: {str(e)}")
            # Continue without attachment rather than failing

    # Create ticket
    ticket = Ticket(
        user_id=current_user.id,
        ticket_type=ticket_type_enum,
        subject=subject,
        description=description,
        status=TicketStatus.OPEN,
        priority=priority_enum,
        attached_file_path=attached_file_path,
        logs=logs_dict
    )

    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    logger.info(f"Created ticket {ticket.id} for user {current_user.id}: {subject}")

    # Send email notification to admins (non-blocking - don't fail if email fails)
    try:
        email_service.send_support_ticket_notification(
            admin_emails=settings.SUPPORT_ADMIN_EMAILS,
            ticket_id=ticket.id,
            user_email=current_user.email,
            ticket_type=ticket_type,
            subject=subject,
            description=description,
            priority=priority,
            has_attachment=attached_file_path is not None
        )
        logger.info(f"Email notification sent for ticket {ticket.id}")
    except Exception as e:
        # Log error but don't fail the request
        logger.error(f"Failed to send email notification for ticket {ticket.id}: {str(e)}")

    return ticket


@router.get("/", response_model=List[TicketResponse])
def get_user_tickets(
    status_filter: Optional[TicketStatus] = None,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all tickets for the current user.

    Args:
        status_filter: Optional status filter (open, in_progress, resolved, closed)
        current_user: Authenticated user
        db: Database session

    Returns:
        List[TicketResponse]: List of user's tickets
    """
    query = db.query(Ticket).filter(Ticket.user_id == current_user.id)

    if status_filter:
        query = query.filter(Ticket.status == status_filter)

    tickets = query.order_by(Ticket.created_at.desc()).all()

    return tickets


@router.get("/{ticket_id}", response_model=TicketResponse)
def get_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific ticket by ID.

    Args:
        ticket_id: Ticket ID
        current_user: Authenticated user
        db: Database session

    Returns:
        TicketResponse: Ticket details

    Raises:
        HTTPException 404: If ticket not found
        HTTPException 403: If ticket doesn't belong to user
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # Check ownership
    if ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to access this ticket"
        )

    return ticket


@router.patch("/{ticket_id}", response_model=TicketResponse)
def update_ticket(
    ticket_id: int,
    ticket_update: TicketUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update a ticket (currently limited to user's own tickets).

    Args:
        ticket_id: Ticket ID
        ticket_update: Fields to update
        current_user: Authenticated user
        db: Database session

    Returns:
        TicketResponse: Updated ticket

    Raises:
        HTTPException 404: If ticket not found
        HTTPException 403: If ticket doesn't belong to user
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # Check ownership
    if ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to update this ticket"
        )

    # Update fields
    update_data = ticket_update.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(ticket, field, value)

    # Set resolved_at timestamp if status changed to resolved
    if ticket_update.status == TicketStatus.RESOLVED and ticket.resolved_at is None:
        ticket.resolved_at = datetime.utcnow()

    db.commit()
    db.refresh(ticket)

    logger.info(f"Updated ticket {ticket_id} by user {current_user.id}")

    return ticket


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ticket(
    ticket_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Delete a ticket.

    Args:
        ticket_id: Ticket ID
        current_user: Authenticated user
        db: Database session

    Raises:
        HTTPException 404: If ticket not found
        HTTPException 403: If ticket doesn't belong to user
    """
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Ticket not found"
        )

    # Check ownership
    if ticket.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to delete this ticket"
        )

    db.delete(ticket)
    db.commit()

    logger.info(f"Deleted ticket {ticket_id} by user {current_user.id}")

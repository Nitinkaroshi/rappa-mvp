"""Dashboard API endpoints for user statistics and overview."""

import logging
from typing import Dict, Any
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.credit import CreditLog  # Import first to resolve relationships
from app.models.field import ExtractedField
from app.models.job import Job, JobStatus
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats", response_model=Dict[str, Any])
def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for current user.

    Returns overview statistics including:
    - Total jobs count
    - Completed jobs count
    - Failed jobs count
    - Processing jobs count
    - Credits remaining
    - Recent activity

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        dict: Dashboard statistics
    """
    # Count jobs by status
    total_jobs = db.query(Job).filter(Job.user_id == current_user.id).count()

    completed_jobs = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.status == JobStatus.COMPLETED
    ).count()

    failed_jobs = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.status == JobStatus.FAILED
    ).count()

    processing_jobs = db.query(Job).filter(
        Job.user_id == current_user.id,
        Job.status.in_([JobStatus.PENDING, JobStatus.PROCESSING])
    ).count()

    # Get recent jobs (last 5)
    recent_jobs = db.query(Job).filter(
        Job.user_id == current_user.id
    ).order_by(Job.created_at.desc()).limit(5).all()

    recent_jobs_data = [
        {
            "id": job.id,
            "filename": job.filename,
            "status": job.status.value if hasattr(job.status, 'value') else str(job.status),
            "template_id": job.template_id,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None
        }
        for job in recent_jobs
    ]

    # Calculate success rate
    success_rate = (completed_jobs / total_jobs * 100) if total_jobs > 0 else 0

    logger.info(f"Dashboard stats retrieved for user {current_user.id}")

    return {
        "user": {
            "email": current_user.email,
            "credits": current_user.credits,
            "is_verified": current_user.is_verified,
            "created_at": current_user.created_at.isoformat() if current_user.created_at else None
        },
        "jobs": {
            "total": total_jobs,
            "completed": completed_jobs,
            "failed": failed_jobs,
            "processing": processing_jobs,
            "success_rate": round(success_rate, 2)
        },
        "recent_jobs": recent_jobs_data,
        "credits_remaining": current_user.credits
    }


@router.get("/activity", response_model=Dict[str, Any])
def get_user_activity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    limit: int = 10
):
    """Get recent user activity.

    Args:
        current_user: Authenticated user
        db: Database session
        limit: Maximum number of activities to return

    Returns:
        dict: User activity data
    """
    # Get recent jobs with more details
    recent_jobs = db.query(Job).filter(
        Job.user_id == current_user.id
    ).order_by(Job.created_at.desc()).limit(limit).all()

    activities = []
    for job in recent_jobs:
        activity = {
            "id": job.id,
            "type": "document_upload",
            "filename": job.filename,
            "status": job.status.value if hasattr(job.status, 'value') else str(job.status),
            "template_id": job.template_id,
            "created_at": job.created_at.isoformat() if job.created_at else None,
            "completed_at": job.completed_at.isoformat() if job.completed_at else None
        }

        # Add processing time if available
        if job.completed_at and job.created_at:
            processing_time = (job.completed_at - job.created_at).total_seconds()
            activity["processing_time_seconds"] = round(processing_time, 2)

        activities.append(activity)

    logger.info(f"Retrieved {len(activities)} recent activities for user {current_user.id}")

    return {
        "activities": activities,
        "total_count": len(activities)
    }


@router.get("/summary", response_model=Dict[str, Any])
def get_usage_summary(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get usage summary with template breakdown.

    Args:
        current_user: Authenticated user
        db: Database session

    Returns:
        dict: Usage summary by template
    """
    # Get template usage statistics
    template_stats = db.query(
        Job.template_id,
        func.count(Job.id).label('count'),
        func.count(func.nullif(Job.status == JobStatus.COMPLETED, False)).label('completed')
    ).filter(
        Job.user_id == current_user.id
    ).group_by(Job.template_id).all()

    templates_used = []
    for stat in template_stats:
        template_id = stat.template_id or "unknown"
        templates_used.append({
            "template_id": template_id,
            "total_jobs": stat.count,
            "completed_jobs": stat.completed or 0
        })

    logger.info(f"Usage summary retrieved for user {current_user.id}")

    return {
        "total_documents_processed": db.query(Job).filter(
            Job.user_id == current_user.id,
            Job.status == JobStatus.COMPLETED
        ).count(),
        "templates_used": templates_used,
        "credits_used": 10 - current_user.credits,  # Assuming default is 10
        "credits_remaining": current_user.credits
    }

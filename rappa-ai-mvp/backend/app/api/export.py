"""Export API endpoints for downloading extracted data in various formats."""

import logging
import json
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.models.job import Job
from app.services.export_service import get_export_service, ExportService

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/job/{job_id}/csv")
def export_csv(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export job results as CSV file.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: CSV file download

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        csv_content = export_service.export_to_csv(job_id, db)

        logger.info(f"CSV export for job {job_id} by user {current_user.id}")

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=results_{job_id}_{job.filename}.csv"
            }
        )
    except Exception as e:
        logger.error(f"CSV export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/job/{job_id}/json")
def export_json(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service),
    include_metadata: bool = True
):
    """Export job results as JSON file.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance
        include_metadata: Include document metadata in export

    Returns:
        Response: JSON file download

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        json_data = export_service.export_to_json(job_id, db, include_metadata)
        json_content = json.dumps(json_data, indent=2, ensure_ascii=False)

        logger.info(f"JSON export for job {job_id} by user {current_user.id}")

        return Response(
            content=json_content,
            media_type="application/json",
            headers={
                "Content-Disposition": f"attachment; filename=results_{job_id}_{job.filename}.json"
            }
        )
    except Exception as e:
        logger.error(f"JSON export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/job/{job_id}/excel")
def export_excel(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export job results as Excel (XLSX) file.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: Excel file download

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        excel_content = export_service.export_to_excel(job_id, db)

        logger.info(f"Excel export for job {job_id} by user {current_user.id}")

        return Response(
            content=excel_content,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={
                "Content-Disposition": f"attachment; filename=results_{job_id}_{job.filename}.xlsx"
            }
        )
    except Exception as e:
        logger.error(f"Excel export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/job/{job_id}/pdf")
def export_pdf(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export job results as PDF report.

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: PDF file download

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        pdf_content = export_service.export_to_pdf(job_id, db)

        logger.info(f"PDF export for job {job_id} by user {current_user.id}")

        return Response(
            content=pdf_content,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename=report_{job_id}_{job.filename}.pdf"
            }
        )
    except Exception as e:
        logger.error(f"PDF export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.get("/job/{job_id}/tally")
def export_tally(
    job_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export job results in Tally-compatible CSV format.

    Tally format includes:
    - Date (DD-MM-YYYY)
    - Voucher Type (Sales, Purchase, etc.)
    - Voucher Number
    - Ledger Name (Party name)
    - Amount
    - Narration

    Args:
        job_id: Job ID
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: Tally-compatible CSV file download

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
    """
    # Verify job belongs to user
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Job not found"
        )

    try:
        tally_content = export_service.export_to_tally(job_id, db)

        logger.info(f"Tally CSV export for job {job_id} by user {current_user.id}")

        return Response(
            content=tally_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=tally_{job_id}_{job.filename}.csv"
            }
        )
    except Exception as e:
        logger.error(f"Tally CSV export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.post("/job/{job_id}/selective/csv")
def export_selective_csv(
    job_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export only selected fields as CSV.

    Args:
        job_id: Job ID
        request: Request body containing field_ids array
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: CSV file with selected fields only

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
        HTTPException 400: If no fields selected
    """
    # Verify job ownership
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Get field IDs from request
    field_ids = request.get('field_ids', [])
    if not field_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields selected")

    try:
        # Get selected fields
        from app.models.field import ExtractedField
        fields = db.query(ExtractedField).filter(
            ExtractedField.job_id == job_id,
            ExtractedField.id.in_(field_ids)
        ).all()

        if not fields:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No fields found")

        # Generate CSV with selected fields only
        import csv
        from io import StringIO

        output = StringIO()
        writer = csv.writer(output)

        # Header
        writer.writerow(['Field Name', 'Value', 'Confidence'])

        # Data rows
        for field in fields:
            current_value = field.edited_value if field.is_edited else field.original_value
            confidence = field.confidence if field.confidence else 'N/A'
            writer.writerow([
                field.field_name,
                current_value or '',
                confidence
            ])

        csv_content = output.getvalue()
        output.close()

        logger.info(f"Selective CSV export for job {job_id} by user {current_user.id} ({len(fields)} fields)")

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=selective_{job_id}_{job.filename}.csv"
            }
        )
    except Exception as e:
        logger.error(f"Selective CSV export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )


@router.post("/job/{job_id}/selective/tally")
def export_selective_tally(
    job_id: int,
    request: dict,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    export_service: ExportService = Depends(get_export_service)
):
    """Export only selected fields in Tally-compatible format.

    Args:
        job_id: Job ID
        request: Request body containing field_ids array
        current_user: Authenticated user
        db: Database session
        export_service: Export service instance

    Returns:
        Response: Tally-compatible CSV file with selected fields only

    Raises:
        HTTPException 404: If job not found or doesn't belong to user
        HTTPException 400: If no fields selected
    """
    # Verify job ownership
    job = db.query(Job).filter(
        Job.id == job_id,
        Job.user_id == current_user.id
    ).first()

    if not job:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found")

    # Get field IDs from request
    field_ids = request.get('field_ids', [])
    if not field_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No fields selected")

    try:
        # Get selected fields
        from app.models.field import ExtractedField
        fields = db.query(ExtractedField).filter(
            ExtractedField.job_id == job_id,
            ExtractedField.id.in_(field_ids)
        ).all()

        if not fields:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No fields found")

        # Build field dictionary for easy lookup
        field_dict = {}
        for field in fields:
            if not field.field_name.startswith('_'):
                current_value = field.edited_value if field.is_edited else field.original_value
                field_dict[field.field_name.lower()] = current_value or ''

        # Generate Tally CSV with selected fields
        import csv
        from io import StringIO

        output = StringIO()
        writer = csv.writer(output)

        # Tally CSV Header
        writer.writerow(['Date', 'Voucher Type', 'Voucher Number', 'Ledger Name', 'Amount', 'Narration'])

        # Smart field mapping with fallbacks (only from selected fields)
        date_field = field_dict.get('date') or field_dict.get('invoice date') or field_dict.get('bill date') or ''
        voucher_type = field_dict.get('voucher type') or 'Sales'
        voucher_number = field_dict.get('voucher number') or field_dict.get('invoice number') or field_dict.get('bill number') or ''
        party_name = field_dict.get('party name') or field_dict.get('customer name') or field_dict.get('buyer name') or ''
        amount = field_dict.get('total amount') or field_dict.get('amount') or field_dict.get('grand total') or '0.00'
        description = field_dict.get('description') or field_dict.get('narration') or f"Transaction for {party_name}"

        # Write Tally row
        writer.writerow([
            date_field,
            voucher_type,
            voucher_number,
            party_name,
            amount,
            description
        ])

        csv_content = output.getvalue()
        output.close()

        logger.info(f"Selective Tally export for job {job_id} by user {current_user.id} ({len(fields)} fields)")

        return Response(
            content=csv_content,
            media_type="text/csv",
            headers={
                "Content-Disposition": f"attachment; filename=selective_tally_{job_id}_{job.filename}.csv"
            }
        )
    except Exception as e:
        logger.error(f"Selective Tally export failed for job {job_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Export failed: {str(e)}"
        )

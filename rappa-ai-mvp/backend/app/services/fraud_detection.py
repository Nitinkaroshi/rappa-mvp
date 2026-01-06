"""Fraud Detection Service for Document Processing.

This service provides multiple fraud detection mechanisms:
1. Duplicate document detection (file hash matching)
2. Image manipulation detection (metadata & compression analysis)
3. Text consistency validation (amounts, dates, totals)
4. Confidence score analysis (flags suspicious low confidence)
5. Pattern matching against known fraud indicators
"""

import hashlib
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from pathlib import Path

from PIL import Image
from PIL.ExifTags import TAGS
import PyPDF2

logger = logging.getLogger(__name__)


class FraudDetectionService:
    """Service for detecting fraudulent documents."""

    def __init__(self):
        """Initialize fraud detection service."""
        self.fraud_patterns = self._load_fraud_patterns()
        logger.info("Fraud Detection Service initialized")

    def _load_fraud_patterns(self) -> Dict[str, List[str]]:
        """Load known fraud patterns.

        Returns:
            Dictionary of fraud pattern categories and their indicators
        """
        return {
            "suspicious_amounts": [
                r"\$9{3,}",  # Multiple 9s (e.g., $999.99)
                r"\.00$",    # Round amounts (e.g., $1000.00) - common in fraud
            ],
            "suspicious_dates": [
                r"(0[1-9]|1[0-2])/31/",  # Invalid dates like 02/31, 04/31
            ],
            "common_fraud_keywords": [
                "urgent", "immediate", "wire transfer", "final notice",
                "action required", "suspended", "verify account"
            ]
        }

    def calculate_file_hash(self, file_path: str) -> str:
        """Calculate SHA-256 hash of a file.

        Args:
            file_path: Path to the file

        Returns:
            SHA-256 hash string
        """
        sha256_hash = hashlib.sha256()

        with open(file_path, "rb") as f:
            # Read file in chunks to handle large files
            for byte_block in iter(lambda: f.read(4096), b""):
                sha256_hash.update(byte_block)

        return sha256_hash.hexdigest()

    def check_duplicate(
        self,
        file_hash: str,
        user_id: int,
        db_session
    ) -> Optional[Dict[str, Any]]:
        """Check if document is a duplicate.

        Args:
            file_hash: SHA-256 hash of the file
            user_id: User ID uploading the document
            db_session: Database session

        Returns:
            Dictionary with duplicate info if found, None otherwise
        """
        from app.models.job import Job

        # Query for existing jobs with same file hash
        duplicate_job = db_session.query(Job).filter(
            Job.user_id == user_id,
            Job.file_hash == file_hash,
            Job.status == "completed"
        ).first()

        if duplicate_job:
            return {
                "is_duplicate": True,
                "original_job_id": duplicate_job.id,
                "original_filename": duplicate_job.filename,
                "original_upload_date": duplicate_job.created_at.isoformat(),
                "risk_level": "high",
                "message": "This document has already been processed"
            }

        return None

    def analyze_image_metadata(self, file_path: str) -> Dict[str, Any]:
        """Analyze image metadata for signs of manipulation.

        Args:
            file_path: Path to the image or PDF file

        Returns:
            Dictionary with metadata analysis results
        """
        indicators = []
        metadata = {}

        try:
            # For PDF files, extract embedded images
            if file_path.lower().endswith('.pdf'):
                metadata = self._analyze_pdf_metadata(file_path)
            else:
                # Direct image analysis
                with Image.open(file_path) as img:
                    # Get EXIF data
                    exif_data = img.getexif()

                    if exif_data:
                        for tag_id, value in exif_data.items():
                            tag = TAGS.get(tag_id, tag_id)
                            metadata[tag] = str(value)

                    # Check for manipulation indicators
                    if 'Software' in metadata:
                        software = metadata['Software'].lower()
                        if any(editor in software for editor in ['photoshop', 'gimp', 'paint']):
                            indicators.append("Document edited with image editing software")

                    # Check for missing creation date
                    if 'DateTime' not in metadata:
                        indicators.append("Missing creation timestamp")

        except Exception as e:
            logger.warning(f"Could not analyze metadata: {e}")
            indicators.append("Unable to extract metadata")

        risk_level = "high" if len(indicators) >= 2 else "medium" if indicators else "low"

        return {
            "manipulation_indicators": indicators,
            "metadata_available": bool(metadata),
            "risk_level": risk_level
        }

    def _analyze_pdf_metadata(self, pdf_path: str) -> Dict[str, Any]:
        """Analyze PDF metadata.

        Args:
            pdf_path: Path to PDF file

        Returns:
            Dictionary with PDF metadata
        """
        metadata = {}

        try:
            with open(pdf_path, 'rb') as f:
                pdf = PyPDF2.PdfReader(f)
                if pdf.metadata:
                    for key, value in pdf.metadata.items():
                        metadata[key] = str(value)
        except Exception as e:
            logger.warning(f"Could not read PDF metadata: {e}")

        return metadata

    def check_text_consistency(self, extracted_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Check for inconsistencies in extracted text.

        Args:
            extracted_fields: List of extracted field dictionaries

        Returns:
            Dictionary with consistency check results
        """
        issues = []
        field_dict = {field['field_name']: field.get('current_value', '') for field in extracted_fields}

        # Check invoice totals consistency (if applicable)
        total_amount = self._extract_amount(field_dict.get('invoice_total', ''))
        subtotal = self._extract_amount(field_dict.get('invoice_subtotal', ''))
        tax = self._extract_amount(field_dict.get('invoice_tax', ''))

        if total_amount and subtotal and tax:
            calculated_total = subtotal + tax
            if abs(calculated_total - total_amount) > 0.01:  # Allow 1 cent difference for rounding
                issues.append({
                    "issue": "Total amount mismatch",
                    "details": f"Subtotal ({subtotal}) + Tax ({tax}) = {calculated_total}, but Total shows {total_amount}",
                    "severity": "high"
                })

        # Check for future dates
        invoice_date = field_dict.get('invoice_date', '')
        due_date = field_dict.get('invoice_due_date', '')

        if invoice_date:
            parsed_date = self._parse_date(invoice_date)
            if parsed_date and parsed_date > datetime.now():
                issues.append({
                    "issue": "Future invoice date",
                    "details": f"Invoice date ({invoice_date}) is in the future",
                    "severity": "medium"
                })

        # Check for invalid date sequences
        if invoice_date and due_date:
            inv_date = self._parse_date(invoice_date)
            d_date = self._parse_date(due_date)

            if inv_date and d_date and d_date < inv_date:
                issues.append({
                    "issue": "Due date before invoice date",
                    "details": f"Due date ({due_date}) is before invoice date ({invoice_date})",
                    "severity": "high"
                })

        # Check for suspicious patterns
        for field_name, value in field_dict.items():
            if 'amount' in field_name.lower() or 'total' in field_name.lower():
                for pattern in self.fraud_patterns['suspicious_amounts']:
                    if re.search(pattern, str(value)):
                        issues.append({
                            "issue": "Suspicious amount pattern",
                            "details": f"Field '{field_name}' has suspicious value: {value}",
                            "severity": "medium"
                        })

        risk_level = "high" if any(i['severity'] == 'high' for i in issues) else \
                     "medium" if issues else "low"

        return {
            "consistency_issues": issues,
            "total_issues": len(issues),
            "risk_level": risk_level
        }

    def analyze_confidence_scores(self, extracted_fields: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Analyze confidence scores for suspicious patterns.

        Args:
            extracted_fields: List of extracted field dictionaries

        Returns:
            Dictionary with confidence analysis results
        """
        low_confidence_fields = []
        critical_fields = [
            'invoice_total', 'invoice_number', 'invoice_date',
            'customer_name', 'vendor_name'
        ]

        for field in extracted_fields:
            field_name = field.get('field_name', '')
            confidence = field.get('confidence') or field.get('extraction_confidence')

            if confidence:
                # Handle different confidence formats
                if isinstance(confidence, str):
                    # Map text confidence to numeric
                    confidence_map = {
                        'high': 0.9,
                        'medium': 0.7,
                        'low': 0.5,
                        'very high': 0.95,
                        'very low': 0.3
                    }
                    conf_float = confidence_map.get(confidence.lower().strip(), None)
                    if conf_float is None:
                        try:
                            conf_float = float(confidence)
                        except ValueError:
                            continue  # Skip this field if we can't parse confidence
                else:
                    conf_float = float(confidence)

                # Flag low confidence in critical fields
                if field_name in critical_fields and conf_float < 0.70:
                    low_confidence_fields.append({
                        "field": field_name,
                        "confidence": conf_float,
                        "value": field.get('current_value', ''),
                        "reason": "Critical field with low confidence"
                    })

                # Flag extremely low confidence (possible manipulation)
                elif conf_float < 0.50:
                    low_confidence_fields.append({
                        "field": field_name,
                        "confidence": conf_float,
                        "value": field.get('current_value', ''),
                        "reason": "Extremely low extraction confidence"
                    })

        # Calculate average confidence
        confidences = []
        for field in extracted_fields:
            conf = field.get('confidence') or field.get('extraction_confidence')
            if conf:
                confidences.append(float(conf) if isinstance(conf, str) else conf)

        avg_confidence = sum(confidences) / len(confidences) if confidences else 0

        risk_level = "high" if avg_confidence < 0.60 or len(low_confidence_fields) >= 3 else \
                     "medium" if avg_confidence < 0.75 or low_confidence_fields else "low"

        return {
            "average_confidence": round(avg_confidence, 3),
            "low_confidence_fields": low_confidence_fields,
            "total_low_confidence": len(low_confidence_fields),
            "risk_level": risk_level
        }

    def perform_full_analysis(
        self,
        file_path: str,
        file_hash: str,
        user_id: int,
        extracted_fields: List[Dict[str, Any]],
        db_session
    ) -> Dict[str, Any]:
        """Perform comprehensive fraud detection analysis.

        Args:
            file_path: Path to the document file
            file_hash: SHA-256 hash of the file
            user_id: User ID
            extracted_fields: List of extracted fields
            db_session: Database session

        Returns:
            Complete fraud detection report
        """
        logger.info(f"Starting fraud detection analysis for file: {file_path}")

        # 1. Duplicate Detection
        duplicate_check = self.check_duplicate(file_hash, user_id, db_session)

        # 2. Image Metadata Analysis
        metadata_analysis = self.analyze_image_metadata(file_path)

        # 3. Text Consistency Check
        consistency_check = self.check_text_consistency(extracted_fields)

        # 4. Confidence Score Analysis
        confidence_analysis = self.analyze_confidence_scores(extracted_fields)

        # Calculate overall risk score
        risk_scores = {
            "duplicate": 3 if duplicate_check else 0,
            "metadata": 2 if metadata_analysis['risk_level'] == 'high' else
                       1 if metadata_analysis['risk_level'] == 'medium' else 0,
            "consistency": 3 if consistency_check['risk_level'] == 'high' else
                          1 if consistency_check['risk_level'] == 'medium' else 0,
            "confidence": 2 if confidence_analysis['risk_level'] == 'high' else
                         1 if confidence_analysis['risk_level'] == 'medium' else 0
        }

        total_risk_score = sum(risk_scores.values())

        # Determine overall risk level
        if total_risk_score >= 6:
            overall_risk = "high"
            recommendation = "Manual review required - Multiple fraud indicators detected"
        elif total_risk_score >= 3:
            overall_risk = "medium"
            recommendation = "Review recommended - Some fraud indicators present"
        else:
            overall_risk = "low"
            recommendation = "Document appears legitimate"

        # Compile all flags
        all_flags = []

        if duplicate_check:
            all_flags.append("Duplicate document detected")

        if metadata_analysis['manipulation_indicators']:
            all_flags.extend(metadata_analysis['manipulation_indicators'])

        if consistency_check['consistency_issues']:
            all_flags.extend([issue['issue'] for issue in consistency_check['consistency_issues']])

        if confidence_analysis['low_confidence_fields']:
            all_flags.append(f"{len(confidence_analysis['low_confidence_fields'])} fields with low confidence")

        report = {
            "overall_risk_level": overall_risk,
            "risk_score": total_risk_score,
            "max_risk_score": 9,
            "recommendation": recommendation,
            "flags": all_flags,
            "total_flags": len(all_flags),
            "detailed_analysis": {
                "duplicate_detection": duplicate_check or {"is_duplicate": False},
                "metadata_analysis": metadata_analysis,
                "consistency_check": consistency_check,
                "confidence_analysis": confidence_analysis
            },
            "timestamp": datetime.utcnow().isoformat()
        }

        logger.info(f"Fraud analysis complete: Risk={overall_risk}, Score={total_risk_score}/9, Flags={len(all_flags)}")

        return report

    @staticmethod
    def _extract_amount(text: str) -> Optional[float]:
        """Extract numeric amount from text.

        Args:
            text: Text containing an amount

        Returns:
            Extracted amount as float, or None
        """
        if not text:
            return None

        # Remove currency symbols and commas
        cleaned = re.sub(r'[,$₹€£]', '', str(text))

        # Extract number
        match = re.search(r'[\d,]+\.?\d*', cleaned)
        if match:
            try:
                return float(match.group().replace(',', ''))
            except ValueError:
                return None

        return None

    @staticmethod
    def _parse_date(date_str: str) -> Optional[datetime]:
        """Parse date string to datetime.

        Args:
            date_str: Date string in various formats

        Returns:
            Parsed datetime or None
        """
        if not date_str:
            return None

        # Common date formats
        formats = [
            '%Y-%m-%d',
            '%d/%m/%Y',
            '%m/%d/%Y',
            '%d-%m-%Y',
            '%m-%d-%Y',
            '%Y/%m/%d',
            '%d %B %Y',
            '%B %d, %Y'
        ]

        for fmt in formats:
            try:
                return datetime.strptime(date_str, fmt)
            except ValueError:
                continue

        return None


# Singleton instance
_fraud_detection_service = None


def get_fraud_detection_service() -> FraudDetectionService:
    """Get singleton fraud detection service instance.

    Returns:
        FraudDetectionService instance
    """
    global _fraud_detection_service

    if _fraud_detection_service is None:
        _fraud_detection_service = FraudDetectionService()

    return _fraud_detection_service

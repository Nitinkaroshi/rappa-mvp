# Fraud Detection System - User Guide

## Overview

The Fraud Detection System automatically analyzes every uploaded document for potential fraud indicators. It uses multiple detection methods to provide a comprehensive security analysis.

---

## How It Works

### Detection Methods

#### 1. **Duplicate Detection**
- **What it does**: Calculates a SHA-256 hash of the uploaded file and checks if the same document was previously uploaded
- **Why it matters**: Prevents accidental or intentional duplicate submissions
- **Detection**: Compares file hash with all previous uploads by the same user

#### 2. **Image Manipulation Detection**
- **What it does**: Analyzes document metadata for signs of editing or tampering
- **Checks for**:
  - Image editing software signatures (Photoshop, GIMP, etc.)
  - Missing or altered creation timestamps
  - Compression artifacts indicating re-encoding
  - PDF metadata inconsistencies
- **Why it matters**: Edited documents may have falsified information

#### 3. **Text Consistency Validation**
- **What it does**: Verifies that extracted numbers and dates are logically consistent
- **Checks for**:
  - Invoice totals matching subtotal + tax calculations
  - Due dates occurring after invoice dates
  - Future dates in document fields
  - Suspicious amount patterns (e.g., all 9's: $999.99)
  - Invalid date formats (e.g., 02/31/2024)
- **Why it matters**: Inconsistent data often indicates fraudulent modifications

#### 4. **OCR Confidence Analysis**
- **What it does**: Analyzes extraction confidence scores for suspicious patterns
- **Checks for**:
  - Low confidence scores (<70%) in critical fields (totals, dates, names)
  - Extremely low confidence (<50%) indicating possible image manipulation
  - Average document confidence below acceptable threshold
- **Why it matters**: Manipulated documents often have degraded image quality

#### 5. **Pattern Matching**
- **What it does**: Scans for known fraud indicators in extracted text
- **Checks for**:
  - Urgent action phrases ("wire transfer", "immediate action required")
  - Suspicious keywords common in phishing/fraud
  - Round number amounts (common in fake invoices)
- **Why it matters**: Fraudulent documents often contain specific language patterns

---

## Risk Levels

### 🟢 Low Risk (Score: 0-2)
- **Meaning**: Document appears legitimate
- **Recommendation**: Proceed normally
- **Typical characteristics**:
  - No duplicates found
  - Clean metadata
  - Consistent data fields
  - High confidence scores (>85%)

### 🟡 Medium Risk (Score: 3-5)
- **Meaning**: Some fraud indicators present, review recommended
- **Recommendation**: Manual review suggested
- **Typical characteristics**:
  - Minor metadata anomalies
  - Some low confidence fields
  - Minor consistency issues (e.g., rounding differences)
  - Edited with standard software (MS Office, etc.)

### 🔴 High Risk (Score: 6-9)
- **Meaning**: Multiple fraud indicators detected, manual review required
- **Recommendation**: **DO NOT PROCESS** without thorough review
- **Typical characteristics**:
  - Duplicate document detected
  - Evidence of image manipulation
  - Significant data inconsistencies
  - Multiple low confidence fields
  - Suspicious patterns detected

---

## Testing the Fraud Detection System

### Required Test Documents

To thoroughly test the fraud detection system, you'll need the following documents:

#### Test 1: Clean Document (Baseline)
**Purpose**: Verify system correctly identifies legitimate documents

**Document**: Any standard invoice PDF
- No editing
- Consistent data
- Clear, high-quality scan

**Expected Result**: 🟢 Low Risk (0-1 score)

---

#### Test 2: Duplicate Document
**Purpose**: Test duplicate detection

**How to test**:
1. Upload invoice_sample.pdf (first time)
2. Wait for processing to complete
3. Upload the exact same invoice_sample.pdf again

**Expected Result**: 🔴 High Risk
- "Duplicate document detected" flag
- Shows original job ID and upload date
- Risk score: +3

---

#### Test 3: Edited Document
**Purpose**: Test image manipulation detection

**How to create**:
1. Take any PDF invoice
2. Open in Adobe Acrobat or similar PDF editor
3. Make a minor edit (change a number)
4. Save the PDF

**Alternative**:
1. Convert PDF to image (PNG/JPG)
2. Open in Photoshop/GIMP
3. Edit any field (amount, date, etc.)
4. Convert back to PDF using print-to-PDF

**Expected Result**: 🟡 Medium to 🔴 High Risk
- "Document edited with image editing software" flag
- Risk score: +1 to +2

---

#### Test 4: Inconsistent Data
**Purpose**: Test text consistency validation

**How to create**:
Create a PDF invoice with intentionally inconsistent values:
- Subtotal: $100.00
- Tax (10%): $10.00
- **Total: $115.00** ← Incorrect (should be $110.00)

OR

- Invoice Date: 2024-12-15
- **Due Date: 2024-12-01** ← Incorrect (due date before invoice date)

OR

- Invoice Date: **2025-12-31** ← Future date

**Expected Result**: 🟡 Medium to 🔴 High Risk
- "Total amount mismatch" flag
- "Due date before invoice date" flag
- Risk score: +1 to +3

---

#### Test 5: Low Quality Document
**Purpose**: Test confidence score analysis

**How to create**:
1. Take a clear invoice
2. Print it
3. Photocopy it 2-3 times (degrades quality)
4. Scan the degraded copy at low resolution (150 DPI)
5. Convert to PDF

**Expected Result**: 🟡 Medium Risk
- "X fields with low confidence" flag
- Low average confidence score
- Risk score: +1 to +2

---

#### Test 6: Suspicious Patterns
**Purpose**: Test pattern matching

**How to create**:
Create an invoice with suspicious amounts:
- Total: $999.99
- All items priced at $99.99

**Expected Result**: 🟡 Medium Risk
- "Suspicious amount pattern" flag
- Risk score: +1

---

### Complete Test Suite

Here's a recommended testing checklist:

```
Test Documents Needed:
□ 1 clean, legitimate invoice (baseline)
□ 1 duplicate of the clean invoice
□ 1 PDF edited with Adobe/similar tool
□ 1 invoice with wrong calculations (subtotal + tax ≠ total)
□ 1 invoice with dates out of order
□ 1 low-quality scan (photocopied multiple times)
□ 1 invoice with all amounts ending in .99
```

---

## Sample Test Documents

### Creating Test Documents Programmatically

If you want to automate test document creation, here's a Python script:

```python
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime, timedelta

def create_test_invoice(filename, scenario):
    """Create test invoice PDFs for fraud detection testing."""
    c = canvas.Canvas(filename, pagesize=letter)

    # Header
    c.setFont("Helvetica-Bold", 20)
    c.drawString(100, 750, "TEST INVOICE")

    c.setFont("Helvetica", 12)
    c.drawString(100, 720, f"Invoice #: TEST-{scenario}")

    if scenario == "clean":
        # Clean, legitimate invoice
        c.drawString(100, 700, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(100, 680, "Subtotal: $100.00")
        c.drawString(100, 660, "Tax (10%): $10.00")
        c.drawString(100, 640, "Total: $110.00")

    elif scenario == "inconsistent_math":
        # Inconsistent calculations
        c.drawString(100, 700, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(100, 680, "Subtotal: $100.00")
        c.drawString(100, 660, "Tax (10%): $10.00")
        c.drawString(100, 640, "Total: $125.00")  # WRONG!

    elif scenario == "future_date":
        # Future invoice date
        future = datetime.now() + timedelta(days=30)
        c.drawString(100, 700, f"Date: {future.strftime('%Y-%m-%d')}")
        c.drawString(100, 680, "Subtotal: $100.00")
        c.drawString(100, 660, "Tax (10%): $10.00")
        c.drawString(100, 640, "Total: $110.00")

    elif scenario == "reversed_dates":
        # Due date before invoice date
        inv_date = datetime.now()
        due_date = inv_date - timedelta(days=7)
        c.drawString(100, 700, f"Invoice Date: {inv_date.strftime('%Y-%m-%d')}")
        c.drawString(100, 680, f"Due Date: {due_date.strftime('%Y-%m-%d')}")
        c.drawString(100, 660, "Total: $110.00")

    elif scenario == "suspicious_amounts":
        # All .99 amounts
        c.drawString(100, 700, f"Date: {datetime.now().strftime('%Y-%m-%d')}")
        c.drawString(100, 680, "Item 1: $99.99")
        c.drawString(100, 660, "Item 2: $99.99")
        c.drawString(100, 640, "Total: $999.99")

    c.save()
    print(f"Created: {filename}")

# Generate test documents
create_test_invoice("test_clean.pdf", "clean")
create_test_invoice("test_inconsistent.pdf", "inconsistent_math")
create_test_invoice("test_future_date.pdf", "future_date")
create_test_invoice("test_reversed_dates.pdf", "reversed_dates")
create_test_invoice("test_suspicious.pdf", "suspicious_amounts")
```

---

## Understanding the Results

### Fraud Detection Panel in UI

When you view a processed job, the Fraud Detection Panel appears at the top of the results page:

```
┌─────────────────────────────────────────────────────────┐
│ 🛡️ Fraud Detection Analysis                     [6/9]  │
│                                        🔴 HIGH RISK     │
├─────────────────────────────────────────────────────────┤
│ ℹ️ Recommendation:                                      │
│ Manual review required - Multiple fraud indicators      │
├─────────────────────────────────────────────────────────┤
│ Detected Issues (3)                    [View Details]   │
│ ⚠️ Duplicate document detected                          │
│ ⚠️ Document edited with image editing software          │
│ ⚠️ Total amount mismatch                                │
└─────────────────────────────────────────────────────────┘
```

### Click "View Details" to see:

1. **Duplicate Detection Results**
   - Original job ID
   - Original filename
   - Upload date

2. **Metadata Analysis**
   - Manipulation indicators
   - Risk level

3. **Text Consistency Check**
   - Specific issues found
   - Details of inconsistencies
   - Severity level

4. **Confidence Analysis**
   - Average confidence score
   - List of low-confidence fields
   - Specific reasons

---

## API Response Format

The fraud analysis is included in the job response:

```json
{
  "id": 123,
  "filename": "invoice.pdf",
  "status": "completed",
  "fraud_analysis": {
    "overall_risk_level": "high",
    "risk_score": 6,
    "max_risk_score": 9,
    "recommendation": "Manual review required - Multiple fraud indicators detected",
    "flags": [
      "Duplicate document detected",
      "Document edited with image editing software",
      "Total amount mismatch"
    ],
    "total_flags": 3,
    "detailed_analysis": {
      "duplicate_detection": {
        "is_duplicate": true,
        "original_job_id": 115,
        "original_filename": "invoice.pdf",
        "original_upload_date": "2025-12-27T10:30:00",
        "risk_level": "high"
      },
      "metadata_analysis": {
        "manipulation_indicators": [
          "Document edited with image editing software"
        ],
        "risk_level": "medium"
      },
      "consistency_check": {
        "consistency_issues": [
          {
            "issue": "Total amount mismatch",
            "details": "Subtotal (100.0) + Tax (10.0) = 110.0, but Total shows 125.0",
            "severity": "high"
          }
        ],
        "risk_level": "high"
      },
      "confidence_analysis": {
        "average_confidence": 0.875,
        "low_confidence_fields": [],
        "risk_level": "low"
      }
    },
    "timestamp": "2025-12-28T15:45:00Z"
  }
}
```

---

## Best Practices

### For Users

1. **Always review HIGH risk documents manually**
2. **Check MEDIUM risk documents if dealing with sensitive data**
3. **Don't ignore duplicate warnings** - verify if resubmission was intentional
4. **Look at the detailed analysis** - understand what triggered the flags

### For Developers

1. **Database migration required**: Run the migration to add `file_hash` and `fraud_analysis` columns
   ```bash
   psql -U your_user -d rappa_db -f backend/migrations/add_fraud_detection.sql
   ```

2. **Dependencies**: Ensure PyPDF2 and Pillow are installed
   ```bash
   pip install PyPDF2 Pillow
   ```

3. **Restart Celery workers** after deployment to load new fraud detection code
   ```bash
   celery -A app.workers.tasks worker --loglevel=info
   ```

---

## Limitations

### Current Limitations

1. **No real-time scanning during upload** - Fraud detection runs during processing
2. **Limited to same-user duplicates** - Doesn't detect duplicates across different users
3. **Pattern matching is rule-based** - Not ML-based (future enhancement)
4. **No historical fraud database** - Doesn't learn from confirmed fraud cases
5. **PDF metadata can be stripped** - Advanced attackers can remove metadata

### Future Enhancements

- [ ] Machine learning-based anomaly detection
- [ ] Cross-user duplicate detection (with privacy controls)
- [ ] Integration with external fraud databases
- [ ] Real-time scanning during upload
- [ ] Advanced image forensics (ELA analysis, noise pattern detection)
- [ ] Historical fraud pattern learning
- [ ] Confidence score weighting based on document type

---

## Troubleshooting

### Fraud detection not showing in UI

**Check**:
1. Run database migration
2. Restart backend server
3. Restart Celery workers
4. Verify job has `fraud_analysis` field in database

### Always getting "low risk"

**Check**:
1. Test with deliberately fraudulent documents (see test suite above)
2. Verify fraud detection service is being called in Celery task
3. Check logs for fraud detection execution

### False positives

**Common causes**:
1. Legitimate documents edited in PDF editor (adds software signature)
2. Scanned documents with poor quality (low confidence)
3. Re-uploaded documents for corrections (duplicate detection)

**Solution**: Review detailed analysis to understand specific triggers

---

## FAQ

**Q: Will fraud detection slow down processing?**
A: Minimal impact (~200-500ms per document). Runs after field extraction.

**Q: Can I disable fraud detection for certain documents?**
A: Currently no, but you can ignore low/medium risk results.

**Q: What happens if a document is flagged as high risk?**
A: Processing completes normally, but the fraud panel is displayed prominently. You decide whether to trust the data.

**Q: Does it store the document hash permanently?**
A: Yes, for duplicate detection. Hash is stored, not the full document.

**Q: Can I add custom fraud patterns?**
A: Yes, edit `backend/app/services/fraud_detection.py` and add patterns to `_load_fraud_patterns()`

---

**Last Updated**: 2025-12-28
**Version**: 1.0.0
**Status**: Production Ready

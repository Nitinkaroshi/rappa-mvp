# UX Improvements Implementation Plan

**Date**: January 3, 2026
**Priority**: HIGH (Based on client feedback)
**Status**: Planning

---

## Client Feedback Summary

During yesterday's client meeting, key pain points identified:

1. **Too many fields in export** - User only needs 5-10 important fields, not all 50
2. **No way to validate formats** - Phone numbers, PAN, Aadhar need format checking
3. **Can't tell field accuracy** - Which fields are reliable vs uncertain?
4. **Manual fixing is tedious** - Low confidence fields need re-extraction option

---

## Feature 1: Selective Field Export (Checkboxes)

### User Flow
```
1. User views extracted fields
2. Checkboxes next to each field (default: all checked)
3. User unchecks unwanted fields
4. Clicks "Export Selected Fields to Tally"
5. Only selected fields included in CSV
```

### UI Design
```
┌─────────────────────────────────────────┐
│ Extracted Fields                  [✓] Select All High Confidence  │
│                                   [✓] Select Required Only       │
│                                   [ ] Select All                  │
├─────────────────────────────────────────┤
│ [✓] Invoice Number: INV-2024-001   ●95% │
│ [✓] Date: 15-12-2024               ●98% │
│ [✓] Customer Name: ABC Enterprises ●92% │
│ [ ] Address: 123 Main St...        ●87% │  ← Unchecked
│ [✓] Total Amount: ₹25,000          ●99% │
│ [ ] Description: Office supplies   ●75% │  ← Unchecked
├─────────────────────────────────────────┤
│ 4 of 6 fields selected                  │
│ [Export Selected to Tally] [Export All] │
└─────────────────────────────────────────┘
```

### Backend Changes
**New API Endpoint**: `POST /api/v1/export/job/{job_id}/tally/selective`
**Request Body**:
```json
{
  "field_ids": [1, 2, 3, 5, 7]  // Only selected field IDs
}
```

**Response**: CSV with only selected fields

### Frontend Changes
**File**: `JobResults.jsx`
- Add state: `selectedFieldIds` (array of field IDs)
- Add checkboxes to each field row
- Add "Select All" / "Deselect All" buttons
- Modify export handler to send selected fields

**Estimated Time**: 3-4 hours

---

## Feature 2: Centralized Validation Regex Library

### Indian Document Field Patterns

**File**: `backend/app/utils/validators.py`

```python
"""
Centralized validation patterns for Indian documents.

Usage:
  from app.utils.validators import VALIDATORS

  is_valid = VALIDATORS['mobile'].validate('9876543210')
  formatted = VALIDATORS['pan'].format('ABCDE1234F')
"""

import re
from typing import Dict, Optional, Tuple

class FieldValidator:
    def __init__(self, pattern: str, format_template: str, error_message: str):
        self.pattern = re.compile(pattern)
        self.format_template = format_template
        self.error_message = error_message

    def validate(self, value: str) -> bool:
        """Check if value matches pattern."""
        return bool(self.pattern.fullmatch(value.strip()))

    def format(self, value: str) -> str:
        """Format value according to template."""
        return self.format_template.format(value)

    def get_error(self, value: str) -> Optional[str]:
        """Return error message if invalid, None otherwise."""
        return None if self.validate(value) else self.error_message


# Indian Document Validators
VALIDATORS = {
    # Mobile Number (India)
    'mobile': FieldValidator(
        pattern=r'^[6-9]\d{9}$',
        format_template='{}',
        error_message='Invalid mobile number. Must be 10 digits starting with 6-9'
    ),

    # PAN Card
    'pan': FieldValidator(
        pattern=r'^[A-Z]{5}\d{4}[A-Z]$',
        format_template='{}',
        error_message='Invalid PAN. Format: ABCDE1234F (5 letters, 4 digits, 1 letter)'
    ),

    # Aadhar Number
    'aadhar': FieldValidator(
        pattern=r'^\d{12}$',
        format_template='{0:4} {1:4} {2:4}',  # Format: 1234 5678 9012
        error_message='Invalid Aadhar. Must be 12 digits'
    ),

    # GSTIN
    'gstin': FieldValidator(
        pattern=r'^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$',
        format_template='{}',
        error_message='Invalid GSTIN. Format: 29ABCDE1234F1Z5'
    ),

    # Pincode
    'pincode': FieldValidator(
        pattern=r'^\d{6}$',
        format_template='{}',
        error_message='Invalid pincode. Must be 6 digits'
    ),

    # Email
    'email': FieldValidator(
        pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        format_template='{}',
        error_message='Invalid email format'
    ),

    # Bank Account Number (India: 9-18 digits)
    'bank_account': FieldValidator(
        pattern=r'^\d{9,18}$',
        format_template='{}',
        error_message='Invalid bank account. Must be 9-18 digits'
    ),

    # IFSC Code
    'ifsc': FieldValidator(
        pattern=r'^[A-Z]{4}0[A-Z0-9]{6}$',
        format_template='{}',
        error_message='Invalid IFSC. Format: SBIN0001234'
    ),

    # Vehicle Registration (India)
    'vehicle_reg': FieldValidator(
        pattern=r'^[A-Z]{2}\d{2}[A-Z]{1,2}\d{4}$',
        format_template='{}',
        error_message='Invalid vehicle registration. Format: KA01AB1234'
    ),

    # CIN (Company Identification Number)
    'cin': FieldValidator(
        pattern=r'^[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$',
        format_template='{}',
        error_message='Invalid CIN. Format: U12345AB2020PLC012345'
    ),

    # HSN Code (6-8 digits)
    'hsn': FieldValidator(
        pattern=r'^\d{6,8}$',
        format_template='{}',
        error_message='Invalid HSN code. Must be 6-8 digits'
    ),

    # Invoice Number (flexible: alphanumeric with optional separators)
    'invoice_number': FieldValidator(
        pattern=r'^[A-Z0-9\-/]{3,20}$',
        format_template='{}',
        error_message='Invalid invoice number. Use letters, numbers, dashes, slashes only'
    ),

    # Currency Amount (Indian Rupees)
    'currency': FieldValidator(
        pattern=r'^\d+(\.\d{1,2})?$',
        format_template='₹ {}',
        error_message='Invalid amount. Use numbers only (e.g., 1234.56)'
    ),

    # Date (DD-MM-YYYY or DD/MM/YYYY)
    'date': FieldValidator(
        pattern=r'^(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/]\d{4}$',
        format_template='{}',
        error_message='Invalid date. Use DD-MM-YYYY or DD/MM/YYYY'
    ),
}


def validate_field(field_type: str, value: str) -> Tuple[bool, Optional[str]]:
    """
    Validate a field value against its type.

    Args:
        field_type: Type of field (mobile, pan, aadhar, etc.)
        value: Value to validate

    Returns:
        Tuple of (is_valid, error_message)
    """
    if field_type not in VALIDATORS:
        return True, None  # No validator for this type

    validator = VALIDATORS[field_type]
    is_valid = validator.validate(value)
    error_msg = None if is_valid else validator.get_error(value)

    return is_valid, error_msg


def auto_detect_field_type(field_name: str) -> Optional[str]:
    """
    Auto-detect field type from field name.

    Args:
        field_name: Name of the field

    Returns:
        Detected field type or None
    """
    field_name_lower = field_name.lower()

    # Mapping of keywords to field types
    keyword_map = {
        'mobile': ['mobile', 'phone', 'contact'],
        'pan': ['pan', 'pan card', 'pan number'],
        'aadhar': ['aadhar', 'aadhaar', 'uid'],
        'gstin': ['gstin', 'gst', 'gst number'],
        'pincode': ['pincode', 'pin', 'postal code', 'zip'],
        'email': ['email', 'e-mail'],
        'bank_account': ['account number', 'bank account'],
        'ifsc': ['ifsc', 'ifsc code'],
        'vehicle_reg': ['vehicle', 'registration', 'reg number'],
        'cin': ['cin', 'company identification'],
        'hsn': ['hsn', 'hsn code'],
        'invoice_number': ['invoice number', 'bill number', 'invoice no'],
        'currency': ['amount', 'total', 'price', 'cost', 'fee'],
        'date': ['date'],
    }

    for field_type, keywords in keyword_map.items():
        if any(keyword in field_name_lower for keyword in keywords):
            return field_type

    return None
```

### Usage in API
**File**: `backend/app/services/field_validation_service.py`

```python
from app.utils.validators import validate_field, auto_detect_field_type

def validate_extracted_fields(job_id: int, db: Session) -> Dict[str, Any]:
    """
    Validate all fields for a job and return validation results.
    """
    fields = db.query(ExtractedField).filter(
        ExtractedField.job_id == job_id
    ).all()

    validation_results = []

    for field in fields:
        # Auto-detect field type
        field_type = auto_detect_field_type(field.field_name)

        if field_type:
            is_valid, error_msg = validate_field(field_type, field.current_value)

            validation_results.append({
                "field_id": field.id,
                "field_name": field.field_name,
                "value": field.current_value,
                "field_type": field_type,
                "is_valid": is_valid,
                "error_message": error_msg
            })

    return {
        "job_id": job_id,
        "total_fields": len(fields),
        "validated_fields": len(validation_results),
        "validations": validation_results
    }
```

**New API Endpoint**: `GET /api/v1/fields/job/{job_id}/validate`

**Estimated Time**: 4-5 hours

---

## Feature 3: Color-Coded Confidence Indicators

### Confidence Levels
- **Green** (95-100%): High confidence - no review needed
- **Yellow** (90-95%): Medium confidence - quick review
- **Red** (<90%): Low confidence - needs verification/re-extraction

### UI Implementation

**Component**: `ConfidenceIndicator.jsx`
```jsx
function ConfidenceIndicator({ confidence, size = 'md' }) {
  // Convert confidence to number if it's a string
  const conf = typeof confidence === 'string'
    ? parseFloat(confidence.replace('%', ''))
    : confidence * 100;

  const getColor = (conf) => {
    if (conf >= 95) return { bg: 'bg-green-100', text: 'text-green-800', dot: 'bg-green-500' };
    if (conf >= 90) return { bg: 'bg-yellow-100', text: 'text-yellow-800', dot: 'bg-yellow-500' };
    return { bg: 'bg-red-100', text: 'text-red-800', dot: 'bg-red-500' };
  };

  const colors = getColor(conf);

  return (
    <div className={`inline-flex items-center gap-1.5 px-2 py-1 rounded ${colors.bg}`}>
      <div className={`w-2 h-2 rounded-full ${colors.dot}`}></div>
      <span className={`text-xs font-medium ${colors.text}`}>
        {conf.toFixed(0)}%
      </span>
    </div>
  );
}
```

### Field Row Update
```jsx
<div className="field-row">
  <input type="checkbox" checked={isSelected} onChange={handleSelect} />
  <span className="field-name">Invoice Number:</span>
  <span className="field-value">INV-2024-001</span>
  <ConfidenceIndicator confidence={0.95} />  {/* Green */}
  {confidence < 0.90 && (
    <button onClick={() => reExtractField(fieldId)} className="re-extract-btn">
      Re-extract
    </button>
  )}
</div>
```

**Estimated Time**: 2-3 hours

---

## Feature 4: AI Re-extraction for Low Confidence

### User Flow
```
1. User sees red confidence indicator (<90%)
2. Clicks "Re-extract" button next to field
3. Backend calls Gemini API with:
   - More specific prompt for that field
   - Increased temperature for creativity
   - Multiple attempts (3 tries)
4. Shows new extracted value with updated confidence
5. User accepts or keeps original
```

### Backend Implementation
**File**: `backend/app/services/field_reextraction_service.py`

```python
class FieldReextractionService:
    def __init__(self, gemini_service: GeminiService):
        self.gemini_service = gemini_service

    async def reextract_field(
        self,
        job_id: int,
        field_id: int,
        db: Session
    ) -> Dict[str, Any]:
        """
        Re-extract a single field with better prompts.
        """
        field = db.query(ExtractedField).filter(
            ExtractedField.id == field_id,
            ExtractedField.job_id == job_id
        ).first()

        if not field:
            raise ValueError("Field not found")

        job = db.query(Job).filter(Job.id == job_id).first()

        # Build focused prompt for this specific field
        focused_prompt = f"""
        Extract ONLY the "{field.field_name}" from this document.

        Field to extract: {field.field_name}
        Current (uncertain) value: {field.current_value}

        Instructions:
        - Look carefully at the entire document
        - Return the most accurate value you can find
        - If multiple values exist, return the most relevant one
        - If you're unsure, return your best guess

        Return ONLY the value, nothing else.
        """

        # Get document text/image
        # ... (load from S3 or cache)

        # Call Gemini with focused prompt (3 attempts)
        best_result = None
        best_confidence = 0

        for attempt in range(3):
            result = self.gemini_service.extract_fields_from_text(
                text=document_text,
                prompt=focused_prompt
            )

            if result['confidence'] > best_confidence:
                best_result = result
                best_confidence = result['confidence']

        # Update field with new value
        field.edited_value = best_result['extracted_value']
        field.confidence_score = best_confidence
        field.is_edited = True
        db.commit()

        return {
            "field_id": field_id,
            "old_value": field.original_value,
            "new_value": best_result['extracted_value'],
            "old_confidence": field.original_confidence,
            "new_confidence": best_confidence,
            "improvement": best_confidence - field.original_confidence
        }
```

**New API Endpoint**: `POST /api/v1/fields/{field_id}/reextract`

**Estimated Time**: 5-6 hours

---

## Feature 5: Field Validation Warnings (Auto-detect)

### Visual Indicators
```
┌─────────────────────────────────────────┐
│ Mobile Number: 12345          ⚠️ Invalid│  ← Orange warning
│   Must be 10 digits starting with 6-9  │
├─────────────────────────────────────────┤
│ PAN: ABCDE1234F              ✓ Valid   │  ← Green check
├─────────────────────────────────────────┤
│ GSTIN: [empty]                ❌ Required│  ← Red error
└─────────────────────────────────────────┘
```

### Backend Auto-validation
When fields are extracted, automatically validate against patterns:

```python
# In extraction service
def post_process_fields(fields: List[ExtractedField]) -> List[ExtractedField]:
    """Auto-validate fields after extraction."""
    for field in fields:
        field_type = auto_detect_field_type(field.field_name)

        if field_type:
            is_valid, error_msg = validate_field(field_type, field.current_value)

            # Store validation result in metadata
            field.metadata = {
                "field_type": field_type,
                "is_valid": is_valid,
                "validation_error": error_msg
            }

    return fields
```

**Estimated Time**: 3-4 hours

---

## Feature 6: Export Presets/Templates

### Predefined Presets
```python
EXPORT_PRESETS = {
    "tally_essential": {
        "name": "Tally Essential",
        "description": "Minimum fields required for Tally import",
        "fields": ["date", "invoice_number", "party_name", "total_amount", "voucher_type"]
    },
    "gst_compliance": {
        "name": "GST Compliance",
        "description": "Fields required for GST filing",
        "fields": ["gstin", "invoice_number", "date", "taxable_value", "cgst_amount", "sgst_amount", "igst_amount", "total_amount"]
    },
    "quick_export": {
        "name": "Quick Export (Top 10)",
        "description": "Most important 10 fields only",
        "field_count": 10,
        "criteria": "highest_confidence"  # Take top 10 by confidence
    }
}
```

### UI Dropdown
```jsx
<select onChange={applyPreset}>
  <option>Custom Selection</option>
  <option value="tally_essential">Tally Essential (5 fields)</option>
  <option value="gst_compliance">GST Compliance (8 fields)</option>
  <option value="quick_export">Quick Export (Top 10)</option>
</select>
```

**Estimated Time**: 2-3 hours

---

## Feature 7: Bulk Field Actions

### Quick Selection Buttons
```jsx
<div className="field-actions">
  <button onClick={selectHighConfidence}>
    Select High Confidence (95%+)
  </button>
  <button onClick={selectRequiredOnly}>
    Select Required Only
  </button>
  <button onClick={selectAll}>
    Select All
  </button>
  <button onClick={deselectAll}>
    Deselect All
  </button>
</div>
```

**Estimated Time**: 1-2 hours

---

## Feature 8: Field Search/Filter

### Search Bar + Filters
```jsx
<div className="field-filters">
  <input
    type="search"
    placeholder="Search fields..."
    onChange={handleSearch}
  />

  <select onChange={filterByConfidence}>
    <option>All Fields</option>
    <option>High Confidence (95%+)</option>
    <option>Medium Confidence (90-95%)</option>
    <option>Low Confidence (<90%)</option>
  </select>

  <select onChange={filterByRequired}>
    <option>All Fields</option>
    <option>Required Only</option>
    <option>Optional Only</option>
  </select>
</div>
```

**Estimated Time**: 2-3 hours

---

## Implementation Priority

### Phase 1 (This Week) - Core UX
1. ✅ **Color-Coded Confidence** (2-3 hours) - Immediate visual feedback
2. ✅ **Validation Regex Library** (4-5 hours) - Foundation for validation
3. ✅ **Selective Field Export** (3-4 hours) - Solves client's main pain point

### Phase 2 (Next Week) - Advanced Features
4. ⏳ **Field Validation Warnings** (3-4 hours) - Auto-detect format issues
5. ⏳ **AI Re-extraction** (5-6 hours) - Fix low confidence fields
6. ⏳ **Export Presets** (2-3 hours) - Quick selection shortcuts

### Phase 3 (Week After) - Polish
7. ⏳ **Bulk Actions** (1-2 hours) - Power user features
8. ⏳ **Search/Filter** (2-3 hours) - Handle large documents

**Total Estimated Time**: 23-30 hours (3-4 working days)

---

## Database Schema Changes

### Add Validation Metadata to ExtractedField

**Migration**: `add_field_validation_metadata.py`

```python
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import JSONB

def upgrade():
    # Add validation metadata column
    op.add_column('extracted_fields',
        sa.Column('validation_metadata', JSONB, nullable=True)
    )

    # Structure:
    # {
    #   "field_type": "mobile",
    #   "is_valid": true,
    #   "validation_error": null,
    #   "auto_detected_type": true,
    #   "validated_at": "2026-01-03T10:30:00Z"
    # }
```

---

## Success Metrics

After implementation, track:

1. **Export Time Reduction**: Time to export reduced by 60% (select 10 fields vs 50)
2. **Validation Error Rate**: <5% of exports with format errors
3. **Re-extraction Success**: 80%+ of re-extracted fields improve confidence
4. **User Satisfaction**: Client feedback on "ease of use" rating

---

## Next Steps

1. **Approve plan** - Get user confirmation on priorities
2. **Start Phase 1** - Implement color coding + regex library + selective export
3. **User testing** - Test with real client data
4. **Iterate** - Refine based on feedback
5. **Phase 2** - Add advanced features

---

**End of Plan**

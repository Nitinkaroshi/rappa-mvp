"""Centralized validation patterns for Indian documents."""

import re
from typing import Dict, Optional, Tuple
from dataclasses import dataclass


@dataclass
class FieldValidator:
    pattern: str
    format_template: str
    error_message: str
    description: str

    def __post_init__(self):
        self.regex = re.compile(self.pattern)

    def validate(self, value: str) -> bool:
        if not value or not isinstance(value, str):
            return False
        return bool(self.regex.fullmatch(value.strip()))


# Indian Document Validators
VALIDATORS: Dict[str, FieldValidator] = {
    'mobile': FieldValidator(
        pattern=r'^[6-9]\d{9}$',
        format_template='{}',
        error_message='Invalid mobile number. Must be 10 digits starting with 6-9',
        description='Indian mobile number'
    ),
    'pan': FieldValidator(
        pattern=r'^[A-Z]{5}\d{4}[A-Z]$',
        format_template='{}',
        error_message='Invalid PAN. Format: ABCDE1234F',
        description='PAN card number'
    ),
    'aadhar': FieldValidator(
        pattern=r'^\d{12}$',
        format_template='{}',
        error_message='Invalid Aadhar. Must be 12 digits',
        description='Aadhar card number'
    ),
    'gstin': FieldValidator(
        pattern=r'^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d]{2}$',
        format_template='{}',
        error_message='Invalid GSTIN. Format: 29ABCDE1234F1Z5',
        description='GST identification number'
    ),
    'pincode': FieldValidator(
        pattern=r'^\d{6}$',
        format_template='{}',
        error_message='Invalid pincode. Must be 6 digits',
        description='Indian postal code'
    ),
    'email': FieldValidator(
        pattern=r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$',
        format_template='{}',
        error_message='Invalid email format',
        description='Email address'
    ),
    'ifsc': FieldValidator(
        pattern=r'^[A-Z]{4}0[A-Z0-9]{6}$',
        format_template='{}',
        error_message='Invalid IFSC. Format: SBIN0001234',
        description='IFSC code'
    ),
    'hsn': FieldValidator(
        pattern=r'^\d{6}$|^\d{8}$',
        format_template='{}',
        error_message='Invalid HSN code. Must be 6 or 8 digits',
        description='HSN/SAC code'
    ),
    'currency': FieldValidator(
        pattern=r'^\d+(\.\d{1,2})?$',
        format_template='₹ {}',
        error_message='Invalid amount. Use numbers only',
        description='Currency amount'
    ),
    'date': FieldValidator(
        pattern=r'^(0[1-9]|[12]\d|3[01])[-/](0[1-9]|1[0-2])[-/]\d{4}$',
        format_template='{}',
        error_message='Invalid date. Use DD-MM-YYYY',
        description='Date in DD-MM-YYYY format'
    ),
}


def validate_field(field_type: str, value: str) -> Tuple[bool, Optional[str]]:
    """Validate a field value against its type."""
    if not value:
        return False, "Value is empty"

    # Clean the value (remove common formatting)
    cleaned_value = str(value).strip().replace(' ', '').replace('-', '').replace('/', '').replace('₹', '').replace('Rs', '').replace(',', '')

    if field_type not in VALIDATORS:
        return True, None

    validator = VALIDATORS[field_type]
    is_valid = validator.validate(cleaned_value)
    return is_valid, None if is_valid else validator.error_message


def auto_detect_field_type(field_name: str) -> Optional[str]:
    """Auto-detect field type from field name."""
    if not field_name:
        return None

    field_name_lower = field_name.lower()

    # Mapping of keywords to field types
    keyword_map = {
        'mobile': ['mobile', 'phone', 'contact'],
        'pan': ['pan', 'pan card', 'pan number'],
        'aadhar': ['aadhar', 'aadhaar', 'uid'],
        'gstin': ['gstin', 'gst', 'gst number'],
        'pincode': ['pincode', 'pin', 'postal code', 'zip'],
        'email': ['email', 'e-mail'],
        'ifsc': ['ifsc', 'ifsc code'],
        'hsn': ['hsn', 'hsn code', 'sac'],
        'currency': ['amount', 'total', 'price', 'cost', 'fee'],
        'date': ['date', 'dated'],
    }

    for field_type, keywords in keyword_map.items():
        if any(keyword in field_name_lower for keyword in keywords):
            return field_type

    return None

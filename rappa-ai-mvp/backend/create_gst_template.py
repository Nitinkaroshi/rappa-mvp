"""Create predefined GST Invoice template in the database.

This script creates a system-wide GST Invoice template that users can
reference when processing GST-compliant invoices.
"""

import sys
sys.path.insert(0, 'E:\\rappa-mvp\\rappa-ai-mvp\\backend')

from app.core.database import db_manager
from app.models.user import User
from app.models.custom_template import CustomTemplate
from datetime import datetime
import json

# GST Invoice schema with all mandatory fields
GST_INVOICE_SCHEMA = [
    # Supplier Details
    {"name": "supplier_name", "label": "Supplier Name", "type": "text", "required": True, "description": "Legal name of the supplier"},
    {"name": "supplier_gstin", "label": "Supplier GSTIN", "type": "text", "required": True, "description": "15-digit GSTIN of supplier"},
    {"name": "supplier_address", "label": "Supplier Address", "type": "text", "required": True, "description": "Complete address of supplier"},
    {"name": "supplier_state", "label": "Supplier State", "type": "text", "required": True, "description": "State name and code"},

    # Buyer Details
    {"name": "buyer_name", "label": "Buyer Name", "type": "text", "required": True, "description": "Legal name of the buyer"},
    {"name": "buyer_gstin", "label": "Buyer GSTIN", "type": "text", "required": False, "description": "15-digit GSTIN of buyer (if registered)"},
    {"name": "buyer_address", "label": "Buyer Address", "type": "text", "required": True, "description": "Complete address of buyer"},
    {"name": "buyer_state", "label": "Buyer State", "type": "text", "required": True, "description": "State name and code"},

    # Invoice Details
    {"name": "invoice_number", "label": "Invoice Number", "type": "text", "required": True, "description": "Unique invoice number"},
    {"name": "invoice_date", "label": "Invoice Date", "type": "date", "required": True, "description": "Date of invoice (DD-MM-YYYY)"},
    {"name": "place_of_supply", "label": "Place of Supply", "type": "text", "required": True, "description": "State where goods/services supplied"},

    # Item Details
    {"name": "hsn_sac_code", "label": "HSN/SAC Code", "type": "text", "required": True, "description": "HSN code for goods or SAC for services"},
    {"name": "item_description", "label": "Item Description", "type": "text", "required": True, "description": "Description of goods/services"},
    {"name": "quantity", "label": "Quantity", "type": "number", "required": True, "description": "Quantity of items"},
    {"name": "unit", "label": "Unit", "type": "text", "required": False, "description": "Unit of measurement (Nos, Kg, etc.)"},
    {"name": "rate_per_unit", "label": "Rate per Unit", "type": "currency", "required": True, "description": "Rate per unit before tax"},

    # Tax Details
    {"name": "taxable_value", "label": "Taxable Value", "type": "currency", "required": True, "description": "Total value before tax"},
    {"name": "cgst_rate", "label": "CGST Rate %", "type": "number", "required": False, "description": "Central GST rate (for intra-state)"},
    {"name": "cgst_amount", "label": "CGST Amount", "type": "currency", "required": False, "description": "Central GST amount"},
    {"name": "sgst_rate", "label": "SGST Rate %", "type": "number", "required": False, "description": "State GST rate (for intra-state)"},
    {"name": "sgst_amount", "label": "SGST Amount", "type": "currency", "required": False, "description": "State GST amount"},
    {"name": "igst_rate", "label": "IGST Rate %", "type": "number", "required": False, "description": "Integrated GST rate (for inter-state)"},
    {"name": "igst_amount", "label": "IGST Amount", "type": "currency", "required": False, "description": "Integrated GST amount"},

    # Total
    {"name": "total_tax", "label": "Total Tax", "type": "currency", "required": True, "description": "Total GST (CGST+SGST or IGST)"},
    {"name": "invoice_total", "label": "Invoice Total", "type": "currency", "required": True, "description": "Total invoice value (Taxable + Tax)"},

    # Additional Details
    {"name": "reverse_charge", "label": "Reverse Charge", "type": "boolean", "required": False, "description": "Whether reverse charge applicable (Y/N)"},
    {"name": "irn_number", "label": "IRN Number", "type": "text", "required": False, "description": "Invoice Reference Number (e-invoice)"},
    {"name": "ack_number", "label": "Ack Number", "type": "text", "required": False, "description": "Acknowledgment number (e-invoice)"},
]

# Initialize database
db_manager.initialize()

print("Creating GST Invoice Template...")
print(f"Total fields: {len(GST_INVOICE_SCHEMA)}")

with db_manager.session_scope() as db:
    # Check if we need a system user (ID 1) for system templates
    system_user = db.query(User).filter(User.id == 1).first()

    if not system_user:
        print("[WARNING] No system user found (ID 1)")
        print("This template will be created under the first available user")
        # Use first user or create a placeholder
        first_user = db.query(User).first()

        if not first_user:
            print("[ERROR] No users in database. Please create a user first.")
            exit(1)

        user_id = first_user.id
        print(f"Using user ID: {user_id} ({first_user.email})")
    else:
        user_id = system_user.id
        print(f"Using system user ID: {user_id}")

    # Check if GST template already exists
    existing_template = db.query(CustomTemplate).filter(
        CustomTemplate.name == "GST Invoice (Standard)",
        CustomTemplate.user_id == user_id
    ).first()

    if existing_template:
        print(f"[OK] GST Invoice template already exists (ID: {existing_template.id})")
        print("Updating schema to latest version...")

        existing_template.schema = GST_INVOICE_SCHEMA
        existing_template.field_count = len(GST_INVOICE_SCHEMA)
        existing_template.updated_at = datetime.utcnow()
        existing_template.description = """Standard GST-compliant invoice template for India.

Includes all mandatory fields as per GST regulations:
- Supplier & Buyer details with GSTIN
- HSN/SAC codes
- Tax breakdown (CGST, SGST, IGST)
- E-invoice fields (IRN, Ack Number)

Use this template for:
- B2B invoices
- B2C invoices (turnover > 2.5 CR)
- Inter-state and intra-state transactions
- E-invoice compliance"""

        db.commit()
        print(f"[OK] Template updated successfully!")
    else:
        # Create new GST template
        gst_template = CustomTemplate(
            user_id=user_id,
            name="GST Invoice (Standard)",
            document_type="GST Invoice",
            description="""Standard GST-compliant invoice template for India.

Includes all mandatory fields as per GST regulations:
- Supplier & Buyer details with GSTIN
- HSN/SAC codes
- Tax breakdown (CGST, SGST, IGST)
- E-invoice fields (IRN, Ack Number)

Use this template for:
- B2B invoices
- B2C invoices (turnover > 2.5 CR)
- Inter-state and intra-state transactions
- E-invoice compliance""",
            schema=GST_INVOICE_SCHEMA,
            field_count=len(GST_INVOICE_SCHEMA)
        )

        db.add(gst_template)
        db.commit()
        db.refresh(gst_template)

        print(f"[OK] GST Invoice template created successfully!")
        print(f"Template ID: {gst_template.id}")

    print(f"\nTemplate Details:")
    print(f"Name: GST Invoice (Standard)")
    print(f"Fields: {len(GST_INVOICE_SCHEMA)}")
    print(f"Document Type: GST Invoice")
    print(f"\nKey Fields:")
    required_fields = [f for f in GST_INVOICE_SCHEMA if f['required']]
    print(f"  - Required: {len(required_fields)}")
    print(f"  - Optional: {len(GST_INVOICE_SCHEMA) - len(required_fields)}")

    print(f"\n[OK] Done! Users can now use this template for GST invoice processing.")

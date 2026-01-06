"""Create predefined Bank Statement template in the database.

This script creates a system-wide Bank Statement template that users can
use for processing bank statements and exporting to Tally.
"""

import sys
sys.path.insert(0, 'E:\\rappa-mvp\\rappa-ai-mvp\\backend')

from app.core.database import db_manager
from app.models.user import User
from app.models.custom_template import CustomTemplate
from datetime import datetime

# Bank Statement schema with all transaction fields
BANK_STATEMENT_SCHEMA = [
    # Account Details
    {"name": "account_holder_name", "label": "Account Holder Name", "type": "text", "required": True, "description": "Name of the account holder"},
    {"name": "account_number", "label": "Account Number", "type": "text", "required": True, "description": "Bank account number"},
    {"name": "bank_name", "label": "Bank Name", "type": "text", "required": True, "description": "Name of the bank"},
    {"name": "branch_name", "label": "Branch Name", "type": "text", "required": False, "description": "Branch name"},
    {"name": "ifsc_code", "label": "IFSC Code", "type": "text", "required": False, "description": "IFSC code of the branch"},

    # Statement Period
    {"name": "statement_from_date", "label": "Statement From Date", "type": "date", "required": True, "description": "Statement start date"},
    {"name": "statement_to_date", "label": "Statement To Date", "type": "date", "required": True, "description": "Statement end date"},

    # Opening/Closing Balance
    {"name": "opening_balance", "label": "Opening Balance", "type": "currency", "required": True, "description": "Opening balance at statement start"},
    {"name": "closing_balance", "label": "Closing Balance", "type": "currency", "required": True, "description": "Closing balance at statement end"},

    # Transaction Fields (repeating for each transaction)
    {"name": "transaction_date", "label": "Transaction Date", "type": "date", "required": True, "description": "Date of transaction"},
    {"name": "value_date", "label": "Value Date", "type": "date", "required": False, "description": "Value date (if different from transaction date)"},
    {"name": "transaction_description", "label": "Description/Narration", "type": "text", "required": True, "description": "Transaction description/narration"},
    {"name": "cheque_number", "label": "Cheque/Ref Number", "type": "text", "required": False, "description": "Cheque or reference number"},
    {"name": "debit_amount", "label": "Debit Amount", "type": "currency", "required": False, "description": "Amount debited (withdrawal)"},
    {"name": "credit_amount", "label": "Credit Amount", "type": "currency", "required": False, "description": "Amount credited (deposit)"},
    {"name": "balance", "label": "Balance", "type": "currency", "required": True, "description": "Balance after transaction"},

    # Transaction Categorization (for Tally export)
    {"name": "transaction_type", "label": "Transaction Type", "type": "text", "required": False, "description": "Payment/Receipt/Transfer"},
    {"name": "category", "label": "Category", "type": "text", "required": False, "description": "Transaction category (Salary, Rent, etc.)"},
    {"name": "party_name", "label": "Party Name", "type": "text", "required": False, "description": "Name of payee/payer"},
]

# Initialize database
db_manager.initialize()

print("Creating Bank Statement Template...")
print(f"Total fields: {len(BANK_STATEMENT_SCHEMA)}")

with db_manager.session_scope() as db:
    # Use system user (ID 1) for system templates
    system_user = db.query(User).filter(User.id == 1).first()

    if not system_user:
        print("[WARNING] No system user found (ID 1)")
        first_user = db.query(User).first()
        if not first_user:
            print("[ERROR] No users in database. Please create a user first.")
            exit(1)
        user_id = first_user.id
        print(f"Using user ID: {user_id} ({first_user.email})")
    else:
        user_id = system_user.id
        print(f"Using system user ID: {user_id}")

    # Check if Bank Statement template already exists
    existing_template = db.query(CustomTemplate).filter(
        CustomTemplate.name == "Bank Statement (Standard)",
        CustomTemplate.user_id == user_id
    ).first()

    if existing_template:
        print(f"[OK] Bank Statement template already exists (ID: {existing_template.id})")
        print("Updating schema to latest version...")

        existing_template.schema = BANK_STATEMENT_SCHEMA
        existing_template.field_count = len(BANK_STATEMENT_SCHEMA)
        existing_template.updated_at = datetime.utcnow()
        existing_template.description = """Standard bank statement template for India.

Extracts all transaction details from bank statements:
- Account details (Account number, IFSC, Bank name)
- Statement period and balances
- Transaction-level details (Date, Description, Debit, Credit, Balance)
- Categorization fields for Tally import

Supports:
- PDF bank statements from major Indian banks
- Transaction categorization
- Direct Tally export with proper voucher types"""

        db.commit()
        print("[OK] Template updated successfully!")
    else:
        # Create new Bank Statement template
        bank_template = CustomTemplate(
            user_id=user_id,
            name="Bank Statement (Standard)",
            document_type="Bank Statement",
            description="""Standard bank statement template for India.

Extracts all transaction details from bank statements:
- Account details (Account number, IFSC, Bank name)
- Statement period and balances
- Transaction-level details (Date, Description, Debit, Credit, Balance)
- Categorization fields for Tally import

Supports:
- PDF bank statements from major Indian banks
- Transaction categorization
- Direct Tally export with proper voucher types""",
            schema=BANK_STATEMENT_SCHEMA,
            field_count=len(BANK_STATEMENT_SCHEMA)
        )

        db.add(bank_template)
        db.commit()
        db.refresh(bank_template)

        print("[OK] Bank Statement template created successfully!")
        print(f"Template ID: {bank_template.id}")

    print("\nTemplate Details:")
    print("Name: Bank Statement (Standard)")
    print(f"Fields: {len(BANK_STATEMENT_SCHEMA)}")
    print("Document Type: Bank Statement")
    print("\nKey Fields:")
    required_fields = [f for f in BANK_STATEMENT_SCHEMA if f['required']]
    print(f"  - Required: {len(required_fields)}")
    print(f"  - Optional: {len(BANK_STATEMENT_SCHEMA) - len(required_fields)}")

    print("\n[OK] Done! Users can now use this template for bank statement processing.")

# Custom Template Schema Architecture

## Problem Statement
Current system has these issues:
1. Schema validation fails when only partial fields are selected
2. No persistent schema storage per template
3. Extracted data stored generically without template-specific structure
4. Schema not reused when same template is used again
5. No dynamic table creation for custom templates

## Proposed Solution

### 1. Database Structure

#### Templates Table (Existing - Enhanced)
```sql
custom_templates:
  - id
  - user_id
  - name (template name like "Invoice Template A")
  - document_type
  - description
  - schema (JSON - full schema definition)
  - table_name (NEW - e.g., "template_invoice_123")
  - field_count
  - created_at
  - updated_at
```

#### Dynamic Template Data Tables (NEW)
For each custom template, create a table like:
```sql
template_{document_type}_{template_id}:
  - id
  - job_id (FK to processing_jobs)
  - user_id (FK to users)
  - <dynamic_field_1>
  - <dynamic_field_2>
  - ...
  - confidence_score
  - created_at
```

### 2. Workflow

#### A. Template Creation Flow:
1. User uploads sample document
2. AI generates schema (all possible fields)
3. **User selects only required fields** (e.g., 5 out of 15 fields)
4. System validates ONLY selected fields
5. System creates:
   - Template record with full schema
   - Dynamic table with only selected fields
   - Saves table_name in template record

#### B. Document Processing Flow:
1. User selects existing template
2. System reads template schema from DB
3. System creates processing job
4. AI extracts data for ONLY fields in template schema
5. System saves extracted data to template-specific table
6. Results linked via job_id

#### C. Schema Reuse Flow:
1. User uploads new document
2. System shows available templates
3. User selects template
4. System uses saved schema (no re-generation needed)
5. AI extracts based on existing schema
6. Data saved to same template table

### 3. Implementation Changes

#### Backend Changes:

**A. Custom Template Model:**
- Add `table_name` field
- Add `selected_fields` JSON field (subset of schema)

**B. Schema Validation Service:**
- Update `validate_schema_against_document()`:
  - Accept `selected_fields_only` parameter
  - Only validate fields that are selected
  - Return validation only for selected fields

**C. Dynamic Table Service (NEW):**
```python
class DynamicTableService:
    def create_template_table(template_id, schema_fields)
    def insert_extraction_result(table_name, data)
    def query_template_data(template_id, filters)
```

**D. Processing Service:**
- Update extraction to use template schema
- Save to template-specific table instead of generic storage

#### Frontend Changes:

**A. CreateCustomTemplate.jsx:**
- Add checkbox for each generated field
- Show "Selected: X/Y fields"
- Validate only selected fields
- Send only selected fields to backend

**B. Template Selection:**
- Show saved templates with field preview
- Allow template reuse
- Show data extracted using each template

### 4. Benefits

1. ✅ **Selective Validation**: Only validate what user needs
2. ✅ **Schema Reuse**: Templates can be reused across documents
3. ✅ **Structured Storage**: Each template has dedicated table
4. ✅ **Better Performance**: Query specific template data efficiently
5. ✅ **Flexibility**: Users control which fields to extract
6. ✅ **Scalability**: Each template isolated in own table

### 5. Migration Path

**Phase 1** (Immediate):
- Fix schema validation to handle partial fields
- Add field selection UI
- Validate only selected fields

**Phase 2** (Next):
- Add dynamic table creation
- Migrate existing templates to new structure

**Phase 3** (Future):
- Template marketplace
- Template sharing between users
- Template versioning

## Example Flow

### User Creates "Invoice Template A":
1. Upload invoice sample
2. AI suggests: invoice_number, date, vendor, amount, tax, line_items, etc.
3. **User selects only**: invoice_number, date, vendor, amount
4. System validates these 4 fields only
5. Creates `template_invoice_42` table with these 4 columns
6. Saves template with selected_fields = [invoice_number, date, vendor, amount]

### User Processes 100 Invoices:
1. Selects "Invoice Template A"
2. AI extracts ONLY: invoice_number, date, vendor, amount
3. All 100 results saved to `template_invoice_42` table
4. Easy to query: "SELECT * FROM template_invoice_42 WHERE amount > 1000"

### User Processes Another Invoice:
1. Selects "Invoice Template A" (reuse)
2. No schema generation needed
3. Extracts same 4 fields
4. Saves to same table
5. Consistent data structure

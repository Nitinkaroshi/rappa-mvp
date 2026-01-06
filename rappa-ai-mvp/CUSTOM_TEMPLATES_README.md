# Custom Templates & Batch Processing

This document explains the custom template and batch processing system that allows users to create reusable templates for document extraction and process multiple documents at once.

## Overview

The system consists of two main features:

1. **Custom Templates**: User-defined document schemas with AI-assisted field extraction
2. **Batch Processing**: Process multiple documents using a custom template

## Features

### Custom Templates

- **AI-Powered Schema Generation**: Upload a sample document and AI (Gemini) suggests fields to extract
- **Manual Schema Editing**: Verify, modify, add, or remove fields
- **Drag-and-Drop Field Reordering**: Rearrange fields in your preferred order
- **Schema Validation**: Validate your schema against the sample document before saving
- **Template Management**: Create, view, update, and delete templates

### Batch Processing

- **Bulk Document Processing**: Process up to 100 documents in a single batch
- **Template-Based Extraction**: Use custom templates for consistent extraction
- **Batch Limits**: Maximum 5 active batches per user
- **30-Day Auto-Expiration**: Batches are automatically deleted after 30 days
- **Export Formats**: Download results as CSV or Excel
- **Field Order Preservation**: Exported data maintains your custom field order

## Architecture

### Database Models

#### CustomTemplate
```python
- id: Primary key
- user_id: Owner user ID
- name: Template name
- document_type: Type of document (e.g., "Invoice", "Receipt")
- description: Optional description
- schema: JSONB column storing field definitions
  [
    {
      "name": "field_name",
      "label": "Field Label",
      "type": "text|number|date|email|phone|currency|boolean",
      "required": true|false,
      "description": "Field description"
    }
  ]
- sample_image_path: S3 path to sample document
- field_count: Number of fields in schema
- created_at, updated_at: Timestamps
```

#### Batch
```python
- id: Primary key
- user_id: Owner user ID
- custom_template_id: Template used for processing
- name: Batch name
- description: Optional description
- document_count: Number of documents in batch
- results: JSONB column storing extraction results
  [
    {
      "filename": "doc1.pdf",
      "s3_path": "batches/123/doc1.pdf",
      "data": {"field1": "value1", "field2": "value2"},
      "processed_at": "2025-12-29T10:00:00Z",
      "status": "success|failed",
      "error": "error message (if failed)"
    }
  ]
- status: "pending|processing|completed|failed"
- created_at: Creation timestamp
- expires_at: Auto-delete timestamp (created_at + 30 days)
```

## API Endpoints

### Custom Templates

```
POST   /api/v1/custom-templates/generate-schema
  - Generate schema from sample document using AI
  - Request: multipart/form-data (file, document_type, user_instructions)
  - Response: { schema: [...], field_count: N }

POST   /api/v1/custom-templates/validate-schema
  - Validate modified schema against sample document
  - Request: multipart/form-data (schema, file)
  - Response: { valid: bool, extracted_data: {...}, warnings: [...], coverage: % }

POST   /api/v1/custom-templates
  - Create new template
  - Request: multipart/form-data (name, document_type, description, schema, sample_image)

GET    /api/v1/custom-templates
  - List user's templates

GET    /api/v1/custom-templates/{id}
  - Get template details

PATCH  /api/v1/custom-templates/{id}
  - Update template

DELETE /api/v1/custom-templates/{id}
  - Delete template (checks for active batches)
```

### Batches

```
GET    /api/v1/batches/stats
  - Get batch statistics (total, active, completed, expired, slots available)

POST   /api/v1/batches
  - Create and process new batch
  - Request: multipart/form-data (custom_template_id, name, description, files[])
  - Enforces: max 5 active batches, max 100 documents per batch

GET    /api/v1/batches
  - List batches (with optional filters)
  - Query params: status_filter, include_expired

GET    /api/v1/batches/{id}
  - Get batch details with results

DELETE /api/v1/batches/{id}
  - Delete batch

GET    /api/v1/batches/{id}/download/csv
  - Download batch results as CSV

GET    /api/v1/batches/{id}/download/excel
  - Download batch results as Excel

POST   /api/v1/batches/cleanup-expired
  - Manual cleanup endpoint (for scheduled tasks)
```

## Frontend Pages

### Custom Templates (`/custom-templates`)
- View all templates
- Create new template
- Edit/delete templates
- Navigate to batch creation with selected template

### Create Custom Template (`/custom-templates/create`)
1. **Template Information**: Name, document type, description
2. **Upload Sample**: Upload sample document (JPG, PNG, PDF)
3. **Generate Schema**: AI analyzes document and suggests fields
4. **Edit Schema**: Modify, reorder, add, or remove fields
5. **Validate Schema**: Test schema against sample document
6. **Save Template**: Store for future use

### Batches (`/batches`)
- View all batches (active and expired)
- Batch statistics (slots available, expiration warnings)
- Download results (CSV/Excel)
- Delete batches
- Create new batch

### Create Batch (`/batches/create`)
1. **Select Template**: Choose from available templates
2. **Batch Information**: Name and description
3. **Upload Documents**: Drag and drop up to 100 documents
4. **Process**: Submit batch for processing

## Usage Flow

### Creating a Custom Template

1. Navigate to **Custom Templates** → **Create Template**
2. Enter template name (e.g., "Property Sale Deed")
3. Enter document type (e.g., "Sale Deed")
4. Upload a sample document
5. Click **Generate Schema with AI**
6. Review AI-suggested fields
7. Edit field names, labels, types, and requirements
8. Drag fields to reorder them
9. Add custom fields if needed
10. Click **Validate Schema** to test
11. Click **Save Template**

### Processing a Batch

1. Navigate to **Batches** → **Create Batch**
2. Select a template from your saved templates
3. Enter batch name (e.g., "Q4 2024 Property Deeds")
4. Upload multiple documents (up to 100)
5. Click **Process Batch**
6. Wait for processing to complete
7. Download results as CSV or Excel

### Managing Batches

- **Active Batches**: View in Batches page
- **Download Results**: CSV or Excel format
- **Expiration Warnings**: Shows when batch expires in <7 days
- **Delete Batches**: Free up slots for new batches
- **Automatic Cleanup**: Batches auto-delete after 30 days

## Scheduled Task: Auto-Cleanup

### Setup

The cleanup script should run daily to remove expired batches:

```bash
# Create logs directory
mkdir -p /path/to/backend/logs

# Add to crontab (run daily at 2 AM)
0 2 * * * cd /path/to/backend && /path/to/.venv/bin/python scripts/cleanup_expired_batches.py
```

### Manual Cleanup

```bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
python scripts/cleanup_expired_batches.py
```

### Logs

Check cleanup logs at: `backend/logs/batch_cleanup.log`

## Configuration

### Backend

- `MAX_BATCHES_PER_USER = 5` in `app/api/batches.py`
- `MAX_DOCUMENTS_PER_BATCH = 100` in `app/api/batches.py`
- Batch expiration: 30 days (set in `Batch` model default)

### Frontend

No configuration needed - reads limits from API responses.

## Database Migration

The feature uses Alembic migration `006_add_custom_templates_and_batches.py`

```bash
# Run migration
cd backend
alembic upgrade head
```

## Technical Details

### Schema Storage

Both templates and batch results use PostgreSQL JSONB columns for flexible schema storage while maintaining relational integrity for users and relationships.

### AI Integration

- **Schema Generation**: `SchemaGenerationService` uses Gemini Vision API
- **Batch Processing**: `GeminiService.extract_with_schema()` extracts data based on template
- **Validation**: AI validates schema against sample document

### File Storage

- Sample documents: `s3://bucket/templates/{user_id}/{filename}`
- Batch documents: `s3://bucket/batches/{batch_id}/{filename}`

### Drag and Drop

Uses `@hello-pangea/dnd` library for field reordering in template creation.

## User Limits

| Limit | Value | Reason |
|-------|-------|--------|
| Active batches | 5 | Prevent resource abuse |
| Documents per batch | 100 | Processing performance |
| Batch lifespan | 30 days | Storage management |

## Error Handling

### Template Creation
- Invalid file types rejected
- Schema validation before save
- Prevents template deletion if used in active batches

### Batch Processing
- File type validation
- Batch limit enforcement
- Document count validation
- Graceful handling of individual document failures

## Future Enhancements

- [ ] Batch processing progress tracking (WebSocket/polling)
- [ ] Email notifications when batch completes
- [ ] Batch scheduling (process at specific time)
- [ ] Template sharing between users
- [ ] Advanced field types (multi-select, arrays)
- [ ] Custom validation rules per field
- [ ] Batch analytics and insights
- [ ] Template versioning

## Troubleshooting

### "Maximum batch limit reached"
- Delete completed batches to free up slots
- Wait for batches to expire (check expiration dates)

### "Template has active batches" (on delete)
- Complete or delete batches using this template first
- Or wait for batches to expire

### Schema validation fails
- Check that field names match document content
- Simplify schema if too complex
- Try regenerating schema from sample

### Batch processing slow
- Reduce number of documents
- Check Gemini API rate limits
- Monitor backend logs for errors

## Support

For issues or questions:
- Check logs: `backend/logs/`
- Review API responses for error details
- Contact: support@rappa.ai

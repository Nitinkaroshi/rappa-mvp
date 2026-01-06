# rappa.ai Backend

FastAPI backend for document processing.

## Setup
```bash
# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Setup environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
psql -U postgres -d rappa_db -f schema.sql

# Start development server
uvicorn app.main:app --reload --port 8000
```

## Project Structure

- `app/api/` - API endpoints
- `app/core/` - Core functionality (auth, database)
- `app/models/` - Database models
- `app/services/` - Business logic services
- `app/workers/` - Celery background tasks
- `app/utils/` - Utility functions
- `tests/` - Test files

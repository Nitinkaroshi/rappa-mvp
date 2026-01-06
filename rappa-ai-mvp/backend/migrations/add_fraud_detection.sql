-- Migration: Add fraud detection columns to jobs table
-- Date: 2025-12-28
-- Description: Adds file_hash and fraud_analysis columns for fraud detection

-- Add file_hash column for duplicate detection
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS file_hash VARCHAR(64);

-- Add index on file_hash for fast lookup
CREATE INDEX IF NOT EXISTS idx_jobs_file_hash ON jobs(file_hash);

-- Add fraud_analysis column to store JSON fraud detection results
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS fraud_analysis JSON;

-- Comment on columns
COMMENT ON COLUMN jobs.file_hash IS 'SHA-256 hash of the file for duplicate detection';
COMMENT ON COLUMN jobs.fraud_analysis IS 'JSON object containing fraud detection analysis results';

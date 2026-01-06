#!/bin/bash

###############################################################################
# PostgreSQL Database Backup Script for Rappa.AI
# 
# This script creates automated backups of the PostgreSQL database with:
# - Timestamped backup files
# - Automatic compression
# - Retention policy (keeps last 30 days)
# - Optional cloud upload
# - Error logging
###############################################################################

# Configuration
DB_NAME="${DB_NAME:-rappa_db}"
DB_USER="${DB_USER:-postgres}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"

# Backup directory
BACKUP_DIR="${BACKUP_DIR:-/var/backups/rappa-db}"
LOG_FILE="${BACKUP_DIR}/backup.log"

# Retention (days)
RETENTION_DAYS=30

# Cloud storage (optional)
ENABLE_CLOUD_UPLOAD="${ENABLE_CLOUD_UPLOAD:-false}"
S3_BUCKET="${S3_BUCKET:-}"
S3_PREFIX="${S3_PREFIX:-backups/database}"

###############################################################################
# Functions
###############################################################################

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Perform database backup
backup_database() {
    local timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="${BACKUP_DIR}/rappa_db_${timestamp}.sql"
    local compressed_file="${backup_file}.gz"
    
    log "Starting database backup..."
    log "Database: $DB_NAME"
    log "Backup file: $compressed_file"
    
    # Create backup using pg_dump
    if PGPASSWORD="$DB_PASSWORD" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -F p \
        -f "$backup_file"; then
        
        log "Database dump created successfully"
        
        # Compress the backup
        if gzip "$backup_file"; then
            log "Backup compressed successfully"
            log "Final backup: $compressed_file"
            log "Size: $(du -h "$compressed_file" | cut -f1)"
            
            echo "$compressed_file"
            return 0
        else
            error "Failed to compress backup"
            return 1
        fi
    else
        error "Failed to create database dump"
        return 1
    fi
}

# Upload to cloud storage (optional)
upload_to_cloud() {
    local backup_file="$1"
    
    if [ "$ENABLE_CLOUD_UPLOAD" = "true" ] && [ -n "$S3_BUCKET" ]; then
        log "Uploading backup to S3..."
        
        local filename=$(basename "$backup_file")
        local s3_path="s3://${S3_BUCKET}/${S3_PREFIX}/${filename}"
        
        if aws s3 cp "$backup_file" "$s3_path"; then
            log "Backup uploaded to: $s3_path"
            return 0
        else
            error "Failed to upload backup to S3"
            return 1
        fi
    else
        log "Cloud upload disabled or not configured"
        return 0
    fi
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."
    
    local deleted_count=0
    
    # Find and delete old backups
    while IFS= read -r -d '' file; do
        rm -f "$file"
        log "Deleted old backup: $(basename "$file")"
        ((deleted_count++))
    done < <(find "$BACKUP_DIR" -name "rappa_db_*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)
    
    if [ $deleted_count -gt 0 ]; then
        log "Deleted $deleted_count old backup(s)"
    else
        log "No old backups to delete"
    fi
}

# Verify backup integrity
verify_backup() {
    local backup_file="$1"
    
    log "Verifying backup integrity..."
    
    if gzip -t "$backup_file" 2>/dev/null; then
        log "Backup integrity verified successfully"
        return 0
    else
        error "Backup integrity check failed!"
        return 1
    fi
}

# Send notification (optional)
send_notification() {
    local status="$1"
    local message="$2"
    
    # You can add email/Slack/Discord notifications here
    # Example: curl -X POST https://hooks.slack.com/... -d "{\"text\":\"$message\"}"
    
    log "Notification: $message"
}

###############################################################################
# Main execution
###############################################################################

main() {
    log "=========================================="
    log "Starting Rappa.AI Database Backup"
    log "=========================================="
    
    # Create backup directory
    create_backup_dir
    
    # Perform backup
    if backup_file=$(backup_database); then
        # Verify backup
        if verify_backup "$backup_file"; then
            # Upload to cloud (if enabled)
            upload_to_cloud "$backup_file"
            
            # Cleanup old backups
            cleanup_old_backups
            
            log "=========================================="
            log "Backup completed successfully!"
            log "=========================================="
            
            send_notification "success" "Database backup completed successfully"
            exit 0
        else
            error "Backup verification failed!"
            send_notification "error" "Database backup verification failed"
            exit 1
        fi
    else
        error "Backup failed!"
        send_notification "error" "Database backup failed"
        exit 1
    fi
}

# Run main function
main

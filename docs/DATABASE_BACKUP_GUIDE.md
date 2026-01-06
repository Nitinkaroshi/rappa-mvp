# 📦 Database Backup Guide

## Overview

Automated database backup system for Rappa.AI with:
- ✅ Daily automated backups
- ✅ 30-day retention policy
- ✅ Compression (gzip)
- ✅ Optional cloud upload (S3)
- ✅ Integrity verification
- ✅ Error logging

---

## 🚀 Quick Start

### Windows

1. **Configure Database Password:**
   ```
   Create file: %APPDATA%\postgresql\pgpass.conf
   Add line: localhost:5432:rappa_db:postgres:your_password
   ```

2. **Run Manual Backup:**
   ```bash
   cd E:\rappa-mvp\scripts
   backup_db.bat
   ```

3. **Schedule Daily Backups:**
   - Open Task Scheduler
   - Create new task
   - Trigger: Daily at 2:00 AM
   - Action: Run `E:\rappa-mvp\scripts\backup_db.bat`

### Linux/Mac

1. **Make Script Executable:**
   ```bash
   chmod +x scripts/backup_db.sh
   ```

2. **Configure Environment:**
   ```bash
   cp scripts/.env.backup.example scripts/.env.backup
   nano scripts/.env.backup  # Edit with your values
   ```

3. **Run Manual Backup:**
   ```bash
   source scripts/.env.backup
   ./scripts/backup_db.sh
   ```

4. **Schedule with Cron:**
   ```bash
   crontab -e
   # Add this line for daily backups at 2 AM:
   0 2 * * * cd /path/to/rappa-mvp && source scripts/.env.backup && ./scripts/backup_db.sh
   ```

---

## 📁 Backup Location

**Windows:** `E:\rappa-mvp\backups\database\`  
**Linux:** `/var/backups/rappa-db/`

**Filename Format:** `rappa_db_YYYYMMDD_HHMMSS.sql.gz`

**Example:** `rappa_db_20260102_020000.sql.gz`

---

## 🔄 Restore from Backup

### Decompress Backup
```bash
# Windows (with 7-Zip)
7z x rappa_db_20260102_020000.sql.gz

# Linux/Mac
gunzip rappa_db_20260102_020000.sql.gz
```

### Restore Database
```bash
# Drop existing database (CAREFUL!)
psql -U postgres -c "DROP DATABASE IF EXISTS rappa_db;"

# Create fresh database
psql -U postgres -c "CREATE DATABASE rappa_db;"

# Restore from backup
psql -U postgres -d rappa_db -f rappa_db_20260102_020000.sql
```

### Verify Restoration
```bash
psql -U postgres -d rappa_db -c "SELECT COUNT(*) FROM users;"
```

---

## ☁️ Cloud Upload (Optional)

### AWS S3 Setup

1. **Install AWS CLI:**
   ```bash
   # Windows
   msiexec.exe /i https://awscli.amazonaws.com/AWSCLIV2.msi
   
   # Linux
   curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
   unzip awscliv2.zip
   sudo ./aws/install
   ```

2. **Configure AWS Credentials:**
   ```bash
   aws configure
   # Enter: Access Key, Secret Key, Region
   ```

3. **Enable in Configuration:**
   ```bash
   # In .env.backup
   ENABLE_CLOUD_UPLOAD=true
   S3_BUCKET=your-bucket-name
   S3_PREFIX=backups/database
   ```

### Backblaze B2 Setup

1. **Install B2 CLI:**
   ```bash
   pip install b2
   ```

2. **Authorize:**
   ```bash
   b2 authorize-account <keyID> <applicationKey>
   ```

3. **Modify Script:**
   Replace `aws s3 cp` with:
   ```bash
   b2 upload-file <bucketName> "$backup_file" "backups/database/$(basename "$backup_file")"
   ```

---

## 📊 Monitoring

### Check Backup Logs
```bash
# Windows
type E:\rappa-mvp\backups\database\backup.log

# Linux
tail -f /var/backups/rappa-db/backup.log
```

### List All Backups
```bash
# Windows
dir E:\rappa-mvp\backups\database\*.gz

# Linux
ls -lh /var/backups/rappa-db/*.gz
```

### Check Backup Size
```bash
# Windows
dir E:\rappa-mvp\backups\database\*.gz | find "bytes"

# Linux
du -sh /var/backups/rappa-db/*.gz
```

---

## 🔔 Notifications (Optional)

### Slack Notifications

Add to script after successful backup:
```bash
curl -X POST "$SLACK_WEBHOOK_URL" \
  -H 'Content-Type: application/json' \
  -d "{\"text\":\"✅ Database backup completed: $(basename $backup_file)\"}"
```

### Email Notifications

Using `sendmail`:
```bash
echo "Database backup completed successfully" | \
  mail -s "Rappa.AI Backup Success" "$EMAIL_TO"
```

---

## 🛡️ Security Best Practices

1. **Encrypt Backups:**
   ```bash
   # Encrypt with GPG
   gpg --encrypt --recipient your@email.com backup.sql.gz
   ```

2. **Secure Password Storage:**
   - Use `.pgpass` file (Linux/Mac)
   - Use `pgpass.conf` (Windows)
   - Never commit passwords to git

3. **Restrict Backup Directory:**
   ```bash
   chmod 700 /var/backups/rappa-db
   ```

4. **Test Restores Regularly:**
   - Monthly restore test recommended
   - Verify data integrity
   - Document restore time

---

## 📝 Retention Policy

**Default:** 30 days

**Modify Retention:**
```bash
# In backup script
RETENTION_DAYS=60  # Keep for 60 days
```

**Custom Retention Strategy:**
- Daily backups: 7 days
- Weekly backups: 4 weeks
- Monthly backups: 12 months

---

## 🚨 Troubleshooting

### "pg_dump: command not found"
```bash
# Add PostgreSQL to PATH
# Windows: C:\Program Files\PostgreSQL\15\bin
# Linux: /usr/bin or /usr/local/bin
```

### "Permission denied"
```bash
# Make script executable
chmod +x backup_db.sh

# Check directory permissions
ls -la /var/backups
```

### "Authentication failed"
```bash
# Check .pgpass file
cat ~/.pgpass
# Format: hostname:port:database:username:password

# Set correct permissions
chmod 600 ~/.pgpass
```

### "Disk space full"
```bash
# Check disk space
df -h

# Clean old backups manually
find /var/backups/rappa-db -name "*.gz" -mtime +30 -delete
```

---

## 📈 Backup Statistics

**Typical Backup Size:**
- Small database (< 1000 records): ~100 KB
- Medium database (< 100K records): ~10 MB
- Large database (< 1M records): ~100 MB

**Compression Ratio:** ~70-80% reduction

**Backup Time:**
- Small: < 1 second
- Medium: 5-10 seconds
- Large: 30-60 seconds

---

## ✅ Verification Checklist

- [ ] Backup script runs successfully
- [ ] Backups are created in correct location
- [ ] Backups are compressed
- [ ] Old backups are cleaned up
- [ ] Logs are being written
- [ ] Can restore from backup
- [ ] Scheduled task is configured
- [ ] Cloud upload working (if enabled)
- [ ] Notifications working (if enabled)

---

## 🔗 Related Documentation

- [PostgreSQL Backup Documentation](https://www.postgresql.org/docs/current/backup.html)
- [AWS S3 CLI Reference](https://docs.aws.amazon.com/cli/latest/reference/s3/)
- [Cron Syntax Guide](https://crontab.guru/)

---

**Questions? Issues? Check the logs or contact support!** 🚀

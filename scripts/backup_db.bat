@echo off
REM ============================================================================
REM PostgreSQL Database Backup Script for Windows
REM Rappa.AI - Automated Database Backup
REM ============================================================================

setlocal enabledelayedexpansion

REM Configuration
set DB_NAME=rappa_db
set DB_USER=postgres
set DB_HOST=localhost
set DB_PORT=5432
set BACKUP_DIR=E:\rappa-mvp\backups\database
set RETENTION_DAYS=30

REM Create timestamp
for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set datetime=%%I
set TIMESTAMP=%datetime:~0,8%_%datetime:~8,6%

REM Create backup directory if it doesn't exist
if not exist "%BACKUP_DIR%" (
    mkdir "%BACKUP_DIR%"
    echo Created backup directory: %BACKUP_DIR%
)

REM Log file
set LOG_FILE=%BACKUP_DIR%\backup.log
echo [%date% %time%] Starting database backup... >> "%LOG_FILE%"

REM Backup filename
set BACKUP_FILE=%BACKUP_DIR%\rappa_db_%TIMESTAMP%.sql

REM Perform backup
echo Creating database backup...
echo Database: %DB_NAME%
echo Backup file: %BACKUP_FILE%

REM Set PostgreSQL password (use .pgpass file in production)
REM For Windows: %APPDATA%\postgresql\pgpass.conf
REM Format: hostname:port:database:username:password

pg_dump -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -F p -f "%BACKUP_FILE%"

if %ERRORLEVEL% EQU 0 (
    echo [%date% %time%] Backup created successfully >> "%LOG_FILE%"
    echo Backup created successfully!
    
    REM Compress backup using 7-Zip (if available)
    where 7z >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Compressing backup...
        7z a -tgzip "%BACKUP_FILE%.gz" "%BACKUP_FILE%" -sdel
        echo [%date% %time%] Backup compressed: %BACKUP_FILE%.gz >> "%LOG_FILE%"
        echo Backup compressed: %BACKUP_FILE%.gz
    ) else (
        echo 7-Zip not found. Backup not compressed.
        echo [%date% %time%] Backup saved: %BACKUP_FILE% >> "%LOG_FILE%"
    )
    
    REM Clean up old backups
    echo Cleaning up old backups...
    forfiles /P "%BACKUP_DIR%" /M rappa_db_*.sql* /D -%RETENTION_DAYS% /C "cmd /c del @path" 2>nul
    echo [%date% %time%] Old backups cleaned up >> "%LOG_FILE%"
    
    echo ==========================================
    echo Backup completed successfully!
    echo ==========================================
    echo [%date% %time%] Backup completed successfully >> "%LOG_FILE%"
    
) else (
    echo [%date% %time%] ERROR: Backup failed! >> "%LOG_FILE%"
    echo ERROR: Backup failed!
    exit /b 1
)

endlocal

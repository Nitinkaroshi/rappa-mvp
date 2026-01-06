/**
 * PM2 Ecosystem Configuration for Rappa.AI Backend
 *
 * This configuration enables:
 * - Auto-restart on crash
 * - Auto-restart on file changes (watch mode in development)
 * - Memory limit monitoring
 * - Log management
 * - Cluster mode for production
 *
 * Installation:
 * npm install -g pm2
 *
 * Usage:
 * pm2 start ecosystem.config.js --env development
 * pm2 start ecosystem.config.js --env production
 *
 * Management:
 * pm2 status           - View status
 * pm2 logs rappa-api   - View logs
 * pm2 restart rappa-api - Restart app
 * pm2 stop rappa-api   - Stop app
 * pm2 delete rappa-api - Remove from PM2
 */

module.exports = {
  apps: [
    // ========================================================================
    // Redis (WSL)
    // ========================================================================
    {
      name: 'rappa-redis',
      script: 'wsl',
      args: '-e bash -c "redis-server --bind 0.0.0.0 --protected-mode no --daemonize no"',
      interpreter: 'none',
      autorestart: true,
      env_common: {
        // No special env needed
      },
    },

    // ========================================================================
    // FastAPI Backend Server
    // ========================================================================
    {
      // Application name
      name: 'rappa-api',

      // Script to execute
      script: 'E:/rappa-mvp/.venv/Scripts/python.exe',

      // Arguments passed to the script
      args: '-m uvicorn app.main:app --host 0.0.0.0 --port 8001',

      // Current working directory
      cwd: 'E:/rappa-mvp/rappa-ai-mvp/backend',

      // Interpreter (none for Python, we're using direct python executable)
      interpreter: 'none',

      // Environment variables for all environments
      env_common: {
        NODE_ENV: 'development',
        PYTHONUNBUFFERED: '1',
        // Redis on WSL IP (matches .env configuration)
        REDIS_URL: 'redis://192.168.155.5:6379/0',
        CELERY_BROKER_URL: 'redis://192.168.155.5:6379/0',
        CELERY_RESULT_BACKEND: 'redis://192.168.155.5:6379/0',
      },

      // Development environment variables
      env_development: {
        ENVIRONMENT: 'development',
        DEBUG: 'true',
      },

      // Production environment variables
      env_production: {
        ENVIRONMENT: 'production',
        DEBUG: 'false',
      },

      // Auto-restart settings
      autorestart: true,           // Auto-restart on crash
      max_restarts: 10,            // Max restarts within min_uptime before marking as errored
      min_uptime: '10s',           // Minimum uptime before considering app as stable
      max_memory_restart: '1G',    // Restart if memory usage exceeds 1GB

      // Watch for file changes (development only)
      watch: false,                // Set to true for auto-restart on file changes in dev
      watch_delay: 1000,           // Delay before restarting after file change (ms)
      ignore_watch: [
        'node_modules',
        'logs',
        '.git',
        '*.log',
        '__pycache__',
        '*.pyc',
        '.pytest_cache',
        '.venv',
      ],

      // Logging
      error_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/pm2-error.log',
      out_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/pm2-out.log',
      log_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/pm2-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,            // Merge logs from all instances

      // Execution mode
      instances: 1,                // Number of instances (1 for development, 'max' for production)
      exec_mode: 'fork',           // 'fork' or 'cluster' (cluster for Node.js only, use fork for Python)

      // Restart strategies
      wait_ready: false,           // Wait for process to send 'ready' signal
      listen_timeout: 10000,       // Time to wait for app to listen (ms)
      kill_timeout: 5000,          // Time to wait before force killing (ms)

      // Advanced options
      restart_delay: 4000,         // Delay before restarting crashed app (ms)
      shutdown_with_message: false,
    },

    // ========================================================================
    // Celery Worker for Background Tasks
    // ========================================================================
    {
      // Application name
      name: 'rappa-celery',

      // Script to execute
      script: 'E:/rappa-mvp/.venv/Scripts/celery.exe',

      // Arguments passed to the script
      args: '-A app.workers.tasks worker --loglevel=info --pool=solo',

      // Current working directory
      cwd: 'E:/rappa-mvp/rappa-ai-mvp/backend',

      // Interpreter (none for direct executable)
      interpreter: 'none',

      // Environment variables
      env_common: {
        PYTHONUNBUFFERED: '1',
        // Redis on WSL IP (matches .env configuration)
        REDIS_URL: 'redis://192.168.155.5:6379/0',
        CELERY_BROKER_URL: 'redis://192.168.155.5:6379/0',
        CELERY_RESULT_BACKEND: 'redis://192.168.155.5:6379/0',
      },

      env_development: {
        ENVIRONMENT: 'development',
      },

      env_production: {
        ENVIRONMENT: 'production',
      },

      // Auto-restart settings
      autorestart: true,           // Auto-restart on crash
      max_restarts: 10,            // Max restarts within min_uptime
      min_uptime: '10s',           // Minimum uptime before considering stable
      max_memory_restart: '1G',    // Restart if memory exceeds 1GB

      // Watch for file changes (disabled for Celery)
      watch: false,

      // Logging
      error_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/celery-error.log',
      out_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/celery-out.log',
      log_file: 'E:/rappa-mvp/rappa-ai-mvp/backend/logs/celery-combined.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Execution mode
      instances: 1,                // Single worker instance
      exec_mode: 'fork',

      // Restart strategies
      wait_ready: false,
      listen_timeout: 30000,       // Celery takes longer to start
      kill_timeout: 10000,         // Give Celery time to finish tasks

      // Advanced options
      restart_delay: 4000,
      shutdown_with_message: false,
    },

    // ========================================================================
    // Frontend (Vite Dev Server)
    // ========================================================================
    {
      name: 'rappa-ui',
      script: 'node_modules/vite/bin/vite.js',
      args: 'dev --host',
      cwd: 'E:/rappa-mvp/rappa-ai-mvp/frontend',
      env_common: {
        NODE_ENV: 'development',
        VITE_API_URL: 'http://localhost:8001',
      },
      autorestart: true,
      out_file: 'E:/rappa-mvp/rappa-ai-mvp/frontend/logs/pm2-out.log',
      error_file: 'E:/rappa-mvp/rappa-ai-mvp/frontend/logs/pm2-error.log',
    }
  ]
};

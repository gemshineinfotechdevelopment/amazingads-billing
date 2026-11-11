module.exports = {
  apps: [
    {
      name: 'amazingads-backend',
      cwd: './server',
      script: 'dist/index.js',
      instances: 1, // Single instance or 2 for cluster mode
      exec_mode: 'fork', // 'fork' is rock-solid for Mongoose & low-resource VPS
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env_production: {
        NODE_ENV: 'production',
        PORT: 5027,
      },
      env_development: {
        NODE_ENV: 'development',
        PORT: 5027,
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      merge_logs: true,
      time: true,
    },
  ],
};


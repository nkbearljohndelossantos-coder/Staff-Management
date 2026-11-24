import dotenv from 'dotenv';
dotenv.config();

import app from './src/app.js';
import pool from './src/config/database.js';

const PORT = parseInt(process.env.PORT || '39102', 10);
const HOST = process.env.HOST || '0.0.0.0';

// Test DB Connection on startup
pool.query('SELECT NOW() AS boot_time')
  .then((res) => {
    console.log(`[POSTGRES CONNECTED] Server successfully connected to database at: ${res.rows[0].boot_time}`);
  })
  .catch((err) => {
    console.warn(`[POSTGRES WARNING] Initial connection failed: ${err.message}. Backend will still serve HTTP.`);
  });

const server = app.listen(PORT, HOST, () => {
  console.log('=============================================================');
  console.log(`  NKB MANUFACTURING BACKEND REST API IS RUNNING`);
  console.log(`  Address:  http://${HOST}:${PORT}`);
  console.log(`  Health:   http://${HOST}:${PORT}/api/health`);
  console.log(`  Auth:     http://${HOST}:${PORT}/api/auth/login`);
  console.log(`  Canteen:  http://${HOST}:${PORT}/api/canteen/inventory`);
  console.log(`  Staff:    http://${HOST}:${PORT}/api/staff`);
  console.log(`  Audit:    http://${HOST}:${PORT}/api/audit/trail`);
  console.log('=============================================================');
});

// Graceful Shutdown
const handleShutdown = (signal) => {
  console.log(`\n[SIGNAL ${signal}] Gracefully shutting down HTTP server...`);
  server.close(() => {
    console.log('[SERVER CLOSED] HTTP server terminated.');
    pool.end(() => {
      console.log('[DATABASE CLOSED] PostgreSQL pool drained.');
      process.exit(0);
    });
  });
};

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

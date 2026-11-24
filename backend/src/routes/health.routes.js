import { Router } from 'express';
import { query } from '../config/database.js';

const router = Router();

router.get('/', async (req, res) => {
  const startTime = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = null;

  try {
    const dbRes = await query('SELECT 1 AS alive, NOW() AS db_time');
    if (dbRes.rows.length > 0) {
      dbStatus = 'healthy';
      dbLatencyMs = Date.now() - startTime;
    }
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  const isHealthy = dbStatus === 'healthy';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    service: 'nkb-manufacturing-backend',
    version: '1.0.0',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    database: {
      status: dbStatus,
      latencyMs: dbLatencyMs
    }
  });
});

export default router;

import { Router } from 'express';
import { getAuditLogs, createAuditLog, getNotifications } from '../controllers/auditController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

router.get('/trail', getAuditLogs);
router.post('/trail', createAuditLog);
router.get('/notifications', getNotifications);

export default router;

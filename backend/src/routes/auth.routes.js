import { Router } from 'express';
import { login, barcodeLogin, getMe } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { barcodeRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();

router.post('/login', login);
router.post('/barcode', barcodeRateLimiter, barcodeLogin);
router.get('/me', authenticateToken, getMe);

export default router;

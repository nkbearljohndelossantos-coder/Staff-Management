import { Router } from 'express';
import {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  batchSyncStaff,
  getDepartments,
  getPositions
} from '../controllers/staffController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

router.use(authenticateToken);

const STAFF_MANAGEMENT_ROLES = ['admin', 'hr', 'superadmin', 'it_admin', 'ceo', 'coo', 'hr_manager', 'finance'];

router.get('/departments', getDepartments);
router.get('/positions', getPositions);

router.get('/', getAllStaff);
router.get('/:id', getStaffById);
router.post('/', requireRole(...STAFF_MANAGEMENT_ROLES), createStaff);
router.post('/batch-sync', requireRole(...STAFF_MANAGEMENT_ROLES), batchSyncStaff);
router.put('/:id', requireRole(...STAFF_MANAGEMENT_ROLES), updateStaff);
router.delete('/:id', requireRole(...STAFF_MANAGEMENT_ROLES), deleteStaff);

export default router;

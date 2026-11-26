import { Router } from 'express';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
  resetInventoryStock,
  getReceipts,
  createReceipt,
  getDeductionsLedger,
  getStaffBalances,
  getActiveDrawerSession,
  openDrawerSession,
  closeDrawerSession,
  getDrawerTransactions,
  recordDrawerTransaction,
  getGatePasses,
  createGatePass,
  getVoidLogs,
  getSalesInvoices,
  createSalesInvoice,
  getMfgProducts,
  createMfgProduct
} from '../controllers/canteenController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Public catalog and live stock reading for POS Terminals & Kiosks
router.get('/inventory', getInventory);

router.use(authenticateToken);

const CANTEEN_ROLES = ['admin', 'canteen', 'canteen_manager', 'canteen_admin', 'superadmin', 'hr', 'it_admin'];

// Inventory mutations
router.post('/inventory', requireRole(...CANTEEN_ROLES), createInventoryItem);
router.post('/inventory/reset-stock', requireRole(...CANTEEN_ROLES), resetInventoryStock);
router.put('/inventory/:id', requireRole(...CANTEEN_ROLES), updateInventoryItem);

// Inbound Sales Invoices
router.get('/invoices', getSalesInvoices);
router.post('/invoices', requireRole(...CANTEEN_ROLES), createSalesInvoice);

// POS & Receipts
router.get('/receipts', getReceipts);
router.post('/receipts', createReceipt);

// Deductions & Balances
router.get('/deductions', getDeductionsLedger);
router.get('/balances', getStaffBalances);

// Cash Drawer
router.get('/drawer/active', getActiveDrawerSession);
router.post('/drawer/open', openDrawerSession);
router.post('/drawer/:id/close', closeDrawerSession);
router.get('/drawer/transactions', getDrawerTransactions);
router.post('/drawer/transactions', recordDrawerTransaction);

// Manufacturing Products
router.get('/mfg/products', getMfgProducts);
router.post('/mfg/products', requireRole('admin', 'superadmin'), createMfgProduct);

// Logistics & Audit
router.get('/gate-passes', getGatePasses);
router.post('/gate-passes', createGatePass);
router.get('/void-logs', getVoidLogs);

export default router;

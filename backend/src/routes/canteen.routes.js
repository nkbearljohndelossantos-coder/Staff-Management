import { Router } from 'express';
import {
  getInventory,
  createInventoryItem,
  updateInventoryItem,
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

router.use(authenticateToken);

// Inventory
router.get('/inventory', getInventory);
router.post('/inventory', requireRole('admin', 'canteen_manager', 'superadmin'), createInventoryItem);
router.put('/inventory/:id', requireRole('admin', 'canteen_manager', 'superadmin'), updateInventoryItem);

// Inbound Sales Invoices
router.get('/invoices', getSalesInvoices);
router.post('/invoices', requireRole('admin', 'canteen_manager', 'superadmin'), createSalesInvoice);

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

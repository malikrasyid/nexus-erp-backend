import { Router } from 'express';
import * as LedgerController from '../controllers/ledger.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Financial Reporting
router.get('/trial-balance', authorize('MANAGER', 'TENANT_ADMIN'), LedgerController.getTrialBalance);
router.get('/balance-sheet', authorize('MANAGER', 'TENANT_ADMIN'), LedgerController.getBalanceSheet);

// Specific Account Details
router.get('/accounts/:accountId/statement', authorize('MANAGER', 'TENANT_ADMIN'), LedgerController.getStatement);

// Manual Accounting Adjustments
router.post('/journal', authorize('TENANT_ADMIN'), LedgerController.postManualJournal);

export default router;
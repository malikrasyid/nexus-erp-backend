import { Router } from 'express';
import * as FinanceController from '../controllers/finance.controller.js';

const router = Router();

router.post('/transactions', FinanceController.createTransaction);
router.get('/projects/:projectId/report', FinanceController.getProjectReport);

// Trigger the Auto-Billing for an allocation
router.post('/bill/:allocationId', FinanceController.billAllocation);

export default router;
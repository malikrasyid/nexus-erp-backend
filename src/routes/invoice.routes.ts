import { Router } from 'express';
import * as InvoiceController from '../controllers/invoice.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authorize('MANAGER', 'TENANT_ADMIN'), InvoiceController.createInvoice);
router.post('/:id/finalize', authorize('MANAGER', 'TENANT_ADMIN'), InvoiceController.finalizeInvoice);
router.get('/project/:projectId', authorize('STAFF', 'MANAGER', 'TENANT_ADMIN'), InvoiceController.getProjectInvoices);

export default router;
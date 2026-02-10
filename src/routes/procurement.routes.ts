import { Router } from 'express';
import * as ProcurementController from '../controllers/procurement.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authorize('MANAGER', 'TENANT_ADMIN'), ProcurementController.createPO);
router.post('/:id/receive', authorize('MANAGER', 'TENANT_ADMIN'), ProcurementController.receivePO);

export default router;
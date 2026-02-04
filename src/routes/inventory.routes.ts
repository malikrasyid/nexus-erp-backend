import { Router } from 'express';
import * as InventoryController from '../controllers/inventory.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', authorize('MANAGER', 'TENANT_ADMIN'), InventoryController.addItem);
router.get('/', authorize('STAFF', 'MANAGER', 'TENANT_ADMIN'), InventoryController.listInventory);
router.patch('/adjust', authorize('MANAGER', 'TENANT_ADMIN'), InventoryController.adjustStock);
router.patch('/:itemId/status', authorize('MANAGER', 'TENANT_ADMIN'), InventoryController.toggleStatus);
router.get('/:itemId/history', authorize('MANAGER', 'TENANT_ADMIN'), InventoryController.getTransactionHistory);

export default router;
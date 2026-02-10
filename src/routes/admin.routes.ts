import { Router } from 'express';
import * as AdminController from '../controllers/admin.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

// Global System Management (SUPER_ADMIN ONLY)
router.use(authorize('SUPER_ADMIN'));

router.get('/stats', AdminController.getSystemHealth);
router.post('/reassign-user', AdminController.reassignUser);
router.post('/seed-financials', AdminController.seedTenant);

export default router;
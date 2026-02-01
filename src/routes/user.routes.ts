import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

// Only Super Admin can see global system health
router.get('/sys-stats', authorize('SUPER_ADMIN'), UserController.getGlobalStats);

// Tenant Admin or Manager can view staff
router.get('/staff', authorize('TENANT_ADMIN', 'MANAGER'), UserController.listStaff);

// Only Super Admin can move existing users across company lines
router.patch('/reassign', authorize('SUPER_ADMIN'), UserController.reassignUser);

// Tenant Admins (HR) can invite new staff to their company
router.post('/invite', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), UserController.inviteUser);

// Super Admin only global stats
router.get('/stats', authorize('SUPER_ADMIN'), UserController.getGlobalStats);

export default router;
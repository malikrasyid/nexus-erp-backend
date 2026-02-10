import { Router } from 'express';
import { authorize } from '../middleware/auth.middleware.js';
import * as UserController from '../controllers/user.controller.js';

const router = Router();

// Tenant Admin or Manager can view staff
router.get('/staff', authorize('TENANT_ADMIN', 'MANAGER'), UserController.listStaff);

// Tenant Admins (HR) can invite new staff to their company
router.post('/invite', authorize('TENANT_ADMIN', 'SUPER_ADMIN'), UserController.inviteUser);

export default router;
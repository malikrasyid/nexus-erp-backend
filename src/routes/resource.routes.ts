import { Router } from 'express';
import * as ResourceController from '../controllers/resource.controller.js';
import { authorize } from '../middleware/auth.middleware.js';

const router = Router();

router.post('/', ResourceController.createResource);
router.get('/', ResourceController.getAllResources);
router.patch('/:id', ResourceController.updateResource);
router.delete('/:id', ResourceController.deleteResource);

router.post('/capabilities', authorize('MANAGER', 'TENANT_ADMIN'), ResourceController.addCapabilityToLibrary);
router.post('/assign', authorize('MANAGER', 'TENANT_ADMIN'), ResourceController.assignCapabilityToResource);
router.get('/search/:capabilityId', authorize('STAFF', 'MANAGER', 'TENANT_ADMIN'), ResourceController.searchResourcesBySkill);

export default router;
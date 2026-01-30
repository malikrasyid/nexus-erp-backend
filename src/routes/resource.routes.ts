import { Router } from 'express';
import * as ResourceController from '../controllers/resource.controller.js';

const router = Router();

router.post('/', ResourceController.createResource);
router.get('/', ResourceController.getAllResources);
router.patch('/:id', ResourceController.updateResource);
router.delete('/:id', ResourceController.deleteResource);

export default router;
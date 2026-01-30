import { Router } from 'express';
import * as AllocationController from '../controllers/allocation.controller.js';

const router = Router();

router.post('/', AllocationController.createAllocation);
router.get('/resource/:resourceId', AllocationController.getSchedule);
router.patch('/:id', AllocationController.updateAllocation);
router.delete('/:id', AllocationController.deleteAllocation);

export default router;
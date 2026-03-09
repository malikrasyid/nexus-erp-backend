import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import * as MetricController from '../controllers/metric.controller.js';

const router = Router();

// GET /api/metrics/dashboard
router.get('/dashboard', authenticate, MetricController.getDashboardSummary);

export default router;
import { Router } from 'express';
import * as ProjectController from '../controllers/project.controller.js';

const router = Router();

router.post('/bundle', ProjectController.createProjectBundle);
router.get('/', ProjectController.getAllProjects);
router.get('/:id', ProjectController.getProjectWithTasks);
router.patch('/:id', ProjectController.updateProject);
router.delete('/:id', ProjectController.deleteProject);

export default router;
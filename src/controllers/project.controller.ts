import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/project.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createProjectBundle = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { project, tasks } = req.body;
    const result = await ProjectService.createProject(req.tenantId!, project, tasks);
    return sendSuccess(res, result, 'Project and tasks initialized', 201);
  } catch (error) {
    next(error);
  }
};

export const getProjectWithTasks = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const data = await ProjectService.getProjectDetails(req.tenantId!, id);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ProjectService.updateProject(req.tenantId!, req.params.id, req.body);
      return sendSuccess(res, result, 'Project updated successfully');
    } catch (error) {
      next(error);
    }
  };
  
  export const deleteProject = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await ProjectService.deleteProject(req.tenantId!, id);
      return sendSuccess(res, null, 'Project deleted successfully');
    } catch (error) {
      next(error);
    }
  };
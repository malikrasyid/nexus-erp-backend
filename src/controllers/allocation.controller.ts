import { Request, Response, NextFunction } from 'express';
import { AllocationService } from '../services/allocation.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createAllocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resource_id, project_id, task_id, start, end, status } = req.body;
    
    const result = await AllocationService.createAllocation(req.tenantId!, {
      resource_id,
      project_id,
      task_id,
      start: new Date(start),
      end: new Date(end),
      status
    });

    return sendSuccess(res, result, 'Resource allocated successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getSchedule = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resourceId } = req.params;
    const schedule = await AllocationService.getResourceSchedule(req.tenantId!, resourceId);
    return sendSuccess(res, schedule);
  } catch (error) {
    next(error);
  }
};

export const updateAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { start, end, status } = req.body;
      
      const result = await AllocationService.updateAllocation(req.tenantId!, id, {
        start: start ? new Date(start) : undefined,
        end: end ? new Date(end) : undefined,
        status
      });
  
      return sendSuccess(res, result, 'Allocation updated successfully');
    } catch (error) {
      next(error);
    }
  };
  
  export const deleteAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      await AllocationService.deleteAllocation(req.tenantId!, id);
      return sendSuccess(res, null, 'Allocation deleted successfully');
    } catch (error) {
      next(error);
    }
  };
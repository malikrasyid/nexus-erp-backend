import { Request, Response, NextFunction } from 'express';
import { ResourceService } from '../services/resource.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.tenantId is guaranteed here because of our middleware!
    const resource = await ResourceService.createResource(req.tenantId!, req.body);
    return sendSuccess(res, resource, 'Resource created successfully', 201);
  } catch (error) {
    next(error);
  }
};

export const getAllResources = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    const resources = await ResourceService.getResources(req.tenantId!, category as any);
    return sendSuccess(res, resources);
  } catch (error) {
    next(error);
  }
};

export const updateResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const result = await ResourceService.updateResource(req.tenantId!, id, req.body);
        return sendSuccess(res, result, 'Resource updated successfully');
      } catch (error) {
        next(error);
      }
};

export const deleteResource = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        await ResourceService.deleteResource(req.tenantId!, id);
        return sendSuccess(res, null, 'Resource deleted successfully');
      } catch (error) {
        next(error);
      }
};

export const addCapabilityToLibrary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, description } = req.body;
    // req.tenantId comes from our Hybrid Middleware
    const result = await ResourceService.createCapability(req.tenantId!, name, description);
    return sendSuccess(res, result, 'Capability added to company library');
  } catch (error) {
    next(error);
  }
};

export const assignCapabilityToResource = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resourceId, capabilityId, proficiency } = req.body;
    
    // We use req.tenantId to ensure Sarah can't tag resources in another company
    const result = await ResourceService.assignCapability({
      tenantId: req.tenantId!,
      resourceId,
      capabilityId,
      proficiency: Number(proficiency) || 1
    });

    return sendSuccess(res, result, 'Resource capability updated successfully');
  } catch (error) {
    next(error);
  }
};

export const searchResourcesBySkill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { capabilityId } = req.params;
    const resources = await ResourceService.getResourcesBySkill(req.tenantId!, capabilityId);
    return sendSuccess(res, resources, 'Matching resources found');
  } catch (error) {
    next(error);
  }
};
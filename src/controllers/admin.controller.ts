import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/admin.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const reassignUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { targetUserId, newTenantId } = req.body;
    const result = await AdminService.reassignUser(targetUserId, newTenantId);
    return sendSuccess(res, result, 'User teleported to new tenant successfully');
  } catch (error) {
    next(error);
  }
};

export const seedTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { tenantId } = req.body;
    const result = await AdminService.initializeTenantFinancials(tenantId);
    return sendSuccess(res, result, 'Tenant financial structure initialized');
  } catch (error) {
    next(error);
  }
};

export const getSystemHealth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await AdminService.getGlobalStats();
    return sendSuccess(res, stats, 'Global system stats retrieved');
  } catch (error) {
    next(error);
  }
};
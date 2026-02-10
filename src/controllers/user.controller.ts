import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const listStaff = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Managers can see staff, but only within their own tenant
    const users = await UserService.getUsersByTenant(req.tenantId!);
    return sendSuccess(res, users, 'Staff list retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const inviteUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email, name, role } = req.body;
    // HR can only invite people to their OWN tenant
    const result = await UserService.inviteUser(req.tenantId!, { email, name, role });
    return sendSuccess(res, result, 'Invitation sent successfully', 201);
  } catch (error) {
    next(error);
  }
};
import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { sendSuccess } from '../utils/response.util.js';
import sql from '../config/db.js';

export const getMe = async (req: any, res: any) => {
  try {
    // req.userId is securely provided by your authenticate middleware!
    const [user] = await sql`
      SELECT id, full_name, email, role, tenant_id
      FROM profiles
      WHERE id = ${req.userId}
    `;
    
    if (!user) {
      return res.status(404).json({ message: 'Profile not found' });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

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
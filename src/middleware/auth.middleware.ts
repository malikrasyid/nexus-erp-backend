import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import sql from '../config/db.js';
import { UserRole } from '../services/user.service.js'

const isValidRole = (role: any): role is UserRole => {
  return ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'STAFF'].includes(role);
};

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ message: 'No token' });

  try {
    // Decode the Supabase/JWT token
    const decoded = jwt.decode(token) as any;
    const userId = decoded.sub;

    const [profile] = await sql`
      SELECT tenant_id as "tenantId", role 
      FROM profiles 
      WHERE id = ${userId}
    `;

    if (!profile) {
      return res.status(403).json({ message: 'User profile not found' });
    }

    // Attach identity to the request
    req.userId = userId;
    req.tenantId = profile.tenantId;
    req.role = isValidRole(profile.role) ? profile.role : 'STAFF';

    // Security Check: Every user (except Super Admin) must have a tenantId
    if (req.role !== 'SUPER_ADMIN' && !req.tenantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: User is not assigned to a tenant' 
      });
    }

    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

/**
 * Middleware to restrict access based on roles
 */
export const authorize = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.role!)) {
      return res.status(403).json({ 
        success: false, 
        message: `Required role: ${allowedRoles.join(' or ')}. Your role: ${req.role}` 
      });
    }
    next();
  };
};
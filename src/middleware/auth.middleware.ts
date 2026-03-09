import { Request, Response, NextFunction } from 'express';
import sql from '../config/db.js';
import { UserRole } from '../services/user.service.js'
import { supabase } from '../config/supabase.js';

const isValidRole = (role: any): role is UserRole => {
  return ['SUPER_ADMIN', 'TENANT_ADMIN', 'MANAGER', 'STAFF'].includes(role);
};

const SUPABASE_SECRET = process.env.SUPABASE_JWT_SECRET || '';

export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ success: false, message: 'No token provided' });
  }

  try {
    // 1. Let the official Supabase client verify the token and fetch the user
    // This perfectly handles the new asymmetric algorithms without crashing!
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
      console.error("Supabase Auth Error:", error?.message);
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const userId = user.id;

    // 2. Fetch the ERP profile from your PostgreSQL database
    const [profile] = await sql`
      SELECT tenant_id as "tenantId", role 
      FROM profiles 
      WHERE id = ${userId}
    `;

    if (!profile) {
      return res.status(403).json({ success: false, message: 'User profile not found in ERP database' });
    }

    // 3. Attach identity to the Express request object
    req.userId = userId;
    req.tenantId = profile.tenantId;
    req.role = isValidRole(profile.role) ? profile.role : 'STAFF';

    // 4. Multi-tenant Security Check
    if (req.role !== 'SUPER_ADMIN' && !req.tenantId) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied: User is not assigned to a workspace' 
      });
    }

    next();
  } catch (error) {
    console.error("Middleware Exception:", error);
    return res.status(500).json({ success: false, message: 'Internal server error during authentication' });
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
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '../config/supabase.js';
import {} from '../types/express.js';
/**
 * Middleware to verify the user's JWT and inject their tenant_id
 */
export const verifyTenant = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Missing or invalid authorization header' });
    }

    const token = authHeader.split(' ')[1];

    // 1. Verify the JWT with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
    }

    /**
     * 2. Extract tenant_id
     * In a standard setup, you store tenant_id in 'app_metadata' 
     * which can be set via Supabase Auth Hooks or an Admin script.
     */
    const tenantId = user.app_metadata?.tenant_id;

    if (!tenantId) {
      return res.status(403).json({ success: false, message: 'Forbidden: User not assigned to a tenant' });
    }

    // 3. Inject into request object for the next handlers
    req.user = user;
    req.tenantId = tenantId;

    next();
  } catch (err) {
    next(err);
  }
};
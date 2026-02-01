import { User } from '@supabase/supabase-js';

declare global {
  namespace Express {
    interface Request {
      userId?: string;
      tenantId?: string;
      role?: UserRole;
    }
  }
}
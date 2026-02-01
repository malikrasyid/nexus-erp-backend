import sql from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'MANAGER' | 'STAFF';

export const UserService = {
  /**
   * Create a new user within a tenant
   */
  async createUser(tenantId: string, userData: { email: string, role: UserRole, name: string }) {
    const [user] = await sql`
      INSERT INTO profiles (tenant_id, email, full_name, role)
      VALUES (${tenantId}, ${userData.email}, ${userData.name}, ${userData.role})
      RETURNING *
    `;
    return user;
  },

  /**
   * Get users filtered by Department/Tenant (Used by Managers/Admins)
   */
  async getUsersByTenant(tenantId: string, roleFilter?: UserRole) {
    return await sql`
      SELECT id, email, full_name, role, created_at
      FROM profiles
      WHERE tenant_id = ${tenantId}
      ${roleFilter ? sql`AND role = ${roleFilter}` : sql``}
      ORDER BY full_name ASC
    `;
  },

  /**
   * Self-Switch: Used by Super Admins to jump between companies
   */
  async switchTenant(userId: string, userRole: string, newTenantId: string) {
    // 1. Strict Security Gate
    if (userRole !== 'SUPER_ADMIN') {
      throw new Error('Access Denied: Only Super Admins can manually switch their own tenant context.');
    }

    // 2. Perform the switch
    const [updated] = await sql`
      UPDATE profiles 
      SET tenant_id = ${newTenantId}
      WHERE id = ${userId}
      RETURNING tenant_id, role
    `;
    
    return updated;
  },

  /**
   * REASSIGN: Move an existing user to a different tenant.
   * Restricted to SUPER_ADMIN.
   */
  async reassignUser(adminRole: string, targetUserId: string, newTenantId: string) {
    if (adminRole !== 'SUPER_ADMIN') {
      throw new Error('Unauthorized: Only Super Admins can reassign users between tenants.');
    }

    return await sql.begin(async (tx) => {
      // 1. Update Local Profile (The Hybrid Source of Truth)
      const [updated] = await (tx as any)`
        UPDATE profiles 
        SET tenant_id = ${newTenantId}
        WHERE id = ${targetUserId}
        RETURNING id, tenant_id, role
      `;

      if (!updated) throw new Error('User profile not found.');

      // 2. Sync with Supabase Auth (The JWT Source of Truth)
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        app_metadata: { tenant_id: newTenantId }
      });

      if (error) throw new Error(`Supabase Sync Error: ${error.message}`);

      return updated;
    });
  },

  /**
   * INVITE: Create a new user account and link to tenant.
   * Used by TENANT_ADMIN (HR) or SUPER_ADMIN.
   */
  async inviteUser(adminTenantId: string, userData: { email: string; name: string; role: any }) {
    return await sql.begin(async (tx) => {
      // 1. Create User in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        userData.email,
        {
          data: { full_name: userData.name },
          // Redirect to your (future) login page
          redirectTo: 'http://localhost:3000/auth/confirm', 
        }
      );

      if (authError) throw new Error(`Auth Invite Error: ${authError.message}`);

      // 2. Set App Metadata (Tenant & Role)
      await supabaseAdmin.auth.admin.updateUserById(authUser.user.id, {
        app_metadata: { tenant_id: adminTenantId, role: userData.role }
      });

      // 3. Create Local Profile
      const [profile] = await (tx as any)`
        INSERT INTO profiles (id, tenant_id, email, full_name, role)
        VALUES (${authUser.user.id}, ${adminTenantId}, ${userData.email}, ${userData.name}, ${userData.role})
        RETURNING *
      `;

      return profile;
    });
  },

  /**
   * Global System Health (Super Admin Only)
   */
  async getGlobalStats() {
    const [stats] = await sql`
      SELECT 
        (SELECT COUNT(*) FROM tenants) as total_tenants,
        (SELECT COUNT(*) FROM profiles) as total_users,
        (SELECT COUNT(*) FROM projects) as total_active_projects
    `;
    return stats;
  }
};
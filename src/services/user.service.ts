import sql from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';

export type UserRole = 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'MANAGER' | 'STAFF';

export const UserService = {
  /**
   * Get users within the current tenant (Isolation enforced)
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
   * INVITE: Create a new user account and link to tenant.
   * Used by TENANT_ADMIN (HR) to grow their internal team.
   */
  async inviteUser(adminTenantId: string, userData: { email: string; name: string; role: UserRole }) {
    return await sql.begin(async (tx) => {
      // 1. Create User in Supabase Auth
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
        userData.email,
        {
          data: { full_name: userData.name },
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
  }
};
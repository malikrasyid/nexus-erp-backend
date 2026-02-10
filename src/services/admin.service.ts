import sql from '../config/db.js';
import { supabaseAdmin } from '../config/supabase.js';
import { SeedService } from './seed.service.js';

export const AdminService = {
  /**
   * REASSIGN: Move any user to any tenant.
   * This is the "Teleportation" logic Malik uses.
   */
  async reassignUser(targetUserId: string, newTenantId: string) {
    return await sql.begin(async (tx) => {
      // 1. Update Profile (The Hybrid Source of Truth)
      const [updated] = await (tx as any)`
        UPDATE profiles 
        SET tenant_id = ${newTenantId}
        WHERE id = ${targetUserId}
        RETURNING id, tenant_id, role
      `;

      if (!updated) throw new Error('User profile not found.');

      // 2. Sync with Supabase Auth
      const { error } = await supabaseAdmin.auth.admin.updateUserById(targetUserId, {
        app_metadata: { tenant_id: newTenantId }
      });

      if (error) throw new Error(`Supabase Sync Error: ${error.message}`);

      return updated;
    });
  },

  /**
   * SELF-SWITCH: SUPER ADMIN jumps into a specific company's context.
   */
  async switchOwnTenant(userId: string, newTenantId: string) {
    const [updated] = await sql`
      UPDATE profiles 
      SET tenant_id = ${newTenantId}
      WHERE id = ${userId}
      RETURNING tenant_id, role
    `;
    return updated;
  },

  /**
   * Manual Financial Initialization.
   * Useful if a tenant was created but seeding failed, 
   * or for retrofitting old tenants with new account structures.
   */
  async initializeTenantFinancials(tenantId: string) {
    // 1. Verify tenant exists
    const [tenant] = await sql`SELECT id FROM tenants WHERE id = ${tenantId}`;
    if (!tenant) throw new Error('Tenant not found');

    // 2. Run the seed
    return await SeedService.seedTenantAccounts(tenantId);
  },

  /**
   * GLOBAL STATS: High-level overview of the entire ERP.
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
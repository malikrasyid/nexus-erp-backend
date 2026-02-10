import sql from '../config/db.js';
import { SeedService } from './seed.service.js';

export const TenantService = {
  async createTenant(name: string, plan: 'BASIC' | 'PRO' = 'BASIC') {
    return await sql.begin(async (tx) => {
      // 1. Create the Company
      const [tenant] = await (tx as any)`
        INSERT INTO tenants (name, plan, is_active)
        VALUES (${name}, ${plan}, true)
        RETURNING *
      `;

      // 2. Seed the Financial Structure (The "Engine")
      await SeedService.seedTenantAccounts(tenant.id);

      // 3. Create a default "General" Project to get them started
      await (tx as any)`
        INSERT INTO projects (tenant_id, name, description, status)
        VALUES (${tenant.id}, 'General Operations', 'Default project for non-specific tasks', 'IN_PROGRESS')
      `;

      return tenant;
    });
  },

  async getTenantDetails(tenantId: string) {
    const [tenant] = await sql`SELECT * FROM tenants WHERE id = ${tenantId}`;
    return tenant;
  }
};
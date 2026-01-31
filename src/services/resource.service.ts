import sql from '../config/db.js';
import { Resource, ResourceCategory } from '../models/resource.js';

export const ResourceService = {
  async createResource(tenantId: string, data: Partial<Resource>) {
    const [resource] = await sql`
      INSERT INTO resources (
        tenant_id, name, category, identifier, unit_cost, metadata
      ) VALUES (
        ${tenantId}, ${data.name!}, ${data.category!}, ${data.identifier || null}, 
        ${data.unit_cost || 0}, ${sql.json(data.metadata || {})}
      )
      RETURNING *
    `;
    return resource;
  },

  async getResources(tenantId: string, category?: ResourceCategory) {
    return await sql`
      SELECT * FROM resources 
      WHERE tenant_id = ${tenantId}
      ${category ? sql`AND category = ${category}` : sql``}
      ORDER BY created_at DESC
    `;
  },

  async updateResource(tenantId: string, id: string, updates: Partial<Resource>) {
    const [resource] = await sql`
      UPDATE resources 
      SET ${sql(updates, 'name', 'category', 'identifier', 'unit_cost', 'metadata')}
      WHERE id = ${id} AND tenant_id = ${tenantId}
      RETURNING *
    `;
    return resource;
  },

  async deleteResource(tenantId: string, id: string) {
    await sql`DELETE FROM resources WHERE id = ${id} AND tenant_id = ${tenantId}`;
    return true;
  }
};
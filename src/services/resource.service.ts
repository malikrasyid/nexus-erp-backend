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
  },

  async createCapability(tenantId: string, name: string, description: string) {
    const [capability] = await sql`
      INSERT INTO capabilities (tenant_id, name, description)
      VALUES (${tenantId}, ${name}, ${description})
      RETURNING *
    `;
    return capability;
  },

  async assignCapability(params: {
    tenantId: string,
    resourceId: string,   
    capabilityId: string, 
    proficiency: number  
  }) {
    const [assigned] = await sql`
      INSERT INTO resource_capabilities (
        tenant_id, 
        resource_id, 
        capability_id, 
        proficiency
      )
      VALUES (
        ${params.tenantId}, 
        ${params.resourceId}, 
        ${params.capabilityId}, 
        ${params.proficiency}
      )
      ON CONFLICT (resource_id, capability_id) 
      DO UPDATE SET proficiency = EXCLUDED.proficiency
      RETURNING *
    `;
    return assigned;
  },

  async getResourcesBySkill(tenantId: string, capabilityId: string) {
    return await sql`
      SELECT 
        r.*, 
        rc.proficiency,
        c.name as capability_name
      FROM resource_capabilities rc
      JOIN resources r ON rc.resource_id = r.id
      JOIN capabilities c ON rc.capability_id = c.id
      WHERE rc.tenant_id = ${tenantId} 
      AND rc.capability_id = ${capabilityId}
      ORDER BY rc.proficiency DESC
    `;
  }
};
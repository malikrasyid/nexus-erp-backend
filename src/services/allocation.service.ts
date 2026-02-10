import sql from '../config/db.js';
import { formatPostgresRange } from '../utils/date.utils.js';

export const AllocationService = {
  async checkOverlap(tx: any, resourceId: string, range: string, excludeId?: string) {
    const [overlap] = await tx`
      SELECT id FROM allocations
      WHERE resource_id = ${resourceId}
      AND duration && ${range}::tsrange
      ${excludeId ? tx`AND id != ${excludeId}` : tx``}
      LIMIT 1
    `;
    return !!overlap;
  },

  async createAllocation(tenantId: string, data: any) {
    return await sql.begin(async (tx) => {
      const range = formatPostgresRange(data.start, data.end);

      // 1. Double-booking prevention check
      const isOverlapping = await this.checkOverlap(tx, data.resource_id, range);
      if (isOverlapping) {
        throw new Error('Resource is already booked for the selected time range.');
      }

      // 2. Insert if no overlap
      const [allocation] = await (tx as any)`
        INSERT INTO allocations (tenant_id, resource_id, project_id, task_id, duration, status)
        VALUES (${tenantId}, ${data.resource_id}, ${data.project_id}, ${data.task_id}, ${range}, ${data.status || 'PROPOSED'})
        RETURNING *
      `;
      return allocation;
    });
  },

  async getResourceSchedule(tenantId: string, resourceId: string) {
    // Using a JOIN to get project names for the schedule view
    return await sql`
      SELECT 
        a.*, 
        t.name as task_name,
        p.name as project_name
      FROM allocations a
      JOIN tasks t ON a.task_id = t.id
      JOIN projects p ON t.project_id = p.id
      WHERE a.resource_id = ${resourceId} AND a.tenant_id = ${tenantId}
    `;
  },

  async updateAllocation(tenantId: string, id: string, data: { start?: Date, end?: Date, status?: string }) {
    return await sql.begin(async (tx) => {
      // 1. Fetch current allocation to handle partial date updates
      const [current] = await (tx as any)`
        SELECT resource_id, duration, status FROM allocations 
        WHERE id = ${id} AND tenant_id = ${tenantId}
      `;

      if (!current) throw new Error('Allocation not found');

      let newRange = current.duration;
      if (data.start && data.end) {
        newRange = formatPostgresRange(data.start, data.end);
        
        // Check for overlaps excluding the current allocation itself
        const isOverlapping = await this.checkOverlap(tx, current.resourceId, newRange, id);
        if (isOverlapping) {
          throw new Error('Update failed: New time range overlaps with an existing booking.');
        }
      }

      // 3. Perform the update
      const [updated] = await (tx as any)`
        UPDATE allocations
        SET 
          duration = ${newRange},
          status = ${data.status || current.status}
        WHERE id = ${id} AND tenant_id = ${tenantId}
        RETURNING *
      `;

      return updated;
    });
  },

  /**
   * Suggests alternative resources when a conflict occurs
   */
  async suggestAlternatives(tenantId: string, capabilityId: string, range: string) {
    return await sql`
      SELECT 
        r.id, 
        r.name, 
        rc.proficiency
      FROM resources r
      JOIN resource_capabilities rc ON r.id = rc.resource_id
      WHERE r.tenant_id = ${tenantId}
      AND rc.capability_id = ${capabilityId}
      -- This is the "Magic" check:
      AND NOT EXISTS (
        SELECT 1 FROM allocations a 
        WHERE a.resource_id = r.id 
        AND a.duration && ${range}::tsrange
      )
      ORDER BY rc.proficiency DESC
      LIMIT 5
    `;
  },

  async deleteAllocation(tenantId: string, id: string) {
    const result = await sql`
      DELETE FROM allocations 
      WHERE id = ${id} AND tenant_id = ${tenantId}
    `;
    
    return result.count > 0;
  }
};
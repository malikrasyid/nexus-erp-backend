import { supabaseAdmin } from '../config/supabase.js';
import { Allocation } from '../models/schedule.js';
import { formatPostgresRange } from '../utils/date.utils.js';

export const AllocationService = {
  /**
   * Assign a resource to a task for a specific time range
   */
  async createAllocation(tenantId: string, data: {
    resource_id: string;
    task_id: string;
    start: Date;
    end: Date;
    status?: 'PROPOSED' | 'CONFIRMED';
  }) {
    // Convert Dates to Postgres TSRANGE string: [start, end)
    const durationRange = formatPostgresRange(data.start, data.end);

    const { data: allocation, error } = await supabaseAdmin
      .from('allocations')
      .insert({
        tenant_id: tenantId,
        resource_id: data.resource_id,
        task_id: data.task_id,
        duration: durationRange,
        status: data.status || 'PROPOSED'
      })
      .select()
      .single();

    if (error) throw error;
    return allocation;
  },

  /**
   * Get all allocations for a specific resource (to see their schedule)
   */
  async getResourceSchedule(tenantId: string, resourceId: string) {
    const { data, error } = await supabaseAdmin
      .from('allocations')
      .select(`
        *,
        tasks (name, project_id, projects (name))
      `)
      .eq('tenant_id', tenantId)
      .eq('resource_id', resourceId);

    if (error) throw error;
    return data;
  },

  async updateAllocation(tenantId: string, id: string, data: {
    start?: Date;
    end?: Date;
    status?: 'PROPOSED' | 'CONFIRMED';
  }) {
    const updates: any = {};

    // If dates are provided, we must re-calculate the TSRANGE
    if (data.start || data.end) {
      // Note: In a real update, you'd usually fetch the existing record 
      // to fill in whichever date wasn't provided, but for this logic:
      if (data.start && data.end) {
        updates.duration = formatPostgresRange(data.start, data.end);
      }
    }

    if (data.status) updates.status = data.status;

    const { data: updated, error } = await supabaseAdmin
      .from('allocations')
      .update(updates)
      .match({ id, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return updated;
  },

  async deleteAllocation(tenantId: string, id: string) {
    const { error } = await supabaseAdmin
      .from('allocations')
      .delete()
      .match({ id, tenant_id: tenantId });

    if (error) throw error;
    return true;
  }
};
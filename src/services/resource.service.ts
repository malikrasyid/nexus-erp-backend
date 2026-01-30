import { supabaseAdmin } from '../config/supabase.js';
import { Resource, ResourceCategory } from '../models/resource.js';

export const ResourceService = {
  /**
   * Create a new resource scoped to the tenant
   */
  async createResource(tenantId: string, data: Partial<Resource>) {
    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .insert({
        tenant_id: tenantId,
        category: data.category,
        name: data.name,
        identifier: data.identifier,
        unit_cost: data.unit_cost || 0,
        metadata: data.metadata || {}
      })
      .select()
      .single();

    if (error) throw error;
    return resource;
  },

  /**
   * Get all resources for a company, filtered by category
   */
  async getResources(tenantId: string, category?: ResourceCategory) {
    let query = supabaseAdmin
      .from('resources')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    const { data: resources, error } = await query;

    if (error) throw error;
    return resources;
  },

  async updateResource(tenantId: string, resourceId: string, updates: Partial<Resource>) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .update(updates)
      .match({ id: resourceId, tenant_id: tenantId }) // Critical security check
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteResource(tenantId: string, resourceId: string) {
    const { error } = await supabaseAdmin
      .from('resources')
      .delete()
      .match({ id: resourceId, tenant_id: tenantId });

    if (error) throw error;
    return true;
  }
};
import { supabaseAdmin } from '../config/supabase.js';
import { Project, Task } from '../models/project.js';

export const ProjectService = {
  /**
   * Create a project and optional initial tasks
   */
  async createProject(tenantId: string, projectData: Partial<Project>, initialTasks: Partial<Task>[] = []) {
    // 1. Insert the Project
    const { data: project, error: pError } = await supabaseAdmin
      .from('projects')
      .insert({
        tenant_id: tenantId,
        name: projectData.name,
        status: projectData.status || 'PLANNING',
        metadata: projectData.metadata || {}
      })
      .select()
      .single();

    if (pError) throw pError;

    // 2. Insert Tasks if provided
    if (initialTasks.length > 0) {
      const tasksToInsert = initialTasks.map(task => ({
        ...task,
        tenant_id: tenantId,
        project_id: project.id
      }));

      const { error: tError } = await supabaseAdmin
        .from('tasks')
        .insert(tasksToInsert);

      if (tError) throw tError;
    }

    return project;
  },

  /**
   * Fetch a project with all its associated tasks
   */
  async getProjectDetails(tenantId: string, projectId: string) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .select(`
        *,
        tasks (*)
      `)
      .eq('tenant_id', tenantId)
      .eq('id', projectId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProject(tenantId: string, projectId: string, updates: Partial<Project>) {
    const { data, error } = await supabaseAdmin
      .from('projects')
      .update(updates)
      .match({ id: projectId, tenant_id: tenantId })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteProject(tenantId: string, projectId: string) {
    // If your DB schema has "ON DELETE CASCADE" on the tasks table, 
    // deleting the project will automatically delete its tasks.
    const { error } = await supabaseAdmin
      .from('projects')
      .delete()
      .match({ id: projectId, tenant_id: tenantId });

    if (error) throw error;
    return true;
  }
};
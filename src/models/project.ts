import { TenantBase } from './base';

export type ProjectStatus = 'PLANNING' | 'ACTIVE' | 'ON_HOLD' | 'COMPLETED';

export interface Project extends TenantBase {
  name: string;
  status: ProjectStatus;
  metadata: Record<string, any>;
}

export interface Task extends TenantBase {
  project_id: string;
  parent_task_id?: string | null;
  name: string;
  estimated_hours: number;
  metadata: Record<string, any>;
}
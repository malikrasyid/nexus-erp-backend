import { TenantBase } from './base.js';

export type ResourceCategory = 'HUMAN' | 'EQUIPMENT' | 'MATERIAL' | 'SPACE';

export interface Resource extends TenantBase {
  category: ResourceCategory;
  name: string;
  identifier?: string;
  unit_cost: number;
  metadata: Record<string, any>; // The flexible JSONB field
}

export interface Capability extends TenantBase {
  name: string;
}

export interface ResourceCapability {
  resource_id: string;
  capability_id: string;
  proficiency: number; // 1-10
}
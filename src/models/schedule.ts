import { TenantBase } from './base.js';

export interface Allocation extends TenantBase {
  resource_id: string;
  duration: string; // Stored as a string representation of TSRANGE "[start, end)"
  task_id: string;
  status: 'PROPOSED' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}
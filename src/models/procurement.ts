// types/procurement.ts
import { TenantBase } from './base.js';

export type POStatus = 'DRAFT' | 'SENT' | 'RECEIVED' | 'CANCELLED';

export interface PurchaseOrder extends TenantBase {
  vendor_name: string;
  status: POStatus;
  total_amount: number;
  metadata: Record<string, any>;
}

export interface POLineItem extends TenantBase {
  purchase_order_id: string;
  inventory_id: string;
  quantity: number;
  unit_price: number;
}
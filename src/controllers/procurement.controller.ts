import { Request, Response, NextFunction } from 'express';
import { ProcurementService } from '../services/procurement.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createPO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const po = await ProcurementService.createPurchaseOrder(req.tenantId!, req.body);
    return sendSuccess(res, po, 'Purchase Order created as DRAFT', 201);
  } catch (error) {
    next(error);
  }
};

export const receivePO = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // We pass req.userId so the inventory transaction knows who received the stock
    const po = await ProcurementService.receivePurchaseOrder(req.tenantId!, id, req.userId!);
    return sendSuccess(res, po, 'Inventory updated and Ledger entries posted');
  } catch (error) {
    next(error);
  }
};
import { Request, Response, NextFunction } from 'express';
import { InventoryService } from '../services/inventory.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const listInventory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const items = await InventoryService.getItems(req.tenantId!);
    const lowStock = await InventoryService.getLowStock(req.tenantId!);
    
    return sendSuccess(res, { items, alerts: lowStock }, 'Inventory fetched');
  } catch (error) {
    next(error);
  }
};

export const addItem = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, sku, category, quantity, unitPrice, minStockLevel } = req.body;
  
      if (quantity < 0 || unitPrice < 0) {
        return res.status(400).json({
          success: false,
          message: "Quantity and Unit Price cannot be negative."
        });
      }
  
      const newItem = await InventoryService.addItem({
        tenantId: req.tenantId!,
        userId: req.userId!,
        name,
        sku,
        category,
        quantity: quantity || 0,
        unitPrice: unitPrice || 0,
        minStockLevel: minStockLevel || 5
      });
  
      return sendSuccess(res, newItem, 'Item added to inventory successfully', 201);
    } catch (error) {
      next(error);
    }
  };

export const adjustStock = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { itemId, projectId, change, type, reason } = req.body;
  
      const result = await InventoryService.adjustStock({
        tenantId: req.tenantId!,
        userId: req.userId!,
        itemId,
        projectId,
        change,
        type,
        reason
      });
  
      return sendSuccess(res, result, `Inventory ${type} recorded successfully`);
    } catch (error) {
      next(error);
    }
};

  export const toggleStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const { isActive } = req.body; // true to restore, false to "delete"

    const result = await InventoryService.toggleItemStatus(req.tenantId!, itemId, isActive);
    
    const message = isActive ? 'Item restored successfully' : 'Item retired successfully';
    return sendSuccess(res, result, message);
  } catch (error) {
    next(error);
  }
};

export const getTransactionHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { itemId } = req.params;
    const history = await InventoryService.getTransactionHistory(req.tenantId!, itemId);
    return sendSuccess(res, history, 'Transaction history fetched');
  } catch (error) {
    next(error);
  }
};
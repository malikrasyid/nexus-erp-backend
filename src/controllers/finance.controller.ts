import { Request, Response, NextFunction } from 'express';
import { FinanceService } from '../services/finance.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const getProjectReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const report = await FinanceService.getProjectFinancials(req.tenantId!, req.params.projectId);
    return sendSuccess(res, report, 'Financial report generated');
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const transaction = await FinanceService.recordTransaction(req.tenantId!, req.body);
    return sendSuccess(res, transaction, 'Transaction recorded', 201);
  } catch (error) {
    next(error);
  }
};

export const billAllocation = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { allocationId } = req.params;
      const transaction = await FinanceService.generateAllocationExpense(req.tenantId!, allocationId);
      return sendSuccess(res, transaction, 'Allocation successfully billed to project');
    } catch (error) {
      next(error);
    }
  };
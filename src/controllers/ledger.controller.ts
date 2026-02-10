import { Request, Response, NextFunction } from 'express';
import { LedgerService } from '../services/ledger.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const getTrialBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // req.tenantId is provided by your Hybrid Middleware
    const data = await LedgerService.getTrialBalance(req.tenantId!);
    return sendSuccess(res, data, 'Trial balance retrieved successfully');
  } catch (error) {
    next(error);
  }
};

export const getBalanceSheet = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const summary = await LedgerService.getBalanceSheet(req.tenantId!);
    
    // Formatting the summary into a structured object for the frontend
    const report = {
      assets: summary.filter(a => a.type === 'ASSET'),
      liabilities: summary.filter(a => a.type === 'LIABILITY'),
      equity: summary.filter(a => a.type === 'EQUITY'),
      timestamp: new Date()
    };

    return sendSuccess(res, report, 'Balance sheet generated');
  } catch (error) {
    next(error);
  }
};

export const postManualJournal = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { description, entries } = req.body;
    
    // Manual journals are high-risk, so we ensure the service handles the balance check
    const result = await LedgerService.createJournalEntry({
      tenantId: req.tenantId!,
      description,
      entries
    });

    return sendSuccess(res, result, 'Journal entry posted successfully', 201);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const getStatement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { accountId } = req.params;
    const history = await LedgerService.getAccountStatement(req.tenantId!, accountId);
    return sendSuccess(res, history, 'Account statement retrieved');
  } catch (error) {
    next(error);
  }
};
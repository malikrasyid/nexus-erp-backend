import { Request, Response, NextFunction } from 'express';
import { InvoiceService } from '../services/invoice.service.js';
import { sendSuccess } from '../utils/response.util.js';

export const createInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Expects { client_name, project_id, items: [{ description, amount }] }
    const invoice = await InvoiceService.createInvoice(req.tenantId!, req.body);
    return sendSuccess(res, invoice, 'Invoice draft created', 201);
  } catch (error) {
    next(error);
  }
};

export const finalizeInvoice = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    // This triggers the Ledger entries: Debit AR / Credit Revenue
    const invoice = await InvoiceService.finalizeInvoice(req.tenantId!, id);
    return sendSuccess(res, invoice, 'Invoice finalized and revenue recognized');
  } catch (error) {
    next(error);
  }
};

export const getProjectInvoices = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { projectId } = req.params;
    const invoices = await InvoiceService.getInvoicesByProject(req.tenantId!, projectId);
    return sendSuccess(res, invoices, 'Project invoices retrieved');
  } catch (error) {
    next(error);
  }
};
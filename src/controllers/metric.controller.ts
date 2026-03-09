import { Request, Response } from 'express';
import { MetricService } from '../services/metric.service.js';

export const getDashboardSummary = async (req: Request, res: Response) => {
  try {
    // req.tenantId is guaranteed to exist because of your authenticate middleware
    const tenantId = req.tenantId; 

    if (!tenantId) {
      return res.status(403).json({ success: false, message: 'No active workspace found.' });
    }

    const metrics = await MetricService.getDashboardMetrics(tenantId);

    res.status(200).json({
      success: true,
      data: metrics
    });
  } catch (error) {
    console.error('Failed to fetch dashboard metrics:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while calculating metrics.' 
    });
  }
};
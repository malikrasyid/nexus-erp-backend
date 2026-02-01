import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response.util.js';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Error] ${err.message}`);

  // Handle specific PostgreSQL errors (like Exclusion Constraint overlaps)
  if (err.code === '23P01') {
    return sendError(res, 'Resource is already booked for this time period.', 409);
  }

  // Handle Supabase/Postgres unique constraint violations
  if (err.code === '23505') {
    return sendError(res, 'Record already exists.', 400);
  }

  return sendError(res, err.message || 'Internal Server Error', err.status || 500);
};
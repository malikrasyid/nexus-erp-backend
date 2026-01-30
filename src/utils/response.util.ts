import { Response } from 'express';

export const sendSuccess = (res: Response, data: any, message = 'Success', code = 200) => {
  return res.status(code).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (res: Response, error: any, code = 500) => {
  const message = error instanceof Error ? error.message : error;
  return res.status(code).json({
    success: false,
    message: message || 'An unexpected error occurred',
  });
};
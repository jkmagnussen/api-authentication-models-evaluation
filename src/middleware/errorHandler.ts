import { NextFunction, Request, Response } from 'express';
import { log } from '../logger';

export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (res.headersSent) {
    return next(err);
  }

  const error = typeof err === 'object' && err !== null ? err : {};
  const status = 'status' in error && typeof error.status === 'number' ? error.status : 500;
  const message =
    'message' in error && typeof error.message === 'string'
      ? error.message
      : 'Internal Server Error';

  if (status >= 500) {
    log('error', 'Unhandled request error', {
      method: req.method,
      path: req.originalUrl,
      status,
      error: message,
    });
  }

  res.status(status).json({ error: message });
}

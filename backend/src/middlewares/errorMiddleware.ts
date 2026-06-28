import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function errorMiddleware(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  logger.error({ err, path: req.path, method: req.method }, 'Unhandled error');

  const status  = err.status ?? err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  res.status(status).json({
    success: false,
    error: { message },
  });
}
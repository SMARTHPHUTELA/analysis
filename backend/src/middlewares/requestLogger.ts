import { Request, Response, NextFunction } from 'express';
import { logger } from '../config/logger';

export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  res.on('finish', () => {
    logger.info({
      method:  req.method,
      path:    req.path,
      status:  res.statusCode,
      duration: Date.now() - start,
      org:     req.ctx?.organizationId,
      feature: req.ctx?.feature,
    }, 'Request completed');
  });

  next();
}
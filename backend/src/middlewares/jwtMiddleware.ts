import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload }         from '../utils/jwt';
import { sendError }                       from '../utils/response';

declare global {
  namespace Express {
    interface Request {
      user: JwtPayload;
    }
  }
}

export function jwtMiddleware(
  req:  Request,
  res:  Response,
  next: NextFunction
): void {
  const token =
    req.cookies?.['acp_token'] ??
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    sendError(res, 'Authentication required', 401);
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    sendError(res, 'Invalid or expired token', 401);
  }
}
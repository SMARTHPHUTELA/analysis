import jwt          from 'jsonwebtoken';
import { config }   from '../config/config';

export interface JwtPayload {
  userId:         string;
  email:          string;
  role:           'admin' | 'manager';
  organizationId: string | null;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, config.auth.jwtSecret, {
    expiresIn: config.auth.jwtExpiresIn,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, config.auth.jwtSecret) as JwtPayload;
}
import { Request, Response, NextFunction } from 'express';
import { lruCache }           from '../cache/lruCache';
import { redisClient }        from '../cache/redis';
import { apiKeyRepository }   from '../repositories/apiKeyRepository';
import { hashApiKey }         from '../utils/encryption';
import { sendError }          from '../utils/response';
import { logger }             from '../config/logger';
import { ProxyRequestContext } from '../types';

declare global {
  namespace Express {
    interface Request {
      ctx: ProxyRequestContext;
    }
  }
}

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  const proxyKey  = req.headers['x-proxy-key'] as string | undefined;
  const feature   = req.headers['x-feature']   as string | undefined;
  const customerId = req.headers['x-customer-id'] as string | undefined;

  if (!proxyKey) {
    sendError(res, 'Missing x-proxy-key header', 401);
    return;
  }

  if (!feature) {
    sendError(res, 'Missing x-feature header', 400);
    return;
  }

  const keyHash = hashApiKey(proxyKey);

  // ── Level 1: LRU in-process cache ─────────────────────────
  const lruHit = lruCache.get(keyHash);
  if (lruHit) {
    req.ctx = {
      organizationId:   lruHit.organizationId,
      organizationSlug: lruHit.organizationSlug,
      keyId:            lruHit.keyId,
      scopes:           lruHit.scopes,
      monthlyBudget:    lruHit.monthlyBudget,
      feature,
      customerId:       customerId ?? null,
      requestId:        req.headers['x-request-id'] as string ?? crypto.randomUUID(),
    };
    return next();
  }

  // ── Level 2: Redis cache ───────────────────────────────────
  try {
    const redisHit = await redisClient.getApiKey(keyHash);
    if (redisHit) {
      const parsed = JSON.parse(redisHit);
      lruCache.set(keyHash, parsed);
      req.ctx = {
        organizationId:   parsed.organizationId,
        organizationSlug: parsed.organizationSlug,
        keyId:            parsed.keyId,
        scopes:           parsed.scopes,
        monthlyBudget:    parsed.monthlyBudget,
        feature,
        customerId:       customerId ?? null,
        requestId:        req.headers['x-request-id'] as string ?? crypto.randomUUID(),
      };
      return next();
    }
  } catch (err) {
    logger.warn({ err }, 'Redis lookup failed — falling through to DB');
  }

  // ── Level 3: PostgreSQL ────────────────────────────────────
  try {
    const row = await apiKeyRepository.findByHash(keyHash);

    if (!row) {
      sendError(res, 'Invalid or inactive API key', 401);
      return;
    }

    const cacheData = {
      organizationId:   row.organization_id,
      organizationSlug: (row as any).org_slug,
      keyId:            row.id,
      scopes:           row.scopes,
      monthlyBudget:    0,
      orgStatus:        (row as any).org_status,
    };

    // Populate both caches
    lruCache.set(keyHash, cacheData);
    await redisClient.setApiKey(keyHash, cacheData).catch((err) =>
      logger.warn({ err }, 'Failed to write API key to Redis')
    );

    // Touch last_used_at without blocking
    apiKeyRepository.touchLastUsed(row.id).catch((err) =>
      logger.warn({ err }, 'Failed to update last_used_at')
    );

    req.ctx = {
      organizationId:   cacheData.organizationId,
      organizationSlug: cacheData.organizationSlug,
      keyId:            cacheData.keyId,
      scopes:           cacheData.scopes,
      monthlyBudget:    cacheData.monthlyBudget,
      feature,
      customerId:       customerId ?? null,
      requestId:        req.headers['x-request-id'] as string ?? crypto.randomUUID(),
    };

    return next();
  } catch (err) {
    logger.error({ err }, 'Auth middleware DB error');
    sendError(res, 'Authentication error', 500);
  }
}
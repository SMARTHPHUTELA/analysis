import { Request, Response }          from 'express';
import { apiKeyRepository }           from '../repositories/apiKeyRepository';
import { generateApiKey, hashApiKey } from '../utils/encryption';
import { lruCache }                   from '../cache/lruCache';
import { redisClient }                from '../cache/redis';
import { sendSuccess, sendError }     from '../utils/response';

export const apiKeyController = {
  async list(req: Request, res: Response): Promise<void> {
    try {
      const keys = await apiKeyRepository.findByOrganization(req.params['orgId']);
      sendSuccess(res, keys);
    } catch (err) {
      sendError(res, 'Failed to fetch API keys', 500);
    }
  },

  async create(req: Request, res: Response): Promise<void> {
    const { name, scopes, expiresAt } = req.body;
    const organizationId = req.params['orgId'];

    if (!name) {
      sendError(res, 'name is required', 400);
      return;
    }

    try {
      const plainKey = generateApiKey();
      const keyHash  = hashApiKey(plainKey);
      const prefix   = plainKey.substring(0, 12);

      const key = await apiKeyRepository.create({
        organizationId,
        name,
        keyHash,
        keyPrefix: prefix,
        scopes:    scopes ?? [],
        expiresAt: expiresAt ? new Date(expiresAt) : undefined,
      });

      // Return the plaintext key ONCE — never stored
      sendSuccess(res, { ...key, plaintext_key: plainKey }, 201);
    } catch (err) {
      sendError(res, 'Failed to create API key', 500);
    }
  },

  async revoke(req: Request, res: Response): Promise<void> {
    const { orgId, keyId } = req.params;

    try {
      const key = await apiKeyRepository.findById(keyId);

      if (!key) {
        sendError(res, 'API key not found', 404);
        return;
      }

      const revoked = await apiKeyRepository.deactivate(keyId, orgId);
      if (!revoked) {
        sendError(res, 'API key not found or already revoked', 404);
        return;
      }

      // Evict from both caches immediately
      lruCache.delete(key.key_hash);
      await redisClient.deleteApiKey(key.key_hash);

      sendSuccess(res, { message: 'API key revoked successfully' });
    } catch (err) {
      sendError(res, 'Failed to revoke API key', 500);
    }
  },
};
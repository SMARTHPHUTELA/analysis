import { query, queryOne } from '../config/database';
import { ApiKey } from '../types';

export const apiKeyRepository = {
  async findByHash(keyHash: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>(
      `SELECT ak.*, o.monthly_budget, o.status as org_status, o.slug as org_slug
       FROM api_keys ak
       JOIN organizations o ON o.id = ak.organization_id
       WHERE ak.key_hash = $1
         AND ak.is_active = TRUE
         AND (ak.expires_at IS NULL OR ak.expires_at > NOW())
         AND o.status = 'active'`,
      [keyHash]
    );
  },

  async findById(id: string): Promise<ApiKey | null> {
    return queryOne<ApiKey>(
      `SELECT * FROM api_keys WHERE id = $1`,
      [id]
    );
  },

  async findByOrganization(organizationId: string): Promise<ApiKey[]> {
    return query<ApiKey>(
      `SELECT * FROM api_keys
       WHERE organization_id = $1
       ORDER BY created_at DESC`,
      [organizationId]
    );
  },

  async create(data: {
    organizationId: string;
    name: string;
    keyHash: string;
    keyPrefix: string;
    scopes: string[];
    expiresAt?: Date;
  }): Promise<ApiKey> {
    const rows = await query<ApiKey>(
      `INSERT INTO api_keys
         (organization_id, name, key_hash, key_prefix, scopes, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        data.organizationId,
        data.name,
        data.keyHash,
        data.keyPrefix,
        data.scopes,
        data.expiresAt ?? null,
      ]
    );
    return rows[0];
  },

  async deactivate(id: string, organizationId: string): Promise<boolean> {
    const rows = await query(
      `UPDATE api_keys SET is_active = FALSE, updated_at = NOW()
       WHERE id = $1 AND organization_id = $2
       RETURNING id`,
      [id, organizationId]
    );
    return rows.length > 0;
  },

  async touchLastUsed(id: string): Promise<void> {
    await query(
      `UPDATE api_keys SET last_used_at = NOW() WHERE id = $1`,
      [id]
    );
  },
};
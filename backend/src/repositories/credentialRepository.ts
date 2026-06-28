import { query, queryOne } from '../config/database';
import { ProviderCredential, ProviderType } from '../types';

export const credentialRepository = {
  async findByOrgAndProvider(
    organizationId: string,
    provider: ProviderType
  ): Promise<ProviderCredential | null> {
    return queryOne<ProviderCredential>(
      `SELECT * FROM provider_credentials
       WHERE organization_id = $1
         AND provider = $2
         AND is_active = TRUE
       LIMIT 1`,
      [organizationId, provider]
    );
  },

  async create(data: {
    organizationId: string;
    provider: ProviderType;
    label: string;
    encryptedKey: string;
    iv: string;
    authTag: string;
  }): Promise<ProviderCredential> {
    const rows = await query<ProviderCredential>(
      `INSERT INTO provider_credentials
         (organization_id, provider, label, encrypted_key, iv, auth_tag)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (organization_id, provider, label) DO UPDATE SET
         encrypted_key = EXCLUDED.encrypted_key,
         iv            = EXCLUDED.iv,
         auth_tag      = EXCLUDED.auth_tag,
         is_active     = TRUE,
         updated_at    = NOW()
       RETURNING *`,
      [
        data.organizationId, data.provider, data.label,
        data.encryptedKey, data.iv, data.authTag,
      ]
    );
    return rows[0];
  },
};
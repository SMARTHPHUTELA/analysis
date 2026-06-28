import { Request, Response }          from 'express';
import { credentialRepository }       from '../repositories/credentialRepository';
import { encrypt }                    from '../utils/encryption';
import { sendSuccess, sendError }     from '../utils/response';
import { ProviderType }               from '../types';

const VALID_PROVIDERS: ProviderType[] = [
  'openai', 'anthropic', 'gemini', 'azure_openai'
];

export const credentialController = {
  async upsert(req: Request, res: Response): Promise<void> {
    const { provider, api_key, label } = req.body;
    const organizationId = req.params['orgId'];

    if (!provider || !api_key) {
      sendError(res, 'provider and api_key are required', 400);
      return;
    }

    if (!VALID_PROVIDERS.includes(provider)) {
      sendError(res, `Invalid provider. Must be one of: ${VALID_PROVIDERS.join(', ')}`, 400);
      return;
    }

    try {
      const { encrypted_key, iv, auth_tag } = encrypt(api_key);

      const credential = await credentialRepository.create({
        organizationId,
        provider,
        label:        label ?? 'default',
        encryptedKey: encrypted_key,
        iv,
        authTag:      auth_tag,
      });

      // Never return encrypted fields to client
      sendSuccess(res, {
        id:              credential.id,
        organization_id: credential.organization_id,
        provider:        credential.provider,
        label:           credential.label,
        is_active:       credential.is_active,
      }, 201);
    } catch (err) {
      sendError(res, 'Failed to save credential', 500);
    }
  },
};
import crypto from 'crypto';
import { LLMRequestBody } from '../types';

// Only fields that actually affect the LLM output are hashed.
// Adding/removing fields here changes the cache key for all future requests.
const CACHE_FIELDS: (keyof LLMRequestBody)[] = [
  'model',
  'messages',
  'prompt',
  'temperature',
  'max_tokens',
  'top_p',
  'system',
  'tools',
  'stream',
];

export function buildCacheKey(
  provider: string,
  body: LLMRequestBody
): string {
  const normalized: Record<string, any> = { provider };

  for (const field of CACHE_FIELDS) {
    if (body[field] !== undefined) {
      normalized[field] = body[field];
    }
  }

  const payload = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(payload).digest('hex');
}
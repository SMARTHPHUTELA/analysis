// import crypto from 'crypto';
// import { LLMRequestBody } from '../types';

// // Only fields that actually affect the LLM output are hashed.
// // Adding/removing fields here changes the cache key for all future requests.
// const CACHE_FIELDS: (keyof LLMRequestBody)[] = [
//   'model',
//   'messages',
//   'prompt',
//   'temperature',
//   'max_tokens',
//   'top_p',
//   'system',
//   'tools',
//   'stream',
// ];

// export function buildCacheKey(
//   provider: string,
//   body: LLMRequestBody
// ): string {
//   const normalized: Record<string, any> = { provider };

//   for (const field of CACHE_FIELDS) {
//     if (body[field] !== undefined) {
//       normalized[field] = body[field];
//     }
//   }

//   const payload = JSON.stringify(normalized, Object.keys(normalized).sort());
//   return crypto.createHash('sha256').update(payload).digest('hex');
// }


import crypto        from 'crypto';
import { LLMRequestBody } from '../types';

// Fields that affect LLM output
const CACHE_FIELDS: (keyof LLMRequestBody)[] = [
  'model', 'messages', 'prompt', 'temperature',
  'max_tokens', 'top_p', 'system', 'tools', 'stream',
];

// ── Exact cache key (used to store response) ──────────────────
export function buildCacheKey(
  provider: string,
  body:     LLMRequestBody
): string {
  const normalized: Record<string, any> = { provider };
  for (const field of CACHE_FIELDS) {
    if (body[field] !== undefined) normalized[field] = body[field];
  }
  const payload = JSON.stringify(normalized, Object.keys(normalized).sort());
  return crypto.createHash('sha256').update(payload).digest('hex');
}

// ── Extract prompt text from any provider format ──────────────
export function extractPromptText(body: LLMRequestBody): string {
  const parts: string[] = [];

  // System prompt
  if (body.system && typeof body.system === 'string') {
    parts.push(body.system);
  }

  // OpenAI / Anthropic messages array
  if (Array.isArray(body.messages)) {
    for (const msg of body.messages) {
      if (typeof msg.content === 'string') {
        parts.push(msg.content);
      } else if (Array.isArray(msg.content)) {
        for (const block of msg.content) {
          if (block.type === 'text') parts.push(block.text);
        }
      }
    }
  }

  // Legacy prompt string
  if (body.prompt && typeof body.prompt === 'string') {
    parts.push(body.prompt);
  }

  return parts.join(' ');
}

// ── Normalize text for comparison ─────────────────────────────
export function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ') // remove punctuation
    .replace(/\s+/g, ' ')          // collapse whitespace
    .trim();
}

// ── Extract meaningful words (remove stopwords) ───────────────
const STOPWORDS = new Set([
  'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
  'would', 'could', 'should', 'may', 'might', 'shall', 'can',
  'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
  'as', 'into', 'through', 'about', 'above', 'after', 'before',
  'and', 'or', 'but', 'not', 'so', 'if', 'then', 'than', 'that',
  'this', 'these', 'those', 'it', 'its', 'i', 'you', 'he', 'she',
  'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your',
  'his', 'our', 'their', 'what', 'which', 'who', 'how', 'when',
  'where', 'why', 'all', 'each', 'every', 'both', 'few', 'more',
  'most', 'other', 'some', 'such', 'no', 'up', 'out', 'just',
]);

export function extractKeywords(text: string): Set<string> {
  const words = normalizeText(text).split(' ');
  const keywords = new Set<string>();
  for (const word of words) {
    if (word.length > 2 && !STOPWORDS.has(word)) {
      keywords.add(word);
    }
  }
  return keywords;
}

// ── Jaccard similarity between two keyword sets ───────────────
// Returns 0.0 to 1.0
export function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;

  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union        = new Set([...setA, ...setB]);

  return intersection.size / union.size;
}

// ── Build a lookup fingerprint for fuzzy index ────────────────
// This is stored as the Redis key prefix for fuzzy lookup
export function buildFuzzyFingerprint(
  provider: string,
  model:    string,
  body:     LLMRequestBody
): string {
  const text     = extractPromptText(body);
  const keywords = extractKeywords(text);

  // Sort keywords for determinism
  const sortedKeywords = [...keywords].sort().join(',');

  const raw = `${provider}:${model}:${sortedKeywords}`;
  return crypto.createHash('sha256').update(raw).digest('hex');
}
// import Redis from 'ioredis';
// import { config } from '../config/config';
// import { logger } from '../config/logger';

// class RedisClient {
//   private client: Redis;
//   private isConnected = false;

//   constructor() {
//     this.client = new Redis(config.redis.url, {
//       maxRetriesPerRequest: 3,
//       enableReadyCheck: true,
//       lazyConnect: true,
//     });

//     this.client.on('connect', () => {
//       this.isConnected = true;
//       logger.info('Redis connected');
//     });

//     this.client.on('error', (err) => {
//       this.isConnected = false;
//       logger.error({ err }, 'Redis error');
//     });

//     this.client.on('close', () => {
//       this.isConnected = false;
//       logger.warn('Redis connection closed');
//     });
//   }

//   async connect(): Promise<void> {
//     await this.client.connect();
//   }

//   // ── API Key Cache ──────────────────────────────────────────

//   async getApiKey(keyHash: string): Promise<string | null> {
//     return this.client.get(`apikey:${keyHash}`);
//   }

//   async setApiKey(keyHash: string, orgData: object): Promise<void> {
//     await this.client.setex(
//       `apikey:${keyHash}`,
//       config.redis.apiKeyTtl,
//       JSON.stringify(orgData)
//     );
//   }

//   async deleteApiKey(keyHash: string): Promise<void> {
//     await this.client.del(`apikey:${keyHash}`);
//   }

//   // ── Response Cache ─────────────────────────────────────────

//   async getResponse(cacheKey: string): Promise<string | null> {
//     return this.client.get(`response:${cacheKey}`);
//   }

//   async setResponse(cacheKey: string, response: object): Promise<void> {
//     await this.client.setex(
//       `response:${cacheKey}`,
//       config.redis.responseCacheTtl,
//       JSON.stringify(response)
//     );
//   }

//   // ── Health ─────────────────────────────────────────────────

//   async ping(): Promise<boolean> {
//     try {
//       const result = await this.client.ping();
//       return result === 'PONG';
//     } catch {
//       return false;
//     }
//   }

//   getClient(): Redis {
//     return this.client;
//   }
// }

// export const redisClient = new RedisClient();

import Redis          from 'ioredis';
import { config }     from '../config/config';
import { logger }     from '../config/logger';

// Stored shape for each cached response
export interface CachedResponse {
  response:  any;
  keywords:  string[];   // keyword set used for similarity
  model:     string;
  provider:  string;
  cachedAt:  string;
}

class RedisClient {
  private client:      Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck:     true,
      lazyConnect:          true,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      logger.info('Redis connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      logger.error({ err }, 'Redis error');
    });

    this.client.on('close', () => {
      this.isConnected = false;
      logger.warn('Redis connection closed');
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  // ── API Key Cache ────────────────────────────────────────────

  async getApiKey(keyHash: string): Promise<string | null> {
    return this.client.get(`apikey:${keyHash}`);
  }

  async setApiKey(keyHash: string, orgData: object): Promise<void> {
    await this.client.setex(
      `apikey:${keyHash}`,
      config.redis.apiKeyTtl,
      JSON.stringify(orgData)
    );
  }

  async deleteApiKey(keyHash: string): Promise<void> {
    await this.client.del(`apikey:${keyHash}`);
  }

  // ── Response Cache (exact) ───────────────────────────────────

  async getResponse(cacheKey: string): Promise<CachedResponse | null> {
    const raw = await this.client.get(`response:exact:${cacheKey}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as CachedResponse;
    } catch {
      return null;
    }
  }

  async setResponse(
    cacheKey:  string,
    response:  any,
    keywords:  string[],
    model:     string,
    provider:  string
  ): Promise<void> {
    const payload: CachedResponse = {
      response,
      keywords,
      model,
      provider,
      cachedAt: new Date().toISOString(),
    };

    // Store exact cache entry
    await this.client.setex(
      `response:exact:${cacheKey}`,
      config.redis.responseCacheTtl,
      JSON.stringify(payload)
    );

    // Also store in fuzzy index — key = first 8 chars of cacheKey
    // so we can scan a small subset during fuzzy lookup
    const fuzzyIndexKey = `response:index:${provider}:${model}`;
    await this.client.sadd(fuzzyIndexKey, cacheKey);
    await this.client.expire(fuzzyIndexKey, config.redis.responseCacheTtl);
  }

  // ── Fuzzy Response Cache ─────────────────────────────────────
  // Scans cached responses for the same provider+model
  // and returns any entry with similarity >= threshold

  async getFuzzyResponse(
    provider:          string,
    model:             string,
    incomingKeywords:  string[],
    threshold:         number = 0.8
  ): Promise<{ cached: CachedResponse; similarity: number } | null> {
    try {
      // Get all cache keys for this provider+model combo
      const indexKey  = `response:index:${provider}:${model}`;
      const cacheKeys = await this.client.smembers(indexKey);

      if (!cacheKeys.length) return null;

      const incomingSet = new Set(incomingKeywords);
      let bestMatch:     CachedResponse | null = null;
      let bestScore:     number = 0;

      // Check each cached entry for similarity
      for (const key of cacheKeys) {
        const raw = await this.client.get(`response:exact:${key}`);
        if (!raw) continue;

        let cached: CachedResponse;
        try {
          cached = JSON.parse(raw) as CachedResponse;
        } catch {
          continue;
        }

        const cachedSet   = new Set(cached.keywords);
        const similarity  = jaccardSimilarity(incomingSet, cachedSet);

        logger.debug(
          { similarity, threshold, model, provider },
          'Fuzzy cache similarity score'
        );

        if (similarity >= threshold && similarity > bestScore) {
          bestScore  = similarity;
          bestMatch  = cached;
        }
      }

      if (bestMatch) {
        logger.info(
          { score: bestScore, threshold, model },
          'Fuzzy cache HIT'
        );
        return { cached: bestMatch, similarity: bestScore };
      }

      return null;
    } catch (err) {
      logger.warn({ err }, 'Fuzzy cache lookup failed');
      return null;
    }
  }

  // ── Health ───────────────────────────────────────────────────

  async ping(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  getClient(): Redis {
    return this.client;
  }
}

// ── Jaccard similarity (duplicated here to avoid circular import) ──
function jaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 1.0;
  if (setA.size === 0 || setB.size === 0) return 0.0;
  const intersection = new Set([...setA].filter((x) => setB.has(x)));
  const union        = new Set([...setA, ...setB]);
  return intersection.size / union.size;
}

export const redisClient = new RedisClient();
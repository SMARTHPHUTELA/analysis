import Redis from 'ioredis';
import { config } from '../config/config';
import { logger } from '../config/logger';

class RedisClient {
  private client: Redis;
  private isConnected = false;

  constructor() {
    this.client = new Redis(config.redis.url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      lazyConnect: true,
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

  // ── API Key Cache ──────────────────────────────────────────

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

  // ── Response Cache ─────────────────────────────────────────

  async getResponse(cacheKey: string): Promise<string | null> {
    return this.client.get(`response:${cacheKey}`);
  }

  async setResponse(cacheKey: string, response: object): Promise<void> {
    await this.client.setex(
      `response:${cacheKey}`,
      config.redis.responseCacheTtl,
      JSON.stringify(response)
    );
  }

  // ── Health ─────────────────────────────────────────────────

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

export const redisClient = new RedisClient();
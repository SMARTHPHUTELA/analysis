import { LRUCache } from 'lru-cache';
import { config } from '../config/config';

// What we store in LRU per validated API key
export interface CachedApiKeyData {
  organizationId: string;
  organizationSlug: string;
  keyId: string;
  scopes: string[];
  monthlyBudget: number;
  orgStatus: string;
}

class LruCacheService {
  private cache: LRUCache<string, CachedApiKeyData>;

  constructor() {
    this.cache = new LRUCache<string, CachedApiKeyData>({
      max: config.lruCache.maxSize,
      ttl: config.lruCache.ttlMs,
      updateAgeOnGet: false,
    });
  }

  get(keyHash: string): CachedApiKeyData | undefined {
    return this.cache.get(keyHash);
  }

  set(keyHash: string, data: CachedApiKeyData): void {
    this.cache.set(keyHash, data);
  }

  delete(keyHash: string): void {
    this.cache.delete(keyHash);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

export const lruCache = new LruCacheService();
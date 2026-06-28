import dotenv from 'dotenv';
dotenv.config();

function required(key: string): string {
  const val = process.env[key];
  if (!val) throw new Error(`Missing required env var: ${key}`);
  return val;
}

function optional(key: string, fallback: string): string {
  return process.env[key] ?? fallback;
}

export const config = {
  env:  optional('NODE_ENV', 'development'),
  port: parseInt(optional('PORT', '3000'), 10),

  db: {
    url:     required('DATABASE_URL'),
    poolMin: parseInt(optional('DB_POOL_MIN', '2'), 10),
    poolMax: parseInt(optional('DB_POOL_MAX', '20'), 10),
  },

  redis: {
    url:              required('REDIS_URL'),
    apiKeyTtl:        parseInt(optional('REDIS_API_KEY_TTL_SECONDS', '300'), 10),
    responseCacheTtl: parseInt(optional('REDIS_RESPONSE_CACHE_TTL_SECONDS', '3600'), 10),
  },

  encryption: {
    key: required('ENCRYPTION_KEY'),
  },

  auth: {
    jwtSecret:   required('JWT_SECRET'),
    adminApiKey: required('ADMIN_API_KEY'),
  },

  lruCache: {
    maxSize: parseInt(optional('LRU_CACHE_MAX_SIZE', '1000'), 10),
    ttlMs:   parseInt(optional('LRU_CACHE_TTL_MS', '300000'), 10),
  },

  alerts: {
    slackWebhookUrl: process.env['SLACK_WEBHOOK_URL'],
    fromEmail:       process.env['ALERT_FROM_EMAIL'],
  },
} as const;
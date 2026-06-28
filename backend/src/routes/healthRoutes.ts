import { Router }       from 'express';
import { pool }         from '../config/database';
import { redisClient }  from '../cache/redis';
import { lruCache }     from '../cache/lruCache';

const router = Router();

router.get('/', async (req, res) => {
  const checks = await Promise.allSettled([
    pool.query('SELECT 1'),
    redisClient.ping(),
  ]);

  const db    = checks[0].status === 'fulfilled';
  const redis = checks[1].status === 'fulfilled' &&
                (checks[1] as PromiseFulfilledResult<boolean>).value;

  const healthy = db && redis;

  res.status(healthy ? 200 : 503).json({
    status:    healthy ? 'ok' : 'degraded',
    timestamp: new Date().toISOString(),
    checks: {
      database: db    ? 'ok' : 'error',
      redis:    redis ? 'ok' : 'error',
      lruCache: { status: 'ok', size: lruCache.size() },
    },
  });
});

export default router;
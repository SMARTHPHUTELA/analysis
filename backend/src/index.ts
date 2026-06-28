import { config }          from './config/config';
import { logger }          from './config/logger';
import { testConnection }  from './config/database';
import { redisClient }     from './cache/redis';
import app                 from './app';

async function bootstrap(): Promise<void> {
  // Verify infrastructure connections before accepting traffic
  logger.info('Connecting to PostgreSQL...');
  await testConnection();

  logger.info('Connecting to Redis...');
  await redisClient.connect();

  const server = app.listen(config.port, () => {
    logger.info(
      { port: config.port, env: config.env },
      `AI Cost Proxy running`
    );
  });

  // ── Graceful shutdown ────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, 'Shutdown signal received');

    server.close(async () => {
      logger.info('HTTP server closed');

      try {
        const { pool } = await import('./config/database');
        await pool.end();
        logger.info('DB pool closed');
      } catch (err) {
        logger.error({ err }, 'Error closing DB pool');
      }

      logger.info('Shutdown complete');
      process.exit(0);
    });

    // Force exit after 15s if graceful shutdown hangs
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 15_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT',  () => shutdown('SIGINT'));

  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled promise rejection');
  });

  process.on('uncaughtException', (err) => {
    logger.error({ err }, 'Uncaught exception — shutting down');
    process.exit(1);
  });
}

bootstrap().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
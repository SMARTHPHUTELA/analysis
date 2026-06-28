import { Pool, PoolClient } from 'pg';
import { config } from './config';
import { logger } from './logger';

const pool = new Pool({
  connectionString: config.db.url,
  min: config.db.poolMin,
  max: config.db.poolMax,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('connect', () => {
  logger.debug('New DB connection established');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Unexpected DB pool error');
});

export async function query<T = any>(
  sql: string,
  params?: any[]
): Promise<T[]> {
  const start = Date.now();
  const result = await pool.query(sql, params);
  logger.debug({ sql, duration: Date.now() - start, rows: result.rowCount }, 'DB query');
  return result.rows as T[];
}

export async function queryOne<T = any>(
  sql: string,
  params?: any[]
): Promise<T | null> {
  const rows = await query<T>(sql, params);
  return rows[0] ?? null;
}

export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

export async function testConnection(): Promise<void> {
  const client = await pool.connect();
  await client.query('SELECT 1');
  client.release();
  logger.info('Database connection verified');
}

export { pool };

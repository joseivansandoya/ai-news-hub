import { Pool, PoolConfig } from 'pg';
import { config } from '@/config/backend';
import { logger } from '@/lib/logger';

interface DatabaseConfig extends PoolConfig {
  connectionString: string;
}

export function createDatabasePool(): Pool {
  const databaseConfig: DatabaseConfig = {
    connectionString: config.databaseConnectionString,
    ssl: config.environment === 'production'
      ? { rejectUnauthorized: false }
      : false,
    max: 20,                          // Maximum pool size
    idleTimeoutMillis: 30000,         // Close idle clients after 30s
    connectionTimeoutMillis: 2000,    // Timeout connection attempts after 2s
  };

  const pool = new Pool(databaseConfig);

  // Connection error handling
  pool.on('error', (err) => {
    logger.error('Unexpected database error', { error: err.message });
  });

  // Log successful connection (optional, helpful for debugging)
  pool.on('connect', () => {
    logger.debug('New database connection established');
  });

  // Test connection immediately
  pool.query('SELECT NOW()', (err, result) => {
    if (err) {
      logger.error('Database connection test failed', { error: err.message });
      process.exit(1);
    } else {
      logger.info('Database connected successfully', {
        timestamp: result.rows[0].now
      });
    }
  });

  return pool;
}

// Graceful shutdown handler
export async function closeDatabasePool(pool: Pool): Promise<void> {
  try {
    await pool.end();
    logger.info('Database pool closed gracefully');
  } catch (error) {
    logger.error('Error closing database pool', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    throw error;
  }
}

import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '@/lib/logger';

export abstract class BaseRepository {
  protected pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Execute a query with error handling and logging
   */
  protected async query<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<QueryResult<T>> {
    const start = Date.now();

    try {
      const result = await this.pool.query<T>(text, params);
      const duration = Date.now() - start;

      logger.debug('Query executed', {
        duration,
        rows: result.rowCount,
      });

      return result;
    } catch (error) {
      logger.error('Query failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        query: text,
      });
      throw error;
    }
  }

  /**
   * Execute a query and return a single row or null
   */
  protected async queryOne<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T | null> {
    const result = await this.query<T>(text, params);
    return result.rows[0] || null;
  }

  /**
   * Execute a query and return all rows
   */
  protected async queryMany<T extends QueryResultRow = any>(
    text: string,
    params?: any[]
  ): Promise<T[]> {
    const result = await this.query<T>(text, params);
    return result.rows;
  }

  /**
   * Begin a transaction
   */
  protected async beginTransaction(): Promise<PoolClient> {
    const client = await this.pool.connect();
    await client.query('BEGIN');
    return client;
  }

  /**
   * Commit a transaction
   */
  protected async commitTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('COMMIT');
    } finally {
      client.release();
    }
  }

  /**
   * Rollback a transaction
   */
  protected async rollbackTransaction(client: PoolClient): Promise<void> {
    try {
      await client.query('ROLLBACK');
    } catch (error) {
      logger.error('Rollback failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      client.release();
    }
  }
}

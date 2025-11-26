import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Pool, PoolClient } from 'pg';
import { BaseRepository } from './BaseRepository';
import { logger } from '@/lib/logger';

const { mPool, mPoolClient } = vi.hoisted(() => {
  const mPoolClient = {
    query: vi.fn(),
    release: vi.fn(),
  };
  const mPool = {
    query: vi.fn(),
    connect: vi.fn(() => Promise.resolve(mPoolClient)),
    on: vi.fn(),
  };
  return { mPool, mPoolClient };
});

// Mock dependencies
vi.mock('pg', () => {
  return {
    Pool: vi.fn(function () {
      return mPool;
    }),
  };
});

vi.mock('@/lib/logger', () => ({
  logger: {
    debug: vi.fn(),
    error: vi.fn(),
  },
}));

// Concrete class for testing abstract BaseRepository
class TestRepository extends BaseRepository {
  public async testQuery(text: string, params?: any[]) {
    return this.query(text, params);
  }

  public async testQueryOne(text: string, params?: any[]) {
    return this.queryOne(text, params);
  }

  public async testQueryMany(text: string, params?: any[]) {
    return this.queryMany(text, params);
  }

  public async testBeginTransaction() {
    return this.beginTransaction();
  }

  public async testCommitTransaction(client: PoolClient) {
    return this.commitTransaction(client);
  }

  public async testRollbackTransaction(client: PoolClient) {
    return this.rollbackTransaction(client);
  }
}

describe('BaseRepository', () => {
  let pool: Pool;
  let repository: TestRepository;

  beforeEach(() => {
    pool = new Pool();
    repository = new TestRepository(pool);
    vi.clearAllMocks();
  });

  describe('query', () => {
    it('should execute a query and return the result', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mPool.query.mockResolvedValue(mockResult);

      const result = await repository.testQuery('SELECT * FROM test');

      expect(mPool.query).toHaveBeenCalledWith('SELECT * FROM test', undefined);
      expect(result).toEqual(mockResult);
      expect(logger.debug).toHaveBeenCalledWith('Query executed', expect.objectContaining({
        rows: 1,
      }));
    });

    it('should log error and throw if query fails', async () => {
      const error = new Error('Database error');
      mPool.query.mockRejectedValue(error);

      await expect(repository.testQuery('SELECT * FROM test')).rejects.toThrow('Database error');

      expect(logger.error).toHaveBeenCalledWith('Query failed', expect.objectContaining({
        error: 'Database error',
        query: 'SELECT * FROM test',
      }));
    });
  });

  describe('queryOne', () => {
    it('should return the first row if exists', async () => {
      const mockResult = { rows: [{ id: 1 }], rowCount: 1 };
      mPool.query.mockResolvedValue(mockResult);

      const result = await repository.testQueryOne('SELECT * FROM test');

      expect(result).toEqual({ id: 1 });
    });

    it('should return null if no rows exist', async () => {
      const mockResult = { rows: [], rowCount: 0 };
      mPool.query.mockResolvedValue(mockResult);

      const result = await repository.testQueryOne('SELECT * FROM test');

      expect(result).toBeNull();
    });
  });

  describe('queryMany', () => {
    it('should return all rows', async () => {
      const mockResult = { rows: [{ id: 1 }, { id: 2 }], rowCount: 2 };
      mPool.query.mockResolvedValue(mockResult);

      const result = await repository.testQueryMany('SELECT * FROM test');

      expect(result).toEqual([{ id: 1 }, { id: 2 }]);
    });
  });

  describe('Transactions', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('should begin a transaction', async () => {
      const client = await repository.testBeginTransaction();

      expect(mPool.connect).toHaveBeenCalled();
      expect(mPoolClient.query).toHaveBeenCalledWith('BEGIN');
      expect(client).toBe(mPoolClient);
    });

    it('should commit a transaction', async () => {
      await repository.testCommitTransaction(mPoolClient as any);

      expect(mPoolClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mPoolClient.release).toHaveBeenCalled();
    });

    it('should rollback a transaction', async () => {
      await repository.testRollbackTransaction(mPoolClient as any);

      expect(mPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mPoolClient.release).toHaveBeenCalled();
    });

    it('should handle rollback error', async () => {
      const error = new Error('Rollback failed');
      mPoolClient.query.mockRejectedValueOnce(error);

      await repository.testRollbackTransaction(mPoolClient as any);

      expect(mPoolClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(logger.error).toHaveBeenCalledWith('Rollback failed', expect.objectContaining({
        error: 'Rollback failed',
      }));
      expect(mPoolClient.release).toHaveBeenCalled();
    });
  });
});

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from 'vitest';
import { Pool } from 'pg';
import { createDatabasePool, closeDatabasePool } from './database';
import { config } from '@/config/backend';
import { logger } from '@/lib/logger';

// Mock external dependencies
vi.mock('pg', () => {
  const mPool = {
    on: vi.fn(),
    query: vi.fn(),
    end: vi.fn(),
  };
  return {
    Pool: vi.fn(function () { return mPool; }),
  };
});

vi.mock('@/config/backend', () => ({
  config: {
    databaseConnectionString: 'postgres://user:pass@localhost:5432/db',
    environment: 'development',
  },
}));

vi.mock('@/lib/logger', () => ({
  logger: {
    info: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('database', () => {
  let pool: any;

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset config to default before each test
    (config as any).environment = 'development';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createDatabasePool', () => {
    it('should create a pool with correct configuration in development', () => {
      pool = createDatabasePool();

      expect(Pool).toHaveBeenCalledWith({
        connectionString: 'postgres://user:pass@localhost:5432/db',
        ssl: false,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
    });

    it('should create a pool with correct configuration in production', () => {
      (config as any).environment = 'production';
      pool = createDatabasePool();

      expect(Pool).toHaveBeenCalledWith(expect.objectContaining({
        ssl: { rejectUnauthorized: false },
      }));
    });

    it('should set up event listeners', () => {
      pool = createDatabasePool();
      expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function));
      expect(pool.on).toHaveBeenCalledWith('connect', expect.any(Function));
    });

    it('should log "New database connection established" on connect event', () => {
      pool = createDatabasePool();
      // Get the callback passed to pool.on('connect', ...)
      const connectCallback = (pool.on as Mock).mock.calls.find(call => call[0] === 'connect')![1];
      connectCallback();
      expect(logger.debug).toHaveBeenCalledWith('New database connection established');
    });

    it('should log error on error event', () => {
      pool = createDatabasePool();
      const errorCallback = (pool.on as Mock).mock.calls.find(call => call[0] === 'error')![1];
      const error = new Error('Connection lost');
      errorCallback(error);
      expect(logger.error).toHaveBeenCalledWith('Unexpected database error', { error: 'Connection lost' });
    });

    it('should execute SELECT NOW() on initialization', () => {
      pool = createDatabasePool();
      expect(pool.query).toHaveBeenCalledWith('SELECT NOW()', expect.any(Function));
    });

    it('should log success if initial query succeeds', () => {
      pool = createDatabasePool();
      const queryCallback = (pool.query as Mock).mock.calls[0][1];
      const mockResult = { rows: [{ now: '2023-01-01T00:00:00.000Z' }] };

      queryCallback(null, mockResult);

      expect(logger.info).toHaveBeenCalledWith('Database connected successfully', {
        timestamp: '2023-01-01T00:00:00.000Z'
      });
    });

    it('should log error and exit if initial query fails', () => {
      const mockExit = vi.spyOn(process, 'exit').mockImplementation((() => { }) as any);
      pool = createDatabasePool();
      const queryCallback = (pool.query as Mock).mock.calls[0][1];
      const error = new Error('Connection failed');

      queryCallback(error, null);

      expect(logger.error).toHaveBeenCalledWith('Database connection test failed', { error: 'Connection failed' });
      expect(mockExit).toHaveBeenCalledWith(1);
    });
  });

  describe('closeDatabasePool', () => {
    it('should call pool.end() and log success', async () => {
      pool = new Pool();
      (pool.end as Mock).mockResolvedValue(undefined);

      await closeDatabasePool(pool);

      expect(pool.end).toHaveBeenCalled();
      expect(logger.info).toHaveBeenCalledWith('Database pool closed gracefully');
    });

    it('should log error and throw if pool.end() fails', async () => {
      pool = new Pool();
      const error = new Error('Failed to close');
      (pool.end as Mock).mockRejectedValue(error);

      await expect(closeDatabasePool(pool)).rejects.toThrow('Failed to close');
      expect(logger.error).toHaveBeenCalledWith('Error closing database pool', { error: 'Failed to close' });
    });
  });
});

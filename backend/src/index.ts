import express from 'express';
import cors from 'cors';
import { Pool } from 'pg';
import { createDatabasePool, closeDatabasePool } from '@/lib/database';
import { config } from '@/config/backend';
import { logger } from '@/lib/logger';
import { BriefingsRepository } from '@/repositories/BriefingsRepository';
import { UsersRepository } from '@/repositories/UsersRepository';
import { StoriesRepository } from '@/repositories/StoriesRepository';
import { createBriefingsRoutes } from '@/routes/briefings.route';
import { createStoriesRoutes } from '@/routes/stories.route';
import { createUsersRoutes } from '@/routes/users.route';

async function startServer() {
  const app = express();
  const port = config.port;

  // Middleware
  app.use(cors({
    origin: 'http://localhost:3000',
  }));
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Create database pool
  const pool: Pool = createDatabasePool();

  // Routes
  app.use('/api/briefings', createBriefingsRoutes(
    new BriefingsRepository(pool),
    new StoriesRepository(pool)
  ));

  app.use('/api/stories', createStoriesRoutes(
    new StoriesRepository(pool)
  ));

  app.use('/api/users', createUsersRoutes(
    new UsersRepository(pool)
  ));

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Start server
  const server = app.listen(port, () => {
    logger.info('Server started', { port });
  });

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down...');

    server.close(async () => {
      logger.info('HTTP server closed');
      await closeDatabasePool(pool);
      process.exit(0);
    });

    setTimeout(() => {
      logger.error('Forced shutdown');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((error) => {
  logger.error('Failed to start server', { error: error.message });
  process.exit(1);
});

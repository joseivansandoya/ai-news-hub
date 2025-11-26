import { Router, Request, Response } from 'express';
import { BriefingRepository } from '@/repositories/BriefingRepository';

export function createBriefingRoutes(briefingRepo: BriefingRepository): Router {
  const router = Router();

  // GET /api/briefings/:id
  router.get('/:id', async (req: Request, res: Response) => {
    try {
      const briefing = await briefingRepo.findById(req.params.id);

      if (!briefing) {
        return res.status(404).json({ error: 'Briefing not found' });
      }

      res.json({ briefing });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/briefings/date/:date
  router.get('/date/:date', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(400).json({ error: 'x-user-id header required' });
      }

      const briefing = await briefingRepo.findByDate(req.params.date, userId);

      if (!briefing) {
        return res.status(404).json({ error: 'Briefing not found' });
      }

      res.json({ briefing });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // GET /api/briefings/user/recent
  router.get('/user/recent', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(400).json({ error: 'x-user-id header required' });
      }

      const limit = parseInt(req.query.limit as string) || 30;
      const briefings = await briefingRepo.findRecent(userId, limit);

      res.json({ briefings });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // POST /api/briefings
  router.post('/', async (req: Request, res: Response) => {
    try {
      const briefing = await briefingRepo.create(req.body);
      res.status(201).json({ briefing });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // PATCH /api/briefings/:id
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const briefing = await briefingRepo.update(req.params.id, req.body);

      if (!briefing) {
        return res.status(404).json({ error: 'Briefing not found' });
      }

      res.json({ briefing });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // DELETE /api/briefings/:id (soft delete)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await briefingRepo.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  return router;
}
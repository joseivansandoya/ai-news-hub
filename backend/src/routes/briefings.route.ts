import { Router, Request, Response } from 'express';
import { BriefingsRepository } from '@/repositories/BriefingsRepository';
import { BriefingsService } from '@/services/BriefingsService';

export function createBriefingsRoutes(briefingRepo: BriefingsRepository): Router {
  const router = Router();

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
      res.status(500).json({ error });
    }
  });

  // POST /api/briefings
  router.post('/', async (req: Request, res: Response) => {
    try {
      const briefingsService = new BriefingsService();
      const result = await briefingsService.generate();
      res.json(result.object);

      // const briefing = await briefingRepo.create(req.body);
      // res.status(201).json({ briefing });
    } catch (error) {
      res.status(500).json({ error });
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
      res.status(500).json({ error });
    }
  });

  // DELETE /api/briefings/:id (soft delete)
  router.delete('/:id', async (req: Request, res: Response) => {
    try {
      await briefingRepo.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error });
    }
  });

  return router;
}
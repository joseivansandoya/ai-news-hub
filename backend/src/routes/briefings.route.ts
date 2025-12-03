import { Router, Request, Response } from 'express';
import { BriefingsRepository } from '@/repositories/BriefingsRepository';
import { StoriesRepository } from '@/repositories/StoriesRepository';
import { BriefingsService } from '@/services/BriefingsService';
import { CreateBriefingDTO, CreateStoryDTO } from '@/types';

export function createBriefingsRoutes(
  briefingsRepo: BriefingsRepository,
  storiesRepo: StoriesRepository
): Router {
  const router = Router();

  // GET /api/briefings/date/:date
  router.get('/date/:date', async (req: Request, res: Response) => {
    try {
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(400).json({ error: 'x-user-id header required' });
      }

      const briefing = await briefingsRepo.findByDate(req.params.date, userId);

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
      // res.json(result);
      // store briefing in DB
      const briefingDto: CreateBriefingDTO = {
        userId: "32081148-16d1-4dfb-bc70-835af4d16122", // hardcoded for now
        date: new Date().toISOString(),
        metadata: result.metadata,
      };
      const briefing = await briefingsRepo.create(briefingDto);

      const storiesDtos: CreateStoryDTO[] = result.stories.map((story: any, index: number) => ({
        briefingId: briefing.id,
        title: story.title,
        summary: [], // Not provided by service yet
        content: [story.content], // Service returns string, DTO expects array
        sourceUrl: story.url,
        sourceName: story.sourceName,
        publishedAt: new Date(), // Not provided by service, using current time
        displayOrder: index,
        coverImageUrl: null,
        category: null,
        importance: null,
      }));

      const stories = await storiesRepo.createMany(storiesDtos);

      res.json({ briefing, stories });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error });
    }
  });

  // PATCH /api/briefings/:id
  router.patch('/:id', async (req: Request, res: Response) => {
    try {
      const briefing = await briefingsRepo.update(req.params.id, req.body);

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
      await briefingsRepo.softDelete(req.params.id);
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error });
    }
  });

  return router;
}
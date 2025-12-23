import { Router, Request, Response } from 'express';
import { StoriesRepository } from '@/repositories/StoriesRepository';

export function createStoriesRoutes(
  storiesRepo: StoriesRepository,
): Router {
  const router = Router();

  // GET /api/stories/:storyId
  router.get('/:storyId', async (req: Request, res: Response) => {
    try {
      const storyId = req.params.storyId;
      const userId = req.headers['x-user-id'] as string;

      if (!userId) {
        return res.status(400).json({ error: 'x-user-id header required' });
      }
      const story = await storiesRepo.findByIdAndUserId(storyId, userId);

      if (!story) {
        return res.status(404).json({ error: 'Story not found' });
      }

      res.json(story);
    } catch (error) {
      res.status(500).json({ error });
    }
  });

  return router;
}

import { Router, Request, Response } from 'express';

const router = Router();

// GET /
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

export default router;

import { Router, Request, Response } from 'express';

const router = Router();

// GET /
router.get('/', (req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;

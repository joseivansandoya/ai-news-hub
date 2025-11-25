import { Router, Request, Response } from 'express';

const router = Router();

// GET /{date}
router.get('/:date', (req: Request, res: Response) => {
  res.json({ success: true });
});

// POST /generate
router.post('/generate', (req: Request, res: Response) => {
  res.json({ success: true });
});

export default router;

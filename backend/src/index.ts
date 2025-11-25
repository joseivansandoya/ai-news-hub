import express, { Request, Response } from 'express';
import dotenv from 'dotenv';

import briefingsRouter from '@/routes/briefings.route';
import healthRouter from '@/routes/health.route';
import storiesRouter from '@/routes/stories.route';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

// Middleware
app.use(express.json());

// Routes
app.use('/health', healthRouter);
app.use('/api/briefings', briefingsRouter);
app.use('/api/stories', storiesRouter);
app.get('/', (req: Request, res: Response) => {
  res.send('AI News Hub');
});

app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

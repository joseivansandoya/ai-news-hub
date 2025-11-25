import express, { Request, Response } from 'express';

import { config } from '@/config/backend';
import briefingsRouter from '@/routes/briefings.route';
import healthRouter from '@/routes/health.route';
import storiesRouter from '@/routes/stories.route';

const app = express();
const PORT = config.port;

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

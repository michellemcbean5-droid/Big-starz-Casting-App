import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { appConfig } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import errorHandler from './middleware/errorHandler';
import authRoutes from './routes/auth';

const app = express();

// ─── Security & Middleware ──────────────────────────────────────────────

app.use(helmet());
app.use(cors({
  origin: appConfig.corsOrigin,
  credentials: true,
}));
app.use(compression());
app.use(morgan(appConfig.env === 'development' ? 'dev' : 'combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(generalLimiter);

// ─── Health Check ───────────────────────────────────────────────────────

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: appConfig.env,
    uptime: process.uptime(),
  });
});

// ─── API Routes ─────────────────────────────────────────────────────────

app.use('/api/v1/auth', authRoutes);

// ─── 404 Handler ────────────────────────────────────────────────────────

app.use((_req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    message: 'Route not found',
  });
});

// ─── Global Error Handler ───────────────────────────────────────────────

app.use(errorHandler);

// ─── Start Server ───────────────────────────────────────────────────────

const PORT = appConfig.port;

app.listen(PORT, () => {
  console.log(`🚀 Big Starz API server running on port ${PORT}`);
  console.log(`📊 Environment: ${appConfig.env}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

export default app;

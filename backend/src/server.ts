import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { appConfig } from './config';
import { generalLimiter } from './middleware/rateLimiter';
import errorHandler from './middleware/errorHandler';
import auditLogMiddleware from './middleware/auditLog';

// ─── Routes ───────────────────────────────────────────────────────────────

import authRoutes from './routes/auth';
import castingRoutes from './routes/casting';
import applicationRoutes from './routes/applications';
import talentRoutes from './routes/talent';
import searchRoutes from './routes/search';
import aiRoutes from './routes/ai';
import aiHistoryRoutes from './routes/ai-history';
import creditsRoutes from './routes/credits';
import digitalTwinRoutes from './routes/digital-twin';
import subscriptionRoutes from './routes/subscriptions';
import masterCodeRoutes from './routes/master-codes';
import earningsRoutes from './routes/earnings';
import contractRoutes from './routes/contracts';
import consentRoutes from './routes/consent';
import dmcaRoutes from './routes/dmca';
import auditRoutes from './routes/audit';

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
app.use('/api/v1/casting-calls', castingRoutes);
app.use('/api/v1/applications', applicationRoutes);
app.use('/api/v1/talent', talentRoutes);
app.use('/api/v1/search', searchRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/ai/generations', aiHistoryRoutes);
app.use('/api/v1/credits', creditsRoutes);
app.use('/api/v1/digital-twins', digitalTwinRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);
app.use('/api/v1/master-codes', masterCodeRoutes);
app.use('/api/v1/earnings', earningsRoutes);
app.use('/api/v1/contracts', contractRoutes);
app.use('/api/v1/consent', consentRoutes);
app.use('/api/v1/dmca', dmcaRoutes);
app.use('/api/v1/audit', auditRoutes);

// Apply audit log after all routes
app.use(auditLogMiddleware);

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

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Big Starz API server running on port ${PORT}`);
    console.log(`📊 Environment: ${appConfig.env}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  });
}

export default app;

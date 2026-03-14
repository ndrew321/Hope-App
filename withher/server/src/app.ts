import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';

import { initializeFirebase } from './services/FirebaseService';
import { generalRateLimit } from './middleware/rateLimitMiddleware';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

import authRoutes from './routes/auth';
import userRoutes from './routes/users';
import matchRoutes from './routes/matches';
import messageRoutes from './routes/messages';
import sessionRoutes from './routes/sessions';
import communityRoutes from './routes/community';
import eventRoutes from './routes/events';
import resourceRoutes from './routes/resources';
import safetyRoutes from './routes/safety';
import gamificationRoutes from './routes/gamification';
import notificationRoutes from './routes/notifications';

// Initialize Firebase Admin once
initializeFirebase();

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to known origins in production.
// Support both ALLOWED_ORIGINS and legacy CORS_ORIGIN for backward compatibility.
const allowedOrigins =
  process.env.ALLOWED_ORIGINS ?? process.env.CORS_ORIGIN ?? 'http://localhost:8081';

const parsedAllowedOrigins = allowedOrigins
  .split(',')
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (native mobile apps, curl)
      if (!origin || parsedAllowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  }),
);

// Gzip compression
app.use(compression());

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Request logger
app.use((req, _res, next) => {
  logger.debug({ method: req.method, url: req.url }, 'Incoming request');
  next();
});

// Global rate limit
app.use(generalRateLimit);

// Health check (unauthenticated)
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/community', communityRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/safety', safetyRoutes);
app.use('/api/gamification', gamificationRoutes);
app.use('/api/notifications', notificationRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found', code: 'NOT_FOUND' });
});

// Global error handler (must be last)
app.use(errorHandler);

export default app;

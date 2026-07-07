import 'reflect-metadata';

import cors from 'cors';
import express from 'express';
import morgan from 'morgan';

import { errorHandler, notFound } from './presentation/middleware';

import roomRoutes from './presentation/routes/room-routes';
import rateLimit from 'express-rate-limit';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.use(
    cors({
      origin: process.env.CLIENT_ORIGIN,
    })
  );

  if (process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
  }

  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 100,
      standardHeaders: true,
      legacyHeaders: false,
      message: { error: 'Too many requests', code: 'RATE_LIMITED' },
    })
  );

  app.use(
    express.json({
      limit: '100kb',
    })
  );

  app.get('/health', (_req, res) => {
    res.status(200).json({
      status: 'ok',
    });
  });

  app.use('/api/rooms', roomRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

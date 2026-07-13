import 'reflect-metadata';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';

import { errorHandler, notFound } from './presentation/middleware';
import { requestLogger } from './presentation/middleware/request-logger';
import roomRoutes from './presentation/routes/room-routes';

import { shutdownState } from './infrastructure/runtime/shutdown-state';
import { env, isProduction } from './infrastructure/config/env';

export function createApp() {
  const app = express();

  app.disable('x-powered-by');

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  );

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) {
          callback(null, true);

          return;
        }

        if (env.CLIENT_ORIGIN.includes(origin)) {
          callback(null, true);

          return;
        }

        callback(new Error(`Origin ${origin} is not allowed by CORS`));
      },
    })
  );

  app.use(requestLogger);

  app.use(
    rateLimit({
      windowMs: env.RATE_LIMIT_WINDOW_MS,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        error: 'Too many requests',
        code: 'RATE_LIMITED',
      },
    })
  );

  app.use(
    express.json({
      limit: '100kb',
    })
  );

  app.get('/health', (_req, res) => {
    const isShuttingDown = shutdownState.isShuttingDown();

    res.status(isShuttingDown ? 503 : 200).json({
      status: isShuttingDown ? 'shutting_down' : 'ok',
      env: isProduction ? 'production' : env.NODE_ENV,
    });
  });

  app.get('/ready', (_req, res) => {
    const isShuttingDown = shutdownState.isShuttingDown();

    res.status(isShuttingDown ? 503 : 200).json({
      ready: !isShuttingDown,
    });
  });

  app.use('/api/rooms', roomRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}

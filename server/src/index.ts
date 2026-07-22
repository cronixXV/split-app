import 'dotenv/config';
import 'reflect-metadata';

import { createServer } from 'node:http';

import { createApp } from './app';
import { env } from './infrastructure/config/env';
import sequelize from './infrastructure/database/connection';
import { logger } from './infrastructure/logger/logger';
import { setupGracefulShutdown } from './infrastructure/runtime/graceful-shutdown';
import { initRoomSocket } from './presentation/sockets';

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();

    logger.info('Database connected');

    const app = createApp();
    const httpServer = createServer(app);
    const socketServer = initRoomSocket(httpServer);

    setupGracefulShutdown({
      socketServer,
      cronTasks: [],
    });

    httpServer.listen(env.PORT, '0.0.0.0', () => {
      logger.info(
        {
          port: env.PORT,
        },
        'HTTP and Socket.IO server started'
      );
    });
  } catch (error) {
    logger.fatal(
      {
        error,
      },
      'Startup error'
    );

    process.exitCode = 1;
  }
}

void bootstrap();

import 'dotenv/config';
import 'reflect-metadata';
import cron from 'node-cron';
import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';
import { Op } from 'sequelize';

import { createApp } from './app';

import sequelize from './infrastructure/database/connection';
import { logger } from './infrastructure/logger/logger';
import { setupGracefulShutdown } from './infrastructure/runtime/graceful-shutdown';
import { Room } from './infrastructure/database/models';

import { initRoomSocket } from './presentation/sockets';
import { env } from './infrastructure/config/env';

const execAsync = promisify(exec);

async function runMigrations(): Promise<void> {
  logger.info('Running migrations');

  const { stdout, stderr } = await execAsync(
    'npx --no-install sequelize-cli db:migrate'
  );

  if (stdout) {
    logger.info(
      {
        stdout,
      },
      'Migrations stdout'
    );
  }

  if (stderr) {
    logger.warn(
      {
        stderr,
      },
      'Migrations stderr'
    );
  }

  logger.info('Migrations done');
}

function startCronJobs() {
  const cleanupTask = cron.schedule(env.CRON_CLEANUP_SCHEDULE, async () => {
    try {
      const cutoffDate = new Date();

      cutoffDate.setDate(cutoffDate.getDate() - env.ROOM_TTL_DAYS);

      const deleted = await Room.destroy({
        where: {
          createdAt: {
            [Op.lt]: cutoffDate,
          },
        },
      });

      if (deleted > 0) {
        logger.info(
          {
            deleted,
          },
          'Old rooms cleaned up'
        );
      }
    } catch (error) {
      logger.error(
        {
          error,
        },
        'Cron cleanup failed'
      );
    }
  });

  logger.info('Cron jobs started');

  return [cleanupTask];
}

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();

    logger.info('Database connected');

    await runMigrations();

    const app = createApp();

    const httpServer = createServer(app);

    const socketServer = initRoomSocket(httpServer);

    const cronTasks = startCronJobs();

    setupGracefulShutdown({
      socketServer,
      cronTasks,
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

    process.exit(1);
  }
}

void bootstrap();

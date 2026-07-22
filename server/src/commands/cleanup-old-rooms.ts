import 'dotenv/config';
import 'reflect-metadata';

import { Op } from 'sequelize';

import { env } from '../infrastructure/config/env';
import sequelize from '../infrastructure/database/connection';
import { Room } from '../infrastructure/database/models';
import { logger } from '../infrastructure/logger/logger';

async function cleanupOldRooms(): Promise<void> {
  await sequelize.authenticate();

  logger.info('Database connected for room cleanup');

  const cutoffDate = new Date(
    Date.now() - env.ROOM_TTL_DAYS * 24 * 60 * 60 * 1000
  );

  const deleted = await Room.destroy({
    where: {
      createdAt: {
        [Op.lt]: cutoffDate,
      },
    },
  });

  logger.info(
    {
      deleted,
      cutoffDate: cutoffDate.toISOString(),
      roomTtlDays: env.ROOM_TTL_DAYS,
    },
    'Old rooms cleanup completed'
  );
}

async function main(): Promise<void> {
  try {
    await cleanupOldRooms();
  } catch (error) {
    logger.fatal(
      {
        error,
      },
      'Old rooms cleanup failed'
    );

    process.exitCode = 1;
  } finally {
    try {
      await sequelize.close();
    } catch (error) {
      logger.error(
        {
          error,
        },
        'Failed to close database connection after cleanup'
      );

      process.exitCode = 1;
    }
  }
}

void main();

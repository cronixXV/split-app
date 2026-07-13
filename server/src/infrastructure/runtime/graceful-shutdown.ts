import type { Server as SocketServer } from 'socket.io';

import sequelize from '../database/connection';
import { logger } from '../logger/logger';

import { shutdownState } from './shutdown-state';

interface IStoppableTask {
  stop: () => void;
}

interface IGracefulShutdownOptions {
  socketServer: SocketServer;
  cronTasks: IStoppableTask[];
}

const SHUTDOWN_TIMEOUT_MS = 10_000;

/**
 * Socket.IO самостоятельно:
 *
 * 1. отключает клиентов;
 * 2. закрывает Engine.IO;
 * 3. закрывает связанный HTTP-сервер.
 */
function closeSocketServer(socketServer: SocketServer): Promise<void> {
  return new Promise(resolve => {
    socketServer.close(() => {
      resolve();
    });
  });
}

export function setupGracefulShutdown({
  socketServer,
  cronTasks,
}: IGracefulShutdownOptions): void {
  async function shutdown(signal: string): Promise<void> {
    /**
     * Защита от повторного запуска shutdown.
     *
     * Например, сначала может прийти SIGTERM,
     * а затем произойти дополнительная ошибка.
     */
    if (shutdownState.isShuttingDown()) {
      return;
    }

    shutdownState.startShutdown();

    logger.warn(
      {
        signal,
      },
      'Shutdown signal received'
    );

    /**
     * Docker и Kubernetes не должны бесконечно
     * ждать остановки приложения.
     */
    const timeout = setTimeout(() => {
      logger.fatal(
        {
          timeoutMs: SHUTDOWN_TIMEOUT_MS,
        },
        'Graceful shutdown timeout exceeded'
      );

      process.exit(1);
    }, SHUTDOWN_TIMEOUT_MS);

    /**
     * Сам таймер не должен удерживать процесс,
     * если все ресурсы уже успешно закрылись.
     */
    timeout.unref();

    try {
      /**
       * Не допускаем запуск новых cron-задач.
       */
      for (const task of cronTasks) {
        task.stop();
      }

      /**
       * Закрывает Socket.IO и связанный HTTP-сервер.
       */
      await closeSocketServer(socketServer);

      /**
       * Закрываем соединения Sequelize с Postgres.
       */
      await sequelize.close();

      clearTimeout(timeout);

      logger.info('Graceful shutdown completed');

      process.exit(0);
    } catch (error) {
      clearTimeout(timeout);

      logger.fatal(
        {
          err: error,
        },
        'Graceful shutdown failed'
      );

      process.exit(1);
    }
  }

  process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
  });

  process.once('SIGINT', () => {
    void shutdown('SIGINT');
  });

  process.once('uncaughtException', error => {
    logger.fatal(
      {
        err: error,
      },
      'Uncaught exception'
    );

    void shutdown('uncaughtException');
  });

  process.once('unhandledRejection', reason => {
    logger.fatal(
      {
        reason,
      },
      'Unhandled rejection'
    );

    void shutdown('unhandledRejection');
  });
}

import type { Server as HttpServer } from 'node:http';
import { Server, type Socket } from 'socket.io';
import { z } from 'zod';

import type {
  ClientToServerEvents,
  InterServerEvents,
  JoinRoomResult,
  ServerToClientEvents,
  SocketData,
  WsEvent,
} from '@shared/types';

import type { IRoomRepository } from '../../domain/repositories';

import { container } from '../../infrastructure/container';
import { logger } from '../../infrastructure/logger/logger';
import { env } from '../../infrastructure/config/env';

export type TAppSocketServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

type TAppSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

const roomPayloadSchema = z.object({
  roomId: z.string().uuid('Room id must be a valid UUID'),
});

/**
 * Ссылка на запущенный Socket.IO-сервер.
 *
 * REST-маршруты используют её для отправки
 * realtime-событий в комнаты.
 */
let ioServer: TAppSocketServer | null = null;

/**
 * Отправляет актуальное количество socket-соединений
 * всем подключениям комнаты.
 *
 * Сейчас count — это количество вкладок/соединений,
 * а не уникальных пользователей.
 */
async function broadcastPresence(
  io: TAppSocketServer,
  roomId: string
): Promise<void> {
  const sockets = await io.in(roomId).fetchSockets();

  io.to(roomId).emit('room_presence', {
    count: sockets.length,
  });
}

/**
 * Безопасно запускает пересчёт presence из обработчиков,
 * где результат не нужно ожидать.
 */
function updatePresence(io: TAppSocketServer, roomId: string): void {
  void broadcastPresence(io, roomId).catch(error => {
    logger.error(
      {
        error,
        roomId,
      },
      'Failed to update room presence'
    );
  });
}

/**
 * Отправляет бизнес-событие всем socket-соединениям комнаты.
 *
 * Изменение запускается REST-запросом, поэтому маршрут
 * не имеет надёжной связи с конкретным socket.id.
 * Событие получают все подключения комнаты, включая вкладку,
 * которая отправила HTTP-запрос.
 */
export function broadcastToRoom(roomId: string, event: WsEvent): void {
  if (!ioServer) {
    /**
     * Не превращаем успешную операцию с БД в HTTP 500
     * только из-за отсутствия realtime-слоя.
     */
    logger.error(
      {
        roomId,
        event,
      },
      'Socket.IO server is not initialized, event was skipped'
    );

    return;
  }

  ioServer.to(roomId).emit('event', event);
}

/**
 * Создаёт Socket.IO-сервер и регистрирует обработчики
 * подключений комнаты.
 *
 * Возвращает экземпляр Socket.IO server,
 * чтобы bootstrap мог корректно закрыть его
 * при graceful shutdown.
 */
export function initRoomSocket(httpServer: HttpServer): TAppSocketServer {
  if (ioServer) {
    throw new Error('Socket.IO server has already been initialized');
  }

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      /**
       * env.CLIENT_ORIGIN уже провалидирован через Zod
       * и имеет тип string[].
       */
      origin: env.CLIENT_ORIGIN,

      /**
       * Socket.IO handshake использует GET и POST.
       * DELETE здесь не нужен: это не REST API.
       */
      methods: ['GET', 'POST'],
    },

    /**
     * Клиент устанавливается отдельным npm-пакетом,
     * поэтому серверу не нужно раздавать browser bundle.
     */
    serveClient: false,
  });

  ioServer = io;

  const roomRepository = container.resolve<IRoomRepository>('IRoomRepository');

  io.on('connection', (socket: TAppSocket) => {
    logger.info(
      {
        socketId: socket.id,
      },
      'Socket connected'
    );

    socket.on('join_room', async (rawPayload, acknowledge) => {
      const parsed = roomPayloadSchema.safeParse(rawPayload);

      if (!parsed.success) {
        const result: JoinRoomResult = {
          ok: false,
          code: 'VALIDATION_ERROR',
          error: parsed.error.issues[0]?.message ?? 'Invalid room id',
        };

        acknowledge?.(result);

        return;
      }

      const { roomId } = parsed.data;

      try {
        /**
         * UUID может быть корректным,
         * но комнаты с таким ID может не существовать.
         */
        const room = await roomRepository.findById(roomId);

        if (!room) {
          acknowledge?.({
            ok: false,
            code: 'NOT_FOUND',
            error: 'Room not found',
          });

          return;
        }

        const previousRoomId = socket.data.roomId;

        /**
         * В текущем приложении одно соединение
         * подписано максимум на одну бизнес-комнату.
         */
        if (previousRoomId && previousRoomId !== roomId) {
          await socket.leave(previousRoomId);

          socket.data.roomId = undefined;

          await broadcastPresence(io, previousRoomId);
        }

        await socket.join(roomId);

        socket.data.roomId = roomId;

        logger.info(
          {
            socketId: socket.id,
            roomId,
          },
          'Socket joined room'
        );

        await broadcastPresence(io, roomId);

        acknowledge?.({
          ok: true,
          roomId,
        });
      } catch (error) {
        logger.error(
          {
            error,
            socketId: socket.id,
            roomId,
          },
          'Failed to join room'
        );

        acknowledge?.({
          ok: false,
          code: 'INTERNAL_ERROR',
          error: 'Failed to join room',
        });
      }
    });

    socket.on('leave_room', async rawPayload => {
      const parsed = roomPayloadSchema.safeParse(rawPayload);

      if (!parsed.success) {
        logger.warn(
          {
            socketId: socket.id,
            issues: parsed.error.issues,
          },
          'Invalid leave_room payload'
        );

        return;
      }

      const { roomId } = parsed.data;

      /**
       * Клиент может покинуть только комнату,
       * которая действительно записана в socket.data.
       */
      if (socket.data.roomId !== roomId) {
        logger.warn(
          {
            socketId: socket.id,
            requestedRoomId: roomId,
            activeRoomId: socket.data.roomId,
          },
          'Socket attempted to leave a room it has not joined'
        );

        return;
      }

      try {
        await socket.leave(roomId);

        socket.data.roomId = undefined;

        logger.info(
          {
            socketId: socket.id,
            roomId,
          },
          'Socket left room'
        );

        await broadcastPresence(io, roomId);
      } catch (error) {
        logger.error(
          {
            error,
            socketId: socket.id,
            roomId,
          },
          'Failed to leave room'
        );
      }
    });

    socket.on('disconnect', reason => {
      const roomId = socket.data.roomId;

      logger.info(
        {
          socketId: socket.id,
          roomId,
          reason,
        },
        'Socket disconnected'
      );

      if (!roomId) {
        return;
      }

      socket.data.roomId = undefined;

      /**
       * На момент disconnect Socket.IO уже удалил
       * соединение из его комнат.
       */
      updatePresence(io, roomId);
    });
  });

  return io;
}

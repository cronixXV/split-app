import type { Server as HttpServer } from 'node:http';

import type {
  ClientToServerEvents,
  InterServerEvents,
  JoinRoomResult,
  ServerToClientEvents,
  SocketData,
  WsEvent,
} from '@shared/types';

import { Server, type Socket } from 'socket.io';
import { z } from 'zod';

import type { IRoomRepository } from '../../domain/repositories';
import { container } from '../../infrastructure/container';

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
 * Модуль используется REST-маршрутами для broadcast.
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
    console.error(`Failed to update presence for room ${roomId}:`, error);
  });
}

/**
 * Отправляет бизнес-событие всем socket-соединениям комнаты.
 *
 * Так как изменение запускается REST-запросом, у маршрута
 * нет надёжной связи с конкретным socket.id. Поэтому событие
 * получают все подключения комнаты, включая вкладку,
 * которая отправила HTTP-запрос.
 */
export function broadcastToRoom(roomId: string, event: WsEvent): void {
  if (!ioServer) {
    /**
     * Не превращаем успешную операцию БД в HTTP 500
     * только из-за отсутствия realtime-слоя.
     */
    console.error(
      'Socket.IO server is not initialized. Event was skipped:',
      event
    );

    return;
  }

  ioServer.to(roomId).emit('event', event);
}

/**
 * Создаёт Socket.IO-сервер и регистрирует обработчики
 * подключений комнаты.
 */
export function initRoomSocket(httpServer: HttpServer): TAppSocketServer {
  if (ioServer) {
    throw new Error('Socket.IO server has already been initialized');
  }

  const clientOrigin = process.env.CLIENT_ORIGIN;

  if (!clientOrigin) {
    throw new Error('CLIENT_ORIGIN environment variable is required');
  }

  const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin: clientOrigin,

      /**
       * Socket.IO handshake использует GET и POST.
       * DELETE здесь не нужен: это не список методов REST API.
       */
      methods: ['GET', 'POST'],
    },

    /**
     * Клиент будет установлен отдельным npm-пакетом,
     * поэтому серверу не нужно раздавать browser bundle.
     */
    serveClient: false,
  });

  ioServer = io;

  const roomRepository = container.resolve<IRoomRepository>('IRoomRepository');

  io.on('connection', (socket: TAppSocket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

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
         * UUID может быть корректным, но комнаты
         * с таким ID может не существовать.
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

        console.log(`👤 Socket ${socket.id} joined room ${roomId}`);

        await broadcastPresence(io, roomId);

        acknowledge?.({
          ok: true,
          roomId,
        });
      } catch (error) {
        console.error(`Failed to join room ${roomId}:`, error);

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
        return;
      }

      const { roomId } = parsed.data;

      /**
       * Клиент может покинуть только комнату,
       * которая действительно записана в socket.data.
       */
      if (socket.data.roomId !== roomId) {
        return;
      }

      try {
        await socket.leave(roomId);

        socket.data.roomId = undefined;

        console.log(`👤 Socket ${socket.id} left room ${roomId}`);

        await broadcastPresence(io, roomId);
      } catch (error) {
        console.error(`Failed to leave room ${roomId}:`, error);
      }
    });

    socket.on('disconnect', reason => {
      const roomId = socket.data.roomId;

      console.log(`🔌 Socket disconnected: ${socket.id}; reason: ${reason}`);

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

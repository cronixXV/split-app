export interface Room {
  id: string;
  name: string;
  createdAt: string;
}

export interface Member {
  id: string;
  roomId: string;
  name: string;
}

export interface Expense {
  id: string;
  roomId: string;
  paidBy: string; // Member.id
  amount: number;
  description: string;
  split: string[]; // массив Member.id — кто участвует в расходе
  createdAt: string;
}

// Производные данные — вычисляются из расходов
export interface Balance {
  memberId: string;
  memberName: string;
  amount: number; // > 0 = тебе должны, < 0 = ты должен
}

export interface Transfer {
  from: string; // Member.id
  fromName: string;
  to: string; // Member.id
  toName: string;
  amount: number;
}

// Полный ответ GET /api/rooms/:id
export interface RoomDetails {
  room: Room;
  members: Member[];
  expenses: Expense[];
  balances: Balance[];
  transfers: Transfer[];
}

// События изменения данных комнаты
export interface WsExpenseAdded {
  type: 'expense_added';
  payload: Expense;
}

export interface WsExpenseDeleted {
  type: 'expense_deleted';
  payload: {
    id: string;
  };
}

export interface WsMemberAdded {
  type: 'member_added';
  payload: Member;
}

/**
 * Бизнес-события комнаты.
 *
 * room_presence не входит в WsEvent, потому что сервер
 * отправляет присутствие отдельным Socket.IO-событием.
 */
export type WsEvent = WsExpenseAdded | WsExpenseDeleted | WsMemberAdded;

// Socket.IO — события клиента
export interface JoinRoomPayload {
  roomId: string;
}

export interface LeaveRoomPayload {
  roomId: string;
}

/**
 * Результат выполнения join_room.
 *
 * Сервер возвращает его через acknowledgement callback.
 */
export type JoinRoomResult =
  | {
      ok: true;
      roomId: string;
    }
  | {
      ok: false;
      code: 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR';
      error: string;
    };

/**
 * События, которые клиент отправляет Socket.IO-серверу.
 */
export interface ClientToServerEvents {
  join_room: (
    payload: JoinRoomPayload,
    acknowledge?: (result: JoinRoomResult) => void
  ) => void;

  leave_room: (payload: LeaveRoomPayload) => void;
}

/**
 * События, которые Socket.IO-сервер отправляет клиенту.
 */
export interface ServerToClientEvents {
  /**
   * Единый канал для изменений данных комнаты.
   * Конкретное событие определяется через data.type.
   */
  event: (data: WsEvent) => void;

  /**
   * Количество активных socket-соединений в комнате.
   * Это количество вкладок/соединений, а не уникальных людей.
   */
  room_presence: (data: { count: number }) => void;
}

/**
 * События между несколькими экземплярами Socket.IO-сервера.
 * Пока горизонтальное масштабирование не используется.
 */
export type InterServerEvents = Record<string, never>;

/**
 * Данные, которые сервер хранит отдельно
 * для каждого socket-соединения.
 */
export interface SocketData {
  roomId?: string;
}

// DTO — тела HTTP-запросов
export interface CreateRoomDto {
  name: string;
}

export interface AddMemberDto {
  name: string;
}

export interface CreateExpenseDto {
  paidBy: string;
  amount: number;
  description: string;
  split: string[];
}

// Общие правила валидации
export const ROOM_NAME_MIN_LENGTH = 2;
export const ROOM_NAME_MAX_LENGTH = 100;

export const MEMBER_NAME_MIN_LENGTH = 2;
export const MEMBER_NAME_MAX_LENGTH = 50;

export const EXPENSE_DESCRIPTION_MIN_LENGTH = 3;
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 200;

export const MAX_EXPENSE_AMOUNT = 99_999_999.99;

// Временно
export {
  calculateBalances,
  minimizeTransfers,
  MAX_EXACT_TRANSFER_PARTICIPANTS,
  toCents,
  fromCents,
} from './settlement';

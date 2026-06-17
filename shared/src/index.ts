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

// Производные (вычисляются из расходов)

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

export interface WsExpenseAdded {
  type: 'expense_added';
  payload: Expense;
}

export interface WsExpenseDeleted {
  type: 'expense_deleted';
  payload: { id: string };
}

export interface WsMemberAdded {
  type: 'member_added';
  payload: Member;
}

export interface WsRoomPresence {
  type: 'room_presence';
  payload: { count: number };
}

export type WsEvent =
  | WsExpenseAdded
  | WsExpenseDeleted
  | WsMemberAdded
  | WsRoomPresence;

//  DTO — тела запросов

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

export const ROOM_NAME_MIN_LENGTH = 2;
export const ROOM_NAME_MAX_LENGTH = 100;

export const MEMBER_NAME_MIN_LENGTH = 2;
export const MEMBER_NAME_MAX_LENGTH = 50;

export const EXPENSE_DESCRIPTION_MIN_LENGTH = 3;
export const EXPENSE_DESCRIPTION_MAX_LENGTH = 200;

export const MAX_EXPENSE_AMOUNT = 99_999_999.99;

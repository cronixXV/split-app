import { Router } from 'express';

import {
  createRoomSchema,
  addMemberSchema,
  createExpenseSchema,
} from '../validators';

import {
  ExpenseRepository,
  MemberRepository,
  RoomRepository,
} from '../../infrastructure/repositories';

import { CreateRoomUseCase, GetRoomUseCase } from '../../application/room';

import { AddMemberUseCase } from '../../application/member';

import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
} from '../../application/expense';
import { asyncHandler } from '../middleware';

const router = Router();

const roomRepository = new RoomRepository();
const memberRepository = new MemberRepository();
const expenseRepository = new ExpenseRepository();

const createRoomUseCase = new CreateRoomUseCase(roomRepository);

const getRoomUseCase = new GetRoomUseCase(
  roomRepository,
  memberRepository,
  expenseRepository
);

const addMemberUseCase = new AddMemberUseCase(memberRepository, roomRepository);

const createExpenseUseCase = new CreateExpenseUseCase(
  expenseRepository,
  memberRepository,
  roomRepository
);

const deleteExpenseUseCase = new DeleteExpenseUseCase(expenseRepository);

/**
 * POST /api/rooms
 * Создать новую комнату
 */
router.post(
  '/',
  asyncHandler(async (req, res) => {
    const { name } = createRoomSchema.parse(req.body);

    const room = await createRoomUseCase.execute(name);

    res.status(201).json(room);
  })
);

/**
 * GET /api/rooms/:id
 * Получить комнату со всеми вычисленными данными
 */
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const roomDetails = await getRoomUseCase.execute(req.params.id);

    res.json(roomDetails);
  })
);

/**
 * POST /api/rooms/:id/members
 * Добавить участника в комнату
 */
router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const { name } = addMemberSchema.parse(req.body);

    const member = await addMemberUseCase.execute(req.params.id, name);

    res.status(201).json(member);
  })
);

/**
 * POST /api/rooms/:id/expenses
 * Добавить расход в комнату
 */
router.post(
  '/:id/expenses',
  asyncHandler(async (req, res) => {
    const dto = createExpenseSchema.parse(req.body);

    const expense = await createExpenseUseCase.execute(req.params.id, dto);

    res.status(201).json(expense);
  })
);

/**
 * DELETE /api/rooms/:id/expenses/:eid
 * Удалить расход только из указанной комнаты
 */
router.delete(
  '/:id/expenses/:eid',
  asyncHandler(async (req, res) => {
    await deleteExpenseUseCase.execute(req.params.id, req.params.eid);

    res.status(204).send();
  })
);

export default router;

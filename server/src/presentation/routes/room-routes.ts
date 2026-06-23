import { Router } from 'express';

import {
  createRoomSchema,
  addMemberSchema,
  createExpenseSchema,
  roomParamsSchema,
  expenseParamsSchema,
} from '../validators';

import { CreateRoomUseCase, GetRoomUseCase } from '../../application/room';

import { AddMemberUseCase } from '../../application/member';

import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
} from '../../application/expense';
import { asyncHandler } from '../middleware';
import { container } from '../../infrastructure/container';

const router = Router();

const createRoomUseCase = container.resolve(CreateRoomUseCase);
const getRoomUseCase = container.resolve(GetRoomUseCase);
const addMemberUseCase = container.resolve(AddMemberUseCase);
const createExpenseUseCase = container.resolve(CreateExpenseUseCase);
const deleteExpenseUseCase = container.resolve(DeleteExpenseUseCase);

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
    const { id } = roomParamsSchema.parse(req.params);

    const roomDetails = await getRoomUseCase.execute(id);

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
    const { id } = roomParamsSchema.parse(req.params);
    const { name } = addMemberSchema.parse(req.body);

    const member = await addMemberUseCase.execute(id, name);

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
    const { id } = roomParamsSchema.parse(req.params);
    const dto = createExpenseSchema.parse(req.body);

    const expense = await createExpenseUseCase.execute(id, dto);

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
    const { id, eid } = expenseParamsSchema.parse(req.params);

    await deleteExpenseUseCase.execute(id, eid);

    res.status(204).send();
  })
);
export default router;

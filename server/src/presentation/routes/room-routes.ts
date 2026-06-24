import { Router } from 'express';

import { container } from '../../infrastructure/container';

import { CreateRoomUseCase, GetRoomUseCase } from '../../application/room';

import { AddMemberUseCase } from '../../application/member';

import {
  CreateExpenseUseCase,
  DeleteExpenseUseCase,
} from '../../application/expense';

import { asyncHandler } from '../middleware';

import {
  addMemberSchema,
  createExpenseSchema,
  createRoomSchema,
  expenseParamsSchema,
  roomParamsSchema,
} from '../validators';

import { broadcastToRoom } from '../sockets';
import { toExpenseContract, toMemberContract } from '../mappers/api-mappers';

const router = Router();

const createRoomUseCase = container.resolve(CreateRoomUseCase);
const getRoomUseCase = container.resolve(GetRoomUseCase);
const addMemberUseCase = container.resolve(AddMemberUseCase);
const createExpenseUseCase = container.resolve(CreateExpenseUseCase);
const deleteExpenseUseCase = container.resolve(DeleteExpenseUseCase);

/**
 * POST /api/rooms
 * Создать новую комнату.
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
 * Получить комнату со всеми вычисленными данными.
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
 * Добавить участника и сообщить всем подключениям комнаты.
 */
router.post(
  '/:id/members',
  asyncHandler(async (req, res) => {
    const { id } = roomParamsSchema.parse(req.params);

    const { name } = addMemberSchema.parse(req.body);

    const member = await addMemberUseCase.execute(id, name);

    const memberContract = toMemberContract(member);

    broadcastToRoom(id, {
      type: 'member_added',
      payload: memberContract,
    });

    res.status(201).json(memberContract);
  })
);

/**
 * POST /api/rooms/:id/expenses
 * Добавить расход и сообщить всем подключениям комнаты.
 */
router.post(
  '/:id/expenses',
  asyncHandler(async (req, res) => {
    const { id } = roomParamsSchema.parse(req.params);

    const dto = createExpenseSchema.parse(req.body);

    const expense = await createExpenseUseCase.execute(id, dto);

    const expenseContract = toExpenseContract(expense);

    broadcastToRoom(id, {
      type: 'expense_added',
      payload: expenseContract,
    });

    res.status(201).json(expenseContract);
  })
);

/**
 * DELETE /api/rooms/:id/expenses/:eid
 * Удалить расход только из указанной комнаты.
 */
router.delete(
  '/:id/expenses/:eid',
  asyncHandler(async (req, res) => {
    const { id, eid } = expenseParamsSchema.parse(req.params);

    await deleteExpenseUseCase.execute(id, eid);

    broadcastToRoom(id, {
      type: 'expense_deleted',
      payload: {
        id: eid,
      },
    });

    res.status(204).send();
  })
);

export default router;

import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';

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
 * Body: { name: string }
 * Response: Room
 */
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name } = createRoomSchema.parse(req.body);
    const room = await createRoomUseCase.execute(name);
    res.status(201).json(room);
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors[0].message });
      return;
    }
    next(err);
  }
});

/**
 * GET /api/rooms/:id
 * Получить комнату со всеми данными:
 * участниками, расходами, балансами и минимизированными переводами
 * Response: RoomDetails
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const roomDetails = await getRoomUseCase.execute(req.params.id);
    res.json(roomDetails);
  } catch (err) {
    if (err instanceof Error && err.message === 'Room not found') {
      res.status(404).json({ error: 'Room not found' });
      return;
    }
    next(err);
  }
});

/**
 * POST /api/rooms/:id/members
 * Добавить участника в комнату
 * Body: { name: string }
 * Response: Member
 */
router.post(
  '/:id/members',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name } = addMemberSchema.parse(req.body);
      const member = await addMemberUseCase.execute(req.params.id, name);
      res.status(201).json(member);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors[0].message });
        return;
      }
      next(err);
    }
  }
);

/**
 * POST /api/rooms/:id/expenses
 * Добавить расход в комнату
 * Body: { paidBy: string, amount: number, description: string, split: string[] }
 * split — массив id участников, между которыми делится расход
 * Response: Expense
 */
router.post(
  '/:id/expenses',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = createExpenseSchema.parse(req.body);
      const expense = await createExpenseUseCase.execute(req.params.id, dto);
      res.status(201).json(expense);
    } catch (err) {
      if (err instanceof z.ZodError) {
        res.status(400).json({ error: err.errors[0].message });
        return;
      }
      next(err);
    }
  }
);

/**
 * DELETE /api/rooms/:id/expenses/:eid
 * Удалить расход из комнаты
 * Балансы и переводы пересчитаются автоматически при следующем GET /rooms/:id
 * Response: 204 No Content
 */
router.delete(
  '/:id/expenses/:eid',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await deleteExpenseUseCase.execute(req.params.eid);
      res.status(204).send();
    } catch (err) {
      if (err instanceof Error && err.message === 'Expense not found') {
        res.status(404).json({ error: 'Expense not found' });
        return;
      }
      next(err);
    }
  }
);

export default router;

import 'reflect-metadata';
import { container } from 'tsyringe';

import type {
  IExpenseRepository,
  IMemberRepository,
  IRoomRepository,
} from '../domain/repositories';

import {
  ExpenseRepository,
  MemberRepository,
  RoomRepository,
} from './repositories';

container.registerSingleton<IRoomRepository>('IRoomRepository', RoomRepository);

container.registerSingleton<IMemberRepository>(
  'IMemberRepository',
  MemberRepository
);

container.registerSingleton<IExpenseRepository>(
  'IExpenseRepository',
  ExpenseRepository
);

export { container };

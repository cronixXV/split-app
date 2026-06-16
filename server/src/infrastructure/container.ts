import 'reflect-metadata';
import { container } from 'tsyringe';

import { IRoomRepository } from '../domain/repositories/IRoomRepository';
import { IMemberRepository } from '../domain/repositories/IMemberRepository';
import { IExpenseRepository } from '../domain/repositories/IExpenseRepository';
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

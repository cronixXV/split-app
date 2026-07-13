import { Sequelize } from 'sequelize-typescript';
import { Expense } from './models/expense';
import { Member } from './models/member';
import { Room } from './models/room';
import { env } from '../config/env';

const sequelize = new Sequelize(env.DATABASE_URL, {
  models: [Room, Member, Expense],
  logging: false,
});

export default sequelize;

import 'reflect-metadata';
import { Sequelize } from 'sequelize-typescript';
import { Room } from './models/room';
import { Member } from './models/member';
import { Expense } from './models/expense';

const sequelize = new Sequelize(process.env.DATABASE_URL!, {
  dialect: 'postgres',
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  models: [Room, Member, Expense],
});

export default sequelize;

import 'reflect-metadata';
import './infrastructure/container';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { exec } from 'child_process';
import { promisify } from 'util';

import sequelize from './infrastructure/database/connection';

import { errorHandler, notFound } from './presentation/middleware';
import roomRoutes from './presentation/routes/room-routes';

const execAsync = promisify(exec);

async function runMigrations() {
  console.log('⏳ Running migrations...');
  const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');
  if (stdout) console.log(stdout);
  if (stderr) console.error(stderr);
  console.log('✅ Migrations done');
}

async function bootstrap() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await runMigrations();

    const app = express();

    app.use(cors({ origin: process.env.CLIENT_ORIGIN }));
    app.use(morgan('dev'));
    app.use(express.json());

    app.use('/api/rooms', roomRoutes);

    app.use(notFound);
    app.use(errorHandler);

    const PORT = process.env.PORT ?? 3001;
    app.listen(PORT, () => {
      console.log(`🚀 Server ready on port ${PORT}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

bootstrap();

import 'reflect-metadata';
import dotenv from 'dotenv';
dotenv.config();

import { exec } from 'child_process';
import { promisify } from 'util';
import sequelize from './infrastructure/database/connection';

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

    console.log('🚀 Server ready');
  } catch (error) {
    console.error('❌ Startup error:', error);
    process.exit(1);
  }
}

bootstrap();

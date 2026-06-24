import 'dotenv/config';
import 'reflect-metadata';

import { exec } from 'node:child_process';
import { createServer } from 'node:http';
import { promisify } from 'node:util';

import { createApp } from './app';

import sequelize from './infrastructure/database/connection';

import { initRoomSocket } from './presentation/sockets';

const execAsync = promisify(exec);

async function runMigrations(): Promise<void> {
  console.log('⏳ Running migrations...');

  const { stdout, stderr } = await execAsync('npx sequelize-cli db:migrate');

  if (stdout) {
    console.log(stdout);
  }

  if (stderr) {
    console.error(stderr);
  }

  console.log('✅ Migrations done');
}

function getPort(): number {
  const port = Number(process.env.PORT ?? 3001);

  if (!Number.isInteger(port) || port <= 0) {
    throw new Error(
      `PORT must be a positive integer, received: ${process.env.PORT}`
    );
  }

  return port;
}

async function bootstrap(): Promise<void> {
  try {
    await sequelize.authenticate();

    console.log('✅ Database connected');

    await runMigrations();

    const app = createApp();

    const httpServer = createServer(app);

    initRoomSocket(httpServer);

    const port = getPort();

    httpServer.listen(port, '0.0.0.0', () => {
      console.log(`🚀 HTTP and Socket.IO server ready on port ${port}`);
    });
  } catch (error) {
    console.error('❌ Startup error:', error);

    process.exit(1);
  }
}

void bootstrap();

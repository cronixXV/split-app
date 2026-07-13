import pino from 'pino';

import { env, isProduction } from '../config/env';

export const logger = pino({
  level: env.LOG_LEVEL,
  base: isProduction
    ? undefined
    : {
        pid: process.pid,
      },
  redact: {
    paths: [
      'req.headers.authorization',
      'req.headers.cookie',
      'res.headers["set-cookie"]',
    ],
    remove: true,
  },
});

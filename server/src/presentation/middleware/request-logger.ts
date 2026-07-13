import pinoHttp from 'pino-http';

import { logger } from '../../infrastructure/logger/logger';

export const requestLogger = pinoHttp({
  logger,
  customLogLevel(_req, res, error) {
    if (error || res.statusCode >= 500) {
      return 'error';
    }

    if (res.statusCode >= 400) {
      return 'warn';
    }

    return 'info';
  },
  customSuccessMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
  customErrorMessage(req, res) {
    return `${req.method} ${req.url} ${res.statusCode}`;
  },
});

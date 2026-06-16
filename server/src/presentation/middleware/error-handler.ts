import { Request, Response, NextFunction } from 'express';

export interface IAppError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: IAppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message = err.message ?? 'Internal server error';

  console.error(`[ERROR] ${statusCode}: ${message}`);

  res.status(statusCode).json({
    error: message,
  });
}

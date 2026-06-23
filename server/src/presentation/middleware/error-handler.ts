import type { ErrorRequestHandler } from 'express';
import { ZodError } from 'zod';
import { AppError } from '../../application/errors';

type TBodyParserError = Error & {
  status?: number;
  statusCode?: number;
  type?: string;
  body?: unknown;
  limit?: number;
  length?: number;
};

function isBodyParserError(error: unknown): error is TBodyParserError {
  return (
    error instanceof Error &&
    typeof (error as TBodyParserError).type === 'string' &&
    (error as TBodyParserError).type!.startsWith('entity.')
  );
}

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (
    isBodyParserError(error) &&
    (error.type === 'entity.too.large' ||
      error.status === 413 ||
      error.statusCode === 413)
  ) {
    res.status(413).json({
      error: 'Request body is too large',
      code: 'PAYLOAD_TOO_LARGE',
    });

    return;
  }

  if (isBodyParserError(error) && error.type === 'entity.parse.failed') {
    res.status(400).json({
      error: 'Malformed JSON',
      code: 'VALIDATION_ERROR',
    });

    return;
  }

  if (error instanceof ZodError) {
    res.status(400).json({
      error: 'Request validation failed',
      code: 'VALIDATION_ERROR',
      details: error.issues.map(issue => ({
        path: issue.path.join('.'),
        message: issue.message,
      })),
    });

    return;
  }

  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
      ...(error.details !== undefined && {
        details: error.details,
      }),
    });

    return;
  }

  console.error('Unhandled error:', error);

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  });
};

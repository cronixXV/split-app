import type { RequestHandler } from 'express';

import { NotFoundError } from '../../application/errors';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
};

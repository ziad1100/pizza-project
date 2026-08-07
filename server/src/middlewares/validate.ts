import type { RequestHandler } from 'express';
import { validationResult } from 'express-validator';
import { ApiError } from '../utils/ApiError';

export const validate: RequestHandler = (req, _res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
    return;
  }
  const messages = errors.array().map((e) => e.msg);
  next(new ApiError(422, messages.join(' | ')));
};

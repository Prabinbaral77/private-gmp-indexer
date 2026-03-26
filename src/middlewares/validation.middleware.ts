import { ZodSchema } from 'zod';
import { RequestHandler } from 'express';
import { HttpException } from '../exceptions/HttpException.js';

const validationMiddleware = (
  schema: ZodSchema,
  value: 'body' | 'query' | 'params' = 'body',
): RequestHandler => {
  return (req, _res, next) => {
    const result = schema.safeParse(req[value]);
    if (!result.success) {
      const message = result.error.errors.map(e => e.message).join(', ');
      next(new HttpException(400, message));
    } else {
      req[value] = result.data;
      next();
    }
  };
};

export default validationMiddleware;

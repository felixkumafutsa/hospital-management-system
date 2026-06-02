import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

// Zod validation middleware
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      next();
    } catch (error: any) {
      if (error.errors) {
        const details = error.errors.map((err: any) => ({
          field: err.path.join('.'),
          message: err.message
        }));
        next(new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', details));
      } else {
        next(error);
      }
    }
  };
};

// Express-validator based validation results handler (for backward compatibility)
export const validateExpressValidator = (req: Request, _res: Response, next: NextFunction) => {
  const { validationResult } = require('express-validator');
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ApiError(400, 'VALIDATION_ERROR', 'Invalid input data', errors.array());
  }
  next();
};
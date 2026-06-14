import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ApiError } from './errorHandler';

// Zod validation middleware
export const validate = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      // Check if schema expects nested structure (legacy pattern: { body, query, params })
      // Use type assertion to safely check for ZodObject shape
      const schemaAny = schema as any;
      const hasNestedProperties = schemaAny.shape && 
        ('body' in schemaAny.shape || 'query' in schemaAny.shape || 'params' in schemaAny.shape);
      
      if (hasNestedProperties) {
        // Legacy schema format - pass full request structure
        schema.parse({
          body: req.body || {},
          query: req.query || {},
          params: req.params || {}
        });
      } else {
        // New flat schema format - validate only what's needed for the method
        if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
          schema.parse(req.body);
        } else {
          // GET requests - validate query parameters
          schema.parse(req.query || {});
        }
      }
      next();
    } catch (error: any) {
      console.log("[VALIDATE] Error:", error);
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
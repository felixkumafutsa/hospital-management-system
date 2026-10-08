import { Request, Response, NextFunction } from 'express';
import logger from '../config/logger';

// Custom error class for API errors
export class ApiError extends Error {
  statusCode: number;
  code: string;
  details?: any[];

  constructor(
    statusCode: number,
    code: string,
    message: string,
    details?: any[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
const errorHandler = (
  err: Error | ApiError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Log the error
  logger.error({
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
  });

  // If it's our custom ApiError, send structured response
  if ('statusCode' in err && 'code' in err) {
    const apiError = err as ApiError;
    res.status(apiError.statusCode).json({
      success: false,
      error: {
        code: apiError.code,
        message: apiError.message,
        ...(apiError.details && { details: apiError.details }),
      },
    });
    return;
  }

  // Prisma specific error handling
  if (err.name === 'PrismaClientKnownRequestError') {
    // @ts-ignore - Prisma error has code property
    const prismaCode = err.code;
    let statusCode = 500;
    let code = 'DATABASE_ERROR';
    let message = 'A database error occurred';

    if (prismaCode === 'P2002') {
      statusCode = 409;
      code = 'UNIQUE_CONSTRAINT_VIOLATION';
      message = 'A record with this unique identifier already exists';
    } else if (prismaCode === 'P2025') {
      statusCode = 404;
      code = 'RECORD_NOT_FOUND';
      message = 'The requested record was not found';
    }

    res.status(statusCode).json({
      success: false,
      error: {
        code,
        message,
      },
    });
    return;
  }

  // Default 500 error for unhandled errors
  const isProduction = process.env.NODE_ENV === 'production';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isProduction ? 'An unexpected error occurred' : err.message,
      ...(!isProduction && { stack: err.stack }),
    },
  });
};

export default errorHandler;
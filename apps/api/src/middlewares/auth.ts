import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ApiError } from './errorHandler';
import { prisma } from '../config/database';

const JWT_PUBLIC_KEY = process.env.JWT_PUBLIC_KEY || 'your_public_key';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        roleId: string;
      };
    }
  }
}

// Authentication middleware to protect routes
export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  try {
    // Get authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new ApiError(401, 'MISSING_TOKEN', 'Authentication token is required');
    }

    // Extract token
    const token = authHeader.split(' ')[1];

    // Verify token
    const decoded = jwt.verify(token, JWT_PUBLIC_KEY, {
      algorithms: ['RS256'],
    }) as {
      userId: string;
      roleId: string;
      jti: string;
    };

    // Check if user exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { isActive: true },
    });

    if (!user || !user.isActive) {
      throw new ApiError(401, 'USER_INACTIVE', 'User account is inactive or does not exist');
    }

    // Attach user to request object
    req.user = {
      userId: decoded.userId,
      roleId: decoded.roleId,
    };

    next();
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      next(new ApiError(401, 'TOKEN_EXPIRED', 'Authentication token has expired'));
    } else if (error.name === 'JsonWebTokenError') {
      next(new ApiError(401, 'INVALID_TOKEN', 'Invalid authentication token'));
    } else {
      next(error);
    }
  }
};

// RBAC middleware to check permissions
export const requirePermission = (action: string, resource: string) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      // Get user's role and permissions
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          role: {
            include: {
              permissions: {
                where: {
                  action,
                  resource,
                },
              },
            },
          },
        },
      });

      if (!user || !user.role || user.role.permissions.length === 0) {
        throw new ApiError(403, 'FORBIDDEN', 'Insufficient permissions to perform this action');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

// Role-based authorization middleware
export const authorize = (allowedRoles: string[]) => {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      // First ensure user is authenticated
      if (!req.user) {
        throw new ApiError(401, 'UNAUTHORIZED', 'User not authenticated');
      }

      // Get user's role
      const user = await prisma.user.findUnique({
        where: { id: req.user.userId },
        include: {
          role: true,
        },
      });

      if (!user || !user.role) {
        throw new ApiError(403, 'FORBIDDEN', 'User role not found');
      }

      // Check if user's role is in the allowed list
      if (!allowedRoles.includes(user.role.name)) {
        throw new ApiError(403, 'FORBIDDEN', `Access denied. Required roles: ${allowedRoles.join(', ')}`);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/database';

// Audit log entry data
interface AuditLogData {
  action: string;
  resource: string;
  module?: string;
  resourceId?: string;
  before?: any;
  after?: any;
}

// Extend Express Request to include audit log method
declare global {
  namespace Express {
    interface Request {
      createAuditLog: (data: AuditLogData) => Promise<void>;
    }
  }
}

// Audit logging middleware
export const auditLogger = (req: Request, _res: Response, next: NextFunction) => {
  // Add createAuditLog method to request object
  req.createAuditLog = async (data: AuditLogData) => {
    try {
      // Only create audit log if user is authenticated
      if (req.user && req.user.userId) {
        await prisma.auditLog.create({
          data: {
            userId: req.user.userId,
            action: data.action,
            module: data.module || 'UNKNOWN',
            resource: data.resource,
            resourceId: data.resourceId,
            ipAddress: req.ip || req.socket.remoteAddress,
            userAgent: req.get('user-agent'),
            before: data.before,
            after: data.after,
          },
        });
      }
    } catch (error) {
      // Log error but don't block the main request
      console.error('Failed to create audit log:', error);
    }
  };

  next();
};

// Helper to capture request body for audit logging on write operations
export const captureAuditData = (action: string, resource: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Store the original send function
    const originalSend = res.send;

    // Override send to capture response data
    res.send = function (body) {
      // If the request was successful, create audit log
      if (res.statusCode >= 200 && res.statusCode < 300 && req.createAuditLog) {
        try {
          const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
          
          if (parsedBody.success && parsedBody.data) {
            const resourceId = parsedBody.data.id || (parsedBody.data && parsedBody.data.id);
            req.createAuditLog({
              action,
              resource,
              module: 'AUTO_CAPTURE',
              resourceId,
              before: null,
              after: req.body,
            });
          }
        } catch (error) {
          console.error('Failed to capture audit data:', error);
        }
      }

      // Call original send
      return originalSend.call(this, body);
    };

    next();
  };
};
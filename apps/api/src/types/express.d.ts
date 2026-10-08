import { Prisma, User } from '@prisma/client';

declare global {
  namespace Express {
    export interface Request {
      user?: User;
      createAuditLog: (data: {
        action: string;
        resource: string;
        module?: string;
        resourceId?: string;
        before?: Prisma.InputJsonValue | null;
        after?: Prisma.InputJsonValue | null;
      }) => Promise<void>;
    }
  }
}
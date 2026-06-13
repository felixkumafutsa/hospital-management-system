import { PrismaClient } from '@prisma/client';
import logger from './logger';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

// Single Prisma singleton used across all modules.
// Uses connection pooling params for Supabase PgBouncer compatibility.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'warn' },
      // Enable query logging only in development
      ...(process.env.NODE_ENV === 'development'
        ? [{ emit: 'event' as const, level: 'query' as const }]
        : []),
    ],
  });

// Prevent multiple instances during development hot-reload and Vercel cold starts
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// @ts-ignore — Prisma event types
prisma.$on('error', (e: any) => {
  logger.error(`Database error: ${e.message}`);
});

// @ts-ignore
prisma.$on('warn', (e: any) => {
  logger.warn(`Database warning: ${e.message}`);
});

if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('query', (e: any) => {
    logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`);
  });
}

// Graceful disconnect for serverless environments
if (process.env.VERCEL) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}

const connectDB = async (): Promise<void> => {
  try {
    await prisma.$connect();
    logger.info('Database connection established successfully');
  } catch (error) {
    logger.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

export default connectDB;

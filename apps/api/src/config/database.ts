import { Prisma, PrismaClient } from '@prisma/client';
import logger from './logger';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

const getDatabaseUrl = (): string | undefined => {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return undefined;

  const url = new URL(connectionString);
  const isPooler = url.hostname.includes('-pooler.');

  // Neon and other PgBouncer transaction-pooler URLs need this Prisma mode.
  if (isPooler) url.searchParams.set('pgbouncer', 'true');

  // Keep serverless instances from opening a large client-side pool each.
  if (!url.searchParams.has('connection_limit')) {
    url.searchParams.set('connection_limit', process.env.DATABASE_CONNECTION_LIMIT || (process.env.VERCEL ? '1' : '5'));
  }

  return url.toString();
};

// Single Prisma singleton used across all modules.
// Reuse a small client pool, including when connected through a PgBouncer pooler.
export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
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

// @ts-expect-error — Prisma event types
prisma.$on('error', (e: Prisma.LogEntry) => {
  logger.error(`Database error: ${e.message}`);
});

// @ts-expect-error
prisma.$on('warn', (e: Prisma.LogEntry) => {
  logger.warn(`Database warning: ${e.message}`);
});

if (process.env.NODE_ENV === 'development') {
  // @ts-expect-error
  prisma.$on('query', (e: Prisma.QueryEvent) => {
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
    throw error;
  }
};

export default connectDB;

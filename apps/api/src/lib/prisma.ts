import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: [
      { emit: 'event', level: 'error' },
      { emit: 'event', level: 'info' },
      { emit: 'event', level: 'warn' },
    ],
    // Fix: Limit connection pool size to stay under your 15 client limit
    datasources: {
      db: {
        url: `${process.env.DATABASE_URL}?pgbouncer=true&connection_limit=5`,
      },
    },
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Add event listeners for logging (dev only)
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  prisma.$on('error', (e: any) => {
    console.error(`Database Error: ${e.message}`);
  });
}

// Add cleanup for serverless environments
if (process.env.VERCEL) {
  process.on('beforeExit', async () => {
    await prisma.$disconnect();
  });
}
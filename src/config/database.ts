/**
 * Database Client
 * Prisma client singleton for database operations
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

/**
 * Prisma client singleton
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: [
      { level: 'warn', emit: 'event' },
      { level: 'error', emit: 'event' },
    ],
  });

// Log database events
prisma.$on('warn' as never, (e: { message: string }) => {
  logger.warn(e.message, 'DATABASE');
});

prisma.$on('error' as never, (e: { message: string }) => {
  logger.error(e.message, 'DATABASE');
});

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Connect to database
 */
export async function connectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    logger.db('Connected to database');
  } catch (error) {
    logger.error('Failed to connect to database', 'DATABASE', error);
    throw error;
  }
}

/**
 * Disconnect from database
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  logger.db('Disconnected from database');
}

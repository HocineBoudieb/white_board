import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

if (!process.env.DATABASE_URL || process.env.DATABASE_URL.trim().length === 0) {
  throw new Error('DATABASE_URL env variable is not set');
}

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;

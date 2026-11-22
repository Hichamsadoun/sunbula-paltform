import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as { prisma?: PrismaClient };
// Netlify DB exposes NETLIFY_DATABASE_URL; anywhere else use DATABASE_URL.
const url = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
export const db = g.prisma ?? new PrismaClient(url ? { datasourceUrl: url } : undefined);
if (process.env.NODE_ENV !== 'production') g.prisma = db;

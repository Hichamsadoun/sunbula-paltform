import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { db } from './db';
import type { Role } from '@prisma/client';

const COOKIE = 'sunbula_session';
const secret = () => {
  const s = process.env.AUTH_SECRET;
  if (!s && process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET is not set');
  return new TextEncoder().encode(s || 'dev-secret-change-me');
};

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  associationId: string | null;
};

export async function createSession(userId: string) {
  const token = await new SignJWT({ sub: userId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

export async function getUser(): Promise<SessionUser | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    const u = await db.user.findUnique({ where: { id: String(payload.sub) } });
    if (!u || !u.active) return null;
    return { id: u.id, name: u.name, email: u.email, role: u.role, associationId: u.associationId };
  } catch {
    return null;
  }
}

export async function requireUser(): Promise<SessionUser> {
  const u = await getUser();
  if (!u) redirect('/login');
  return u;
}

/** ADMIN and STAFF manage everything; ADMIN alone manages users and settings. */
export async function requireStaff(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role === 'ASSOCIATION') redirect('/dashboard');
  return u;
}

export async function requireAdmin(): Promise<SessionUser> {
  const u = await requireUser();
  if (u.role !== 'ADMIN') redirect('/dashboard');
  return u;
}

export const isStaff = (u: SessionUser) => u.role !== 'ASSOCIATION';

/** Prisma where-clause scoping a query to the user's association when they are an association account. */
export function scope(u: SessionUser): { associationId?: string } {
  return u.role === 'ASSOCIATION' ? { associationId: u.associationId ?? '__none__' } : {};
}

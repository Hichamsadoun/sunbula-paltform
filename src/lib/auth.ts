import 'server-only';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { SignJWT, jwtVerify } from 'jose';
import { randomBytes } from 'crypto';
import { db } from './db';
import type { Role } from '@prisma/client';

const COOKIE = 'sunbula_session';
let cached: Uint8Array | null = null;

/** Signing key: AUTH_SECRET if set, otherwise a random key generated once and kept in the database. */
async function secret(): Promise<Uint8Array> {
  if (cached) return cached;
  let s = process.env.AUTH_SECRET;
  if (!s) {
    const row = await db.setting.findUnique({ where: { key: 'authSecret' } });
    if (row) s = row.value;
    else {
      const fresh = randomBytes(32).toString('hex');
      await db.setting.upsert({ where: { key: 'authSecret' }, create: { key: 'authSecret', value: fresh }, update: {} });
      s = (await db.setting.findUniqueOrThrow({ where: { key: 'authSecret' } })).value;
    }
  }
  cached = new TextEncoder().encode(s);
  return cached;
}

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
    .sign(await secret());
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
    const { payload } = await jwtVerify(token, await secret());
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

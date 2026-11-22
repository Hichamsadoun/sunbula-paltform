'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import bcrypt from 'bcryptjs';
import type { Role } from '@prisma/client';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { audit, bool, opt, str } from '@/lib/forms';

export async function saveUser(id: string | null, f: FormData) {
  const u = await requireAdmin();
  const back = id ? `/users/${id}` : '/users/new';
  const role = (['ADMIN', 'STAFF', 'ASSOCIATION'].includes(str(f, 'role')) ? str(f, 'role') : 'STAFF') as Role;
  const password = str(f, 'password');
  const d = {
    name: str(f, 'name'),
    email: str(f, 'email').toLowerCase(),
    role,
    associationId: role === 'ASSOCIATION' ? opt(f, 'associationId') : null,
    active: id ? bool(f, 'active') : true,
  };
  if (!d.name || !d.email) redirect(`${back}?error=required`);
  if (role === 'ASSOCIATION' && !d.associationId) redirect(`${back}?error=assoc`);
  if (!id && password.length < 8) redirect(`${back}?error=password`);
  if (id && password && password.length < 8) redirect(`${back}?error=password`);
  if (id === u.id && (role !== 'ADMIN' || !d.active)) redirect(`${back}?error=self`);
  const dup = await db.user.findFirst({ where: { email: d.email, NOT: id ? { id } : undefined } });
  if (dup) redirect(`${back}?error=dup`);
  const data = { ...d, ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}) };
  const rec = id
    ? await db.user.update({ where: { id }, data })
    : await db.user.create({ data: { ...d, passwordHash: await bcrypt.hash(password, 10) } });
  await audit(u, id ? 'تعديل' : 'إضافة', 'مستخدم', rec.id, rec.email);
  revalidatePath('/users');
  redirect('/users');
}

export async function deleteUser(id: string) {
  const u = await requireAdmin();
  if (id === u.id) redirect(`/users/${id}?error=self`);
  const r = await db.user.delete({ where: { id } });
  await audit(u, 'حذف', 'مستخدم', id, r.email);
  revalidatePath('/users');
  redirect('/users');
}

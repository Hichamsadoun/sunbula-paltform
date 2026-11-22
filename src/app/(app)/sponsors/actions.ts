'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, opt, str } from '@/lib/forms';

export async function saveSponsor(id: string | null, f: FormData) {
  const u = await requireStaff();
  const d = { name: str(f, 'name'), phone: opt(f, 'phone'), email: opt(f, 'email'), notes: opt(f, 'notes') };
  if (!d.name) redirect(id ? `/sponsors/${id}/edit?error=1` : '/sponsors/new?error=1');
  const rec = id ? await db.sponsor.update({ where: { id }, data: d }) : await db.sponsor.create({ data: d });
  await audit(u, id ? 'تعديل' : 'إضافة', 'كافل', rec.id, rec.name);
  revalidatePath('/sponsors');
  redirect(`/sponsors/${rec.id}`);
}

export async function deleteSponsor(id: string) {
  const u = await requireStaff();
  await db.orphan.updateMany({ where: { sponsorId: id, status: 'SPONSORED' }, data: { status: 'WAITING' } });
  const s = await db.sponsor.delete({ where: { id } });
  await audit(u, 'حذف', 'كافل', id, s.name);
  revalidatePath('/sponsors');
  redirect('/sponsors');
}

'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, bool, date, num, opt, str } from '@/lib/forms';

export async function saveOrphan(id: string | null, f: FormData) {
  const u = await requireStaff();
  const back = id ? `/orphans/${id}/edit` : '/orphans/new';
  const sponsorId = opt(f, 'sponsorId');
  const d = {
    code: str(f, 'code'),
    name: str(f, 'name'),
    gender: opt(f, 'gender'),
    birthDate: date(f, 'birthDate'),
    country: str(f, 'country'),
    guardian: opt(f, 'guardian'),
    monthlyAmount: num(f, 'monthlyAmount'),
    associationId: str(f, 'associationId'),
    sponsorId,
    notes: opt(f, 'notes'),
    status: bool(f, 'ended') ? ('ENDED' as const) : sponsorId ? ('SPONSORED' as const) : ('WAITING' as const),
  };
  if (!d.code || !d.name || !d.country || !d.associationId || d.monthlyAmount == null) redirect(`${back}?error=required`);
  const dup = await db.orphan.findFirst({ where: { code: d.code, NOT: id ? { id } : undefined } });
  if (dup) redirect(`${back}?error=dup`);
  const data = { ...d, monthlyAmount: d.monthlyAmount };
  const rec = id ? await db.orphan.update({ where: { id }, data }) : await db.orphan.create({ data });
  await audit(u, id ? 'تعديل' : 'إضافة', 'يتيم', rec.id, `${rec.code} ${rec.name}`);
  revalidatePath('/orphans');
  redirect(`/orphans/${rec.id}`);
}

export async function deleteOrphan(id: string) {
  const u = await requireStaff();
  const o = await db.orphan.delete({ where: { id } });
  await audit(u, 'حذف', 'يتيم', id, o.name);
  revalidatePath('/orphans');
  redirect('/orphans');
}

export async function recordSponsorship(orphanId: string, f: FormData) {
  const u = await requireStaff();
  const month = str(f, 'month');
  const amount = num(f, 'amount');
  if (/^\d{4}-\d{2}$/.test(month) && amount && amount > 0) {
    await db.sponsorshipPayment.upsert({
      where: { orphanId_month: { orphanId, month } },
      create: { orphanId, month, amount },
      update: { amount, paidAt: new Date() },
    });
    await audit(u, 'تسجيل كفالة', 'يتيم', orphanId, `${month} ${amount}`);
  }
  revalidatePath(`/orphans/${orphanId}`);
}

export async function deleteSponsorship(id: string) {
  await requireStaff();
  const p = await db.sponsorshipPayment.delete({ where: { id } });
  revalidatePath(`/orphans/${p.orphanId}`);
}

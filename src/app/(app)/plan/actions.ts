'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, num, opt, str } from '@/lib/forms';

export async function saveTarget(f: FormData) {
  const u = await requireStaff();
  const year = num(f, 'year');
  const country = str(f, 'country');
  const sector = str(f, 'sector');
  const amount = num(f, 'amount');
  if (!year || !country || amount == null || amount < 0) redirect(`/plan?year=${year ?? ''}&error=required`);
  const where = { year_country_sector: { year, country, sector } };
  await db.planTarget.upsert({ where, create: { year, country, sector, amount, notes: opt(f, 'notes') }, update: { amount, notes: opt(f, 'notes') } });
  await audit(u, 'تحديد', 'هدف الخطة', undefined, `${year} ${country} ${sector} ${amount}`);
  revalidatePath('/plan');
  redirect(`/plan?year=${year}`);
}

export async function deleteTarget(id: string) {
  const u = await requireStaff();
  const t = await db.planTarget.delete({ where: { id } });
  await audit(u, 'حذف', 'هدف الخطة', id, `${t.year} ${t.country} ${t.sector}`);
  revalidatePath('/plan');
  redirect(`/plan?year=${t.year}`);
}

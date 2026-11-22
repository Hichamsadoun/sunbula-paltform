'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, date, num, opt, str } from '@/lib/forms';

export async function saveDonation(id: string | null, f: FormData) {
  const u = await requireStaff();
  const back = id ? `/donations/${id}/edit` : '/donations/new';
  const projectId = opt(f, 'projectId');
  let associationId = opt(f, 'associationId');
  if (projectId && !associationId) {
    associationId = (await db.project.findUnique({ where: { id: projectId }, select: { associationId: true } }))?.associationId ?? null;
  }
  const d = {
    donorName: str(f, 'donorName'),
    amount: num(f, 'amount'),
    date: date(f, 'date') ?? new Date(),
    method: opt(f, 'method'),
    reference: opt(f, 'reference'),
    notes: opt(f, 'notes'),
    projectId,
    associationId,
  };
  if (!d.donorName || !d.amount || d.amount <= 0) redirect(`${back}?error=required`);
  const data = { ...d, amount: d.amount };
  const rec = id ? await db.donation.update({ where: { id }, data }) : await db.donation.create({ data });
  await audit(u, id ? 'تعديل' : 'إضافة', 'تبرع', rec.id, `${rec.donorName} ${rec.amount}`);
  revalidatePath('/donations');
  redirect('/donations');
}

export async function deleteDonation(id: string) {
  const u = await requireStaff();
  const d = await db.donation.delete({ where: { id } });
  await audit(u, 'حذف', 'تبرع', id, `${d.donorName} ${d.amount}`);
  revalidatePath('/donations');
  redirect('/donations');
}

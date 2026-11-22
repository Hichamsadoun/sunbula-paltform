'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, date, num, opt, str } from '@/lib/forms';

export async function savePayment(id: string | null, f: FormData) {
  const u = await requireStaff();
  const back = id ? `/payments/${id}/edit` : '/payments/new';
  const paidDate = date(f, 'paidDate');
  const d = {
    projectId: str(f, 'projectId'),
    title: str(f, 'title'),
    amount: num(f, 'amount'),
    dueDate: date(f, 'dueDate'),
    paidDate,
    status: paidDate ? ('PAID' as const) : ('DUE' as const),
    notes: opt(f, 'notes'),
  };
  if (!d.projectId || !d.title || !d.amount || !d.dueDate) redirect(`${back}?error=required`);
  const data = { ...d, amount: d.amount, dueDate: d.dueDate };
  const rec = id ? await db.payment.update({ where: { id }, data }) : await db.payment.create({ data });
  await audit(u, id ? 'تعديل' : 'إضافة', 'دفعة', rec.id, `${rec.title} ${rec.amount}`);
  revalidatePath('/payments');
  redirect('/payments');
}

export async function markPaid(id: string) {
  const u = await requireStaff();
  const p = await db.payment.update({ where: { id }, data: { status: 'PAID', paidDate: new Date() } });
  await audit(u, 'صرف', 'دفعة', id, `${p.title} ${p.amount}`);
  revalidatePath('/payments');
}

export async function deletePayment(id: string) {
  const u = await requireStaff();
  const p = await db.payment.delete({ where: { id } });
  await audit(u, 'حذف', 'دفعة', id, p.title);
  revalidatePath('/payments');
  redirect('/payments');
}

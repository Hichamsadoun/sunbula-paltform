'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, date, num, opt, saveImages, str } from '@/lib/forms';
import { toNum } from '@/lib/format';

export async function savePayment(id: string | null, f: FormData) {
  const u = await requireStaff();
  const back = id ? `/payments/${id}/edit` : '/payments/new';
  const paidDate = date(f, 'paidDate');
  const projectId = str(f, 'projectId');
  const amount = num(f, 'amount');
  const dueDate = date(f, 'dueDate');
  const title = str(f, 'title');
  if (!projectId || !title || !amount || amount <= 0 || !dueDate) redirect(`${back}?error=required`);

  // Payments may only be scheduled on projects that have been opened, and never beyond the project's cost.
  const project = await db.project.findUnique({ where: { id: projectId }, include: { payments: { select: { id: true, amount: true } } } });
  if (!project || project.status === 'PLANNED') redirect(`${back}?error=closed`);
  const scheduled = project.payments.filter((p) => p.id !== id).reduce((s, p) => s + toNum(p.amount), 0);
  if (scheduled + amount > toNum(project.cost) + 0.001) redirect(`${back}?error=over&left=${Math.max(0, toNum(project.cost) - scheduled)}&projectId=${projectId}${f.get("from") ? "&from=project" : ""}`);

  const [checkImage] = await saveImages([f.get('checkImage')].filter(Boolean) as FormDataEntryValue[]);
  const data = {
    projectId,
    title,
    amount,
    dueDate,
    paidDate,
    status: paidDate ? ('PAID' as const) : ('DUE' as const),
    method: opt(f, 'method'),
    checkNumber: opt(f, 'checkNumber'),
    checkDate: date(f, 'checkDate'),
    bankName: opt(f, 'bankName'),
    notes: opt(f, 'notes'),
    ...(checkImage ? { checkImage } : {}),
  };
  const rec = id ? await db.payment.update({ where: { id }, data }) : await db.payment.create({ data });
  await audit(u, id ? 'تعديل' : 'إضافة', 'دفعة', rec.id, `${rec.title} ${rec.amount}`);
  revalidatePath('/payments');
  redirect(f.get('from') === 'project' ? `/projects/${projectId}` : '/payments');
}

export async function markPaid(id: string) {
  const u = await requireStaff();
  const p = await db.payment.update({ where: { id }, data: { status: 'PAID', paidDate: new Date() } });
  await audit(u, 'صرف', 'دفعة', id, `${p.title} ${p.amount}`);
  revalidatePath('/payments');
  revalidatePath(`/projects/${p.projectId}`);
}

export async function deletePayment(id: string) {
  const u = await requireStaff();
  const p = await db.payment.delete({ where: { id } });
  await audit(u, 'حذف', 'دفعة', id, p.title);
  revalidatePath('/payments');
  redirect('/payments');
}

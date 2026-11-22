import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { openProjectBalances } from '@/lib/balances';
import { PageHead } from '@/components/ui';
import { PaymentForm } from '../../PaymentForm';

export default async function EditPayment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; left?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const sp = await searchParams;
  const p = await db.payment.findUnique({ where: { id } });
  if (!p) notFound();
  const projects = await openProjectBalances(p.projectId);
  return (
    <>
      <PageHead title="تعديل الدفعة" crumbs={[{ href: '/payments', label: 'الدفعات' }]} />
      <PaymentForm p={p} projects={projects} error={sp.error} left={sp.left} />
    </>
  );
}

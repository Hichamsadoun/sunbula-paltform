import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { PaymentForm } from '../../PaymentForm';

export default async function EditPayment({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const [p, projects] = await Promise.all([
    db.payment.findUnique({ where: { id } }),
    db.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <PageHead title="تعديل الدفعة" crumbs={[{ href: '/payments', label: 'الدفعات' }]} />
      <PaymentForm p={p} projects={projects} error={error} />
    </>
  );
}

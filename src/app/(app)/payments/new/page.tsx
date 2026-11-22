import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { PaymentForm } from '../PaymentForm';

export default async function NewPayment({ searchParams }: { searchParams: Promise<{ error?: string; projectId?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const projects = await db.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } });
  return (
    <>
      <PageHead title="إضافة دفعة" crumbs={[{ href: '/payments', label: 'الدفعات' }]} />
      <PaymentForm projects={projects} error={sp.error} projectId={sp.projectId} />
    </>
  );
}

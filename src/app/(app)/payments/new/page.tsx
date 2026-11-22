import { requireStaff } from '@/lib/auth';
import { openProjectBalances } from '@/lib/balances';
import { PageHead } from '@/components/ui';
import { PaymentForm } from '../PaymentForm';

export default async function NewPayment({ searchParams }: { searchParams: Promise<{ error?: string; projectId?: string; left?: string; from?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const projects = await openProjectBalances();
  return (
    <>
      <PageHead title="إضافة دفعة" crumbs={[{ href: '/payments', label: 'الدفعات' }]} />
      <PaymentForm projects={projects} error={sp.error} left={sp.left} projectId={sp.projectId} from={sp.from} />
    </>
  );
}

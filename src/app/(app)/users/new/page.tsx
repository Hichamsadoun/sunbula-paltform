import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { UserForm } from '../UserForm';

export default async function NewUser({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireAdmin();
  const { error } = await searchParams;
  const associations = await db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  return (
    <>
      <PageHead title="إضافة مستخدم" crumbs={[{ href: '/users', label: 'المستخدمون' }]} />
      <UserForm associations={associations} error={error} />
    </>
  );
}

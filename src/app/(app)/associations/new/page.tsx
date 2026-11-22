import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { AssociationForm } from '../AssociationForm';

export default async function NewAssociation({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="إضافة جمعية" crumbs={[{ href: '/associations', label: 'الجمعيات' }]} />
      <AssociationForm error={error} />
    </>
  );
}

import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { OrphanForm } from '../OrphanForm';

export default async function NewOrphan({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { error } = await searchParams;
  const [associations, sponsors, count] = await Promise.all([
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.sponsor.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.orphan.count(),
  ]);
  return (
    <>
      <PageHead title="إضافة يتيم" crumbs={[{ href: '/orphans', label: 'الأيتام' }]} />
      <OrphanForm associations={associations} sponsors={sponsors} error={error} code={`OR-${String(count + 1).padStart(4, '0')}`} />
    </>
  );
}

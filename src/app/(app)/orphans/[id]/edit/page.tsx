import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { OrphanForm } from '../../OrphanForm';

export default async function EditOrphan({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const [o, associations, sponsors] = await Promise.all([
    db.orphan.findUnique({ where: { id } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
    db.sponsor.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!o) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${o.name}`} crumbs={[{ href: '/orphans', label: 'الأيتام' }, { href: `/orphans/${o.id}`, label: o.code }]} />
      <OrphanForm o={o} associations={associations} sponsors={sponsors} error={error} />
    </>
  );
}

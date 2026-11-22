import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { AssociationForm } from '../../AssociationForm';

export default async function EditAssociation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const a = await db.association.findUnique({ where: { id } });
  if (!a) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${a.name}`} crumbs={[{ href: '/associations', label: 'الجمعيات' }, { href: `/associations/${a.id}`, label: a.name }]} />
      <AssociationForm a={a} error={error} />
    </>
  );
}

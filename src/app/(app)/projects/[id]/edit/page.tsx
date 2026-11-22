import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ProjectForm } from '../../ProjectForm';

export default async function EditProject({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const [p, associations] = await Promise.all([
    db.project.findUnique({ where: { id } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!p) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${p.name}`} crumbs={[{ href: '/projects', label: 'المشاريع' }, { href: `/projects/${p.id}`, label: p.code }]} />
      <ProjectForm p={p} associations={associations} error={error} />
    </>
  );
}

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser, scope } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ReportForm } from '../../ReportForm';

export default async function EditReport({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const { error } = await searchParams;
  const [r, projects] = await Promise.all([
    db.report.findFirst({ where: { id, project: scope(u) } }),
    db.project.findMany({ where: scope(u), select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } }),
  ]);
  if (!r) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${r.title}`} crumbs={[{ href: '/reports', label: 'التقارير' }, { href: `/reports/${r.id}`, label: r.title }]} />
      <ReportForm r={r} projects={projects} error={error} />
    </>
  );
}

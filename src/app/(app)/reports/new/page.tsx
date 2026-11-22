import { db } from '@/lib/db';
import { requireUser, scope } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ReportForm } from '../ReportForm';

export default async function NewReport({ searchParams }: { searchParams: Promise<{ error?: string; projectId?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const projects = await db.project.findMany({ where: scope(u), select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } });
  return (
    <>
      <PageHead title="تقرير جديد" crumbs={[{ href: '/reports', label: 'التقارير' }]} />
      <ReportForm projects={projects} error={sp.error} projectId={sp.projectId} />
    </>
  );
}

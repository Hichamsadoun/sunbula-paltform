import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ProjectForm } from '../ProjectForm';

export default async function NewProject({ searchParams }: { searchParams: Promise<{ error?: string; associationId?: string; status?: string; year?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const associations = await db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
  const yr = Number(sp.year) || new Date().getFullYear();
  const count = await db.project.count({ where: { year: yr } });
  const code = `SN-${String(yr).slice(2)}${String(count + 1).padStart(3, '0')}`;
  return (
    <>
      <PageHead title={sp.status === 'PLANNED' ? 'إضافة مشروع مستهدف' : 'إضافة مشروع'} crumbs={[{ href: '/projects', label: 'المشاريع' }]} />
      <ProjectForm associations={associations} error={sp.error} defaults={{ associationId: sp.associationId, code, status: sp.status, year: sp.year }} />
    </>
  );
}

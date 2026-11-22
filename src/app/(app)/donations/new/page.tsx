import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { DonationForm } from '../DonationForm';

export default async function NewDonation({ searchParams }: { searchParams: Promise<{ error?: string; projectId?: string; associationId?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const [projects, associations] = await Promise.all([
    db.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return (
    <>
      <PageHead title="سجّل التبرع" crumbs={[{ href: '/donations', label: 'التبرعات' }]} />
      <DonationForm projects={projects} associations={associations} error={sp.error} defaults={sp} />
    </>
  );
}

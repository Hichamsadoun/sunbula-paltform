import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { DonationForm } from '../../DonationForm';

export default async function EditDonation({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const [d, projects, associations] = await Promise.all([
    db.donation.findUnique({ where: { id } }),
    db.project.findMany({ select: { id: true, code: true, name: true }, orderBy: { code: 'desc' } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!d) notFound();
  return (
    <>
      <PageHead title="تعديل التبرع" crumbs={[{ href: '/donations', label: 'التبرعات' }]} />
      <DonationForm d={d} projects={projects} associations={associations} error={error} />
    </>
  );
}

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { SponsorForm } from '../../SponsorForm';

export default async function EditSponsor({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const s = await db.sponsor.findUnique({ where: { id } });
  if (!s) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${s.name}`} crumbs={[{ href: '/sponsors', label: 'الكافلون' }, { href: `/sponsors/${s.id}`, label: s.name }]} />
      <SponsorForm s={s} error={error} />
    </>
  );
}

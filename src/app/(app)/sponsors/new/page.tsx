import { requireStaff } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { SponsorForm } from '../SponsorForm';

export default async function NewSponsor({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { error } = await searchParams;
  return (
    <>
      <PageHead title="إضافة كافل" crumbs={[{ href: '/sponsors', label: 'الكافلون' }]} />
      <SponsorForm error={error} />
    </>
  );
}

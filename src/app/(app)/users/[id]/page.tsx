import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { UserForm } from '../UserForm';
import { deleteUser } from '../actions';

export default async function EditUser({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const me = await requireAdmin();
  const { id } = await params;
  const { error } = await searchParams;
  const [user, associations] = await Promise.all([
    db.user.findUnique({ where: { id } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  if (!user) notFound();
  return (
    <>
      <PageHead title={`تعديل: ${user.name}`} crumbs={[{ href: '/users', label: 'المستخدمون' }]} />
      <UserForm user={user} associations={associations} error={error} />
      {user.id !== me.id && (
        <form action={deleteUser.bind(null, user.id)}><ConfirmButton>حذف المستخدم</ConfirmButton></form>
      )}
    </>
  );
}

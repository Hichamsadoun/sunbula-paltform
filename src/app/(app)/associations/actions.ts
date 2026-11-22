'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, opt, saveImages, str } from '@/lib/forms';

async function data(f: FormData) {
  const [logo] = await saveImages([f.get('logo')].filter(Boolean) as FormDataEntryValue[]);
  return {
    name: str(f, 'name'),
    category: opt(f, 'category'),
    country: opt(f, 'country'),
    phone: opt(f, 'phone'),
    email: opt(f, 'email'),
    notes: opt(f, 'notes'),
    ...(logo ? { logoUrl: logo } : {}),
  };
}

export async function saveAssociation(id: string | null, f: FormData) {
  const u = await requireStaff();
  const d = await data(f);
  if (!d.name) redirect(id ? `/associations/${id}/edit?error=name` : '/associations/new?error=name');
  const dup = await db.association.findFirst({ where: { name: d.name, NOT: id ? { id } : undefined } });
  if (dup) redirect(id ? `/associations/${id}/edit?error=dup` : '/associations/new?error=dup');
  const rec = id
    ? await db.association.update({ where: { id }, data: d })
    : await db.association.create({ data: d });
  await audit(u, id ? 'تعديل' : 'إضافة', 'جمعية', rec.id, rec.name);
  revalidatePath('/associations');
  redirect(`/associations/${rec.id}`);
}

export async function deleteAssociation(id: string) {
  const u = await requireStaff();
  const a = await db.association.findUnique({
    where: { id },
    include: { _count: { select: { projects: true, orphans: true } } },
  });
  if (!a) redirect('/associations');
  if (a._count.projects || a._count.orphans) redirect(`/associations/${id}?error=linked`);
  await db.association.delete({ where: { id } });
  await audit(u, 'حذف', 'جمعية', id, a.name);
  revalidatePath('/associations');
  redirect('/associations');
}

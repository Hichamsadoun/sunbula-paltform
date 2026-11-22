'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { db } from '@/lib/db';
import { isStaff, requireUser, type SessionUser } from '@/lib/auth';
import { audit, bool, opt, saveImages, str } from '@/lib/forms';

/** Association accounts may only touch reports on their own projects. */
async function canUseProject(u: SessionUser, projectId: string) {
  if (isStaff(u)) return true;
  const p = await db.project.findUnique({ where: { id: projectId }, select: { associationId: true } });
  return !!p && p.associationId === u.associationId;
}

async function ownReport(u: SessionUser, id: string) {
  const r = await db.report.findUnique({ where: { id }, select: { projectId: true } });
  if (!r || !(await canUseProject(u, r.projectId))) redirect('/reports');
  return r;
}

export async function saveReport(id: string | null, f: FormData) {
  const u = await requireUser();
  const back = id ? `/reports/${id}/edit` : '/reports/new';
  const projectId = str(f, 'projectId');
  const title = str(f, 'title');
  if (!projectId || !title) redirect(`${back}?error=required`);
  if (!(await canUseProject(u, projectId))) redirect('/reports');
  if (id) await ownReport(u, id);
  const d = {
    projectId,
    title,
    summary: opt(f, 'summary'),
    results: opt(f, 'results'),
    notes: opt(f, 'notes'),
    published: bool(f, 'published'),
  };
  const urls = await saveImages(f.getAll('images'));
  const rec = id
    ? await db.report.update({ where: { id }, data: { ...d, images: { create: urls.map((url) => ({ url })) } } })
    : await db.report.create({ data: { ...d, createdBy: u.name, images: { create: urls.map((url) => ({ url })) } } });
  await audit(u, id ? 'تعديل' : 'إضافة', 'تقرير', rec.id, rec.title);
  revalidatePath('/reports');
  redirect(`/reports/${rec.id}`);
}

export async function deleteImage(imageId: string) {
  const u = await requireUser();
  const img = await db.reportImage.findUnique({ where: { id: imageId } });
  if (!img) return;
  await ownReport(u, img.reportId);
  await db.reportImage.delete({ where: { id: imageId } });
  revalidatePath(`/reports/${img.reportId}`);
}

export async function deleteReport(id: string) {
  const u = await requireUser();
  await ownReport(u, id);
  const r = await db.report.delete({ where: { id } });
  await audit(u, 'حذف', 'تقرير', id, r.title);
  revalidatePath('/reports');
  redirect('/reports');
}

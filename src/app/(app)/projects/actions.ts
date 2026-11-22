'use server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import type { ProjectStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { audit, date, num, opt, str } from '@/lib/forms';

const STATUSES = ['PLANNED', 'IN_PROGRESS', 'DONE', 'LATE'];

export async function saveProject(id: string | null, f: FormData) {
  const u = await requireStaff();
  const back = id ? `/projects/${id}/edit` : '/projects/new';
  const status = str(f, 'status');
  const d = {
    code: str(f, 'code'),
    name: str(f, 'name'),
    country: str(f, 'country'),
    sector: str(f, 'sector'),
    cost: num(f, 'cost') ?? 0,
    beneficiaries: num(f, 'beneficiaries'),
    year: num(f, 'year') ?? new Date().getFullYear(),
    status: (STATUSES.includes(status) ? status : 'IN_PROGRESS') as ProjectStatus,
    associationId: str(f, 'associationId'),
    description: opt(f, 'description'),
    goals: opt(f, 'goals'),
    startDate: date(f, 'startDate'),
    endDate: date(f, 'endDate'),
  };
  if (!d.code || !d.name || !d.country || !d.sector || !d.associationId) redirect(`${back}?error=required`);
  const dup = await db.project.findFirst({ where: { code: d.code, NOT: id ? { id } : undefined } });
  if (dup) redirect(`${back}?error=dup`);
  const beneficiaries = d.beneficiaries == null ? null : Math.round(d.beneficiaries);
  const rec = id
    ? await db.project.update({ where: { id }, data: { ...d, beneficiaries } })
    : await db.project.create({ data: { ...d, beneficiaries } });
  await audit(u, id ? 'تعديل' : 'إضافة', 'مشروع', rec.id, `${rec.code} ${rec.name}`);
  revalidatePath('/projects');
  redirect(`/projects/${rec.id}`);
}

export async function deleteProject(id: string) {
  const u = await requireStaff();
  const p = await db.project.delete({ where: { id } });
  await audit(u, 'حذف', 'مشروع', id, `${p.code} ${p.name}`);
  revalidatePath('/projects');
  redirect('/projects');
}

export async function addPhase(projectId: string, f: FormData) {
  const u = await requireStaff();
  const title = str(f, 'title');
  if (title) {
    const count = await db.phase.count({ where: { projectId } });
    await db.phase.create({ data: { projectId, title, dueDate: date(f, 'dueDate'), sort: count } });
    await audit(u, 'إضافة', 'مرحلة', projectId, title);
  }
  revalidatePath(`/projects/${projectId}`);
}

export async function togglePhase(id: string) {
  await requireStaff();
  const ph = await db.phase.findUniqueOrThrow({ where: { id } });
  await db.phase.update({ where: { id }, data: { done: !ph.done } });
  revalidatePath(`/projects/${ph.projectId}`);
}

export async function deletePhase(id: string) {
  await requireStaff();
  const ph = await db.phase.delete({ where: { id } });
  revalidatePath(`/projects/${ph.projectId}`);
}

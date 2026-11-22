import 'server-only';
import { db } from './db';
import { toNum } from './format';

/** Open projects (not PLANNED) with their cost, scheduled and paid totals. */
export async function openProjectBalances(includeId?: string) {
  const list = await db.project.findMany({
    where: { OR: [{ status: { not: 'PLANNED' } }, ...(includeId ? [{ id: includeId }] : [])] },
    orderBy: { code: 'desc' },
    include: { payments: { select: { amount: true, status: true } } },
  });
  return list.map((p) => ({
    id: p.id,
    code: p.code,
    name: p.name,
    cost: toNum(p.cost),
    scheduled: p.payments.reduce((s, x) => s + toNum(x.amount), 0),
    paid: p.payments.filter((x) => x.status === 'PAID').reduce((s, x) => s + toNum(x.amount), 0),
  }));
}

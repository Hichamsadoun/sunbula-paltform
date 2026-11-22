import Link from 'next/link';
import type { OrphanStatus, Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isStaff, requireUser, scope } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { ORPHAN_STATUS, qar, toNum } from '@/lib/format';

export default async function OrphansPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const where: Prisma.OrphanWhereInput = { ...scope(u) };
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: 'insensitive' } }, { code: { contains: sp.q, mode: 'insensitive' } }];
  if (sp.status && sp.status in ORPHAN_STATUS) where.status = sp.status as OrphanStatus;
  const [list, all] = await Promise.all([
    db.orphan.findMany({ where, orderBy: { code: 'asc' }, include: { association: { select: { name: true } }, sponsor: { select: { id: true, name: true } } } }),
    db.orphan.findMany({ where: scope(u), select: { status: true, monthlyAmount: true } }),
  ]);
  const sponsored = all.filter((o) => o.status === 'SPONSORED');
  return (
    <>
      <PageHead title="كفالة الأيتام" sub="سجل الأيتام وحالة كفالتهم">
        <a className="btn ghost" href="/api/export/orphans">تصدير Excel</a>
        {isStaff(u) && <Link className="btn" href="/orphans/new">+ إضافة يتيم</Link>}
      </PageHead>
      <div className="grid g4">
        <Stat label="إجمالي الأيتام" value={all.length} />
        <Stat label="مكفولون" value={sponsored.length} accent />
        <Stat label="بانتظار كافل" value={all.filter((o) => o.status === 'WAITING').length} />
        <Stat label="الالتزام الشهري" value={qar(sponsored.reduce((s, o) => s + toNum(o.monthlyAmount), 0))} />
      </div>
      <form className="filters card no-print" style={{ padding: 16 }}>
        <input name="q" placeholder="بحث بالاسم أو الرمز" defaultValue={sp.q} />
        <select name="status" defaultValue={sp.status ?? ''}>
          <option value="">كل الحالات</option>
          {Object.entries(ORPHAN_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="btn sm">تصفية</button>
      </form>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا يوجد أيتام مسجلون.</Empty> : (
          <table>
            <thead><tr><th>الرمز</th><th>الاسم</th><th>الدولة</th><th>الجمعية</th><th>الكافل</th><th>الحالة</th><th className="num">الكفالة الشهرية</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id}>
                  <td className="code">{o.code}</td>
                  <td><Link className="link" href={`/orphans/${o.id}`}>{o.name}</Link></td>
                  <td>{o.country}</td>
                  <td>{o.association.name}</td>
                  <td>{o.sponsor ? (isStaff(u) ? <Link href={`/sponsors/${o.sponsor.id}`}>{o.sponsor.name}</Link> : o.sponsor.name) : '—'}</td>
                  <td><Badge status={o.status} label={ORPHAN_STATUS[o.status]} /></td>
                  <td className="num">{qar(o.monthlyAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

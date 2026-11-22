import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Stat, Empty } from '@/components/ui';
import { fdate, qar, toNum } from '@/lib/format';

type SP = { q?: string; year?: string; association?: string };

export default async function DonationsPage({ searchParams }: { searchParams: Promise<SP> }) {
  await requireStaff();
  const sp = await searchParams;
  const where: Prisma.DonationWhereInput = {};
  if (sp.q) where.donorName = { contains: sp.q, mode: 'insensitive' };
  if (sp.year && /^\d{4}$/.test(sp.year)) where.date = { gte: new Date(`${sp.year}-01-01`), lt: new Date(`${Number(sp.year) + 1}-01-01`) };
  if (sp.association) where.associationId = sp.association;
  const [list, associations] = await Promise.all([
    db.donation.findMany({ where, orderBy: { date: 'desc' }, include: { project: { select: { id: true, code: true, name: true } }, association: { select: { name: true } } } }),
    db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  const total = list.reduce((s, d) => s + toNum(d.amount), 0);
  const donors = new Set(list.map((d) => d.donorName)).size;
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();
  const thisYear = new Date().getFullYear();
  return (
    <>
      <PageHead title="التبرعات" sub="سجل كل التبرعات الواردة">
        <a className="btn ghost" href={`/api/export/donations${qs ? `?${qs}` : ''}`}>تصدير Excel</a>
        <Link className="btn" href="/donations/new">+ إضافة تبرع</Link>
      </PageHead>
      <div className="grid g3">
        <Stat label="إجمالي التبرعات المعروضة" value={qar(total)} accent />
        <Stat label="عدد التبرعات" value={list.length} />
        <Stat label="عدد المتبرعين" value={donors} />
      </div>
      <form className="filters card no-print" style={{ padding: 16 }}>
        <input name="q" placeholder="بحث باسم المتبرع" defaultValue={sp.q} />
        <select name="year" defaultValue={sp.year ?? ''}>
          <option value="">كل السنوات</option>
          {[0, 1, 2, 3, 4].map((i) => <option key={i}>{thisYear - i}</option>)}
        </select>
        <select name="association" defaultValue={sp.association ?? ''}>
          <option value="">كل الجمعيات</option>
          {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
        <button className="btn sm">تصفية</button>
        {qs && <Link className="link" href="/donations">مسح</Link>}
      </form>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا توجد تبرعات.</Empty> : (
          <table>
            <thead><tr><th>التاريخ</th><th>المتبرع</th><th>المشروع</th><th>الجمعية</th><th>الطريقة</th><th>المرجع</th><th className="num">المبلغ</th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{fdate(d.date)}</td>
                  <td><Link className="link" href={`/donations/${d.id}/edit`}>{d.donorName}</Link></td>
                  <td>{d.project ? <Link href={`/projects/${d.project.id}`}>{d.project.code} · {d.project.name}</Link> : 'تبرع عام'}</td>
                  <td>{d.association?.name ?? '—'}</td>
                  <td>{d.method ?? '—'}</td>
                  <td className="code">{d.reference ?? ''}</td>
                  <td className="num">{qar(d.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

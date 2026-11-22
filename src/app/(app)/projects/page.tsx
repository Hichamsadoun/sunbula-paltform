import Link from 'next/link';
import type { Prisma, ProjectStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { isStaff, requireUser, scope } from '@/lib/auth';
import { PageHead, Badge, Empty } from '@/components/ui';
import { PROJECT_STATUS, fmt, qar, toNum } from '@/lib/format';

type SP = { q?: string; year?: string; country?: string; sector?: string; status?: string; association?: string };

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<SP> }) {
  const u = await requireUser();
  const sp = await searchParams;
  const where: Prisma.ProjectWhereInput = { ...scope(u) };
  if (sp.q) where.OR = [{ name: { contains: sp.q, mode: 'insensitive' } }, { code: { contains: sp.q, mode: 'insensitive' } }];
  if (sp.year) where.year = Number(sp.year);
  if (sp.country) where.country = sp.country;
  if (sp.sector) where.sector = sp.sector;
  if (sp.status && sp.status in PROJECT_STATUS) where.status = sp.status as ProjectStatus;
  if (sp.association && isStaff(u)) where.associationId = sp.association;

  const [list, facets, associations] = await Promise.all([
    db.project.findMany({ where, orderBy: [{ year: 'desc' }, { code: 'asc' }], include: { association: { select: { name: true } } } }),
    db.project.findMany({ where: scope(u), select: { year: true, country: true, sector: true }, distinct: ['year', 'country', 'sector'] }),
    isStaff(u) ? db.association.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }) : Promise.resolve([]),
  ]);
  const uniq = <T,>(a: T[]) => [...new Set(a)].sort();
  const total = list.reduce((s, p) => s + toNum(p.cost), 0);
  const ben = list.reduce((s, p) => s + (p.beneficiaries ?? 0), 0);
  const qs = new URLSearchParams(Object.entries(sp).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <>
      <PageHead title="المشاريع" sub={`${list.length} مشروع · ${qar(total)} · ${fmt(ben)} مستفيد`}>
        <a className="btn ghost" href={`/api/export/projects${qs ? `?${qs}` : ''}`}>تصدير Excel</a>
        {isStaff(u) && <Link className="btn" href="/projects/new">+ إضافة مشروع</Link>}
      </PageHead>
      <form className="filters card no-print" style={{ padding: 16 }}>
        <input name="q" placeholder="بحث بالاسم أو الرمز" defaultValue={sp.q} />
        <select name="year" defaultValue={sp.year ?? ''}>
          <option value="">كل السنوات</option>
          {uniq(facets.map((f) => f.year)).reverse().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <select name="country" defaultValue={sp.country ?? ''}>
          <option value="">كل الدول</option>
          {uniq(facets.map((f) => f.country)).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="sector" defaultValue={sp.sector ?? ''}>
          <option value="">كل القطاعات</option>
          {uniq(facets.map((f) => f.sector)).map((c) => <option key={c}>{c}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ''}>
          <option value="">كل الحالات</option>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        {isStaff(u) && (
          <select name="association" defaultValue={sp.association ?? ''}>
            <option value="">كل الجمعيات</option>
            {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        )}
        <button className="btn sm" type="submit">تصفية</button>
        {qs && <Link className="link" href="/projects">مسح</Link>}
      </form>
      <div className="table-wrap">
        {list.length === 0 ? (
          <Empty>{qs ? 'لا توجد مشاريع مطابقة.' : 'لا توجد مشاريع بعد.'}</Empty>
        ) : (
          <table>
            <thead>
              <tr><th>الرمز</th><th>المشروع</th><th>الجمعية</th><th>الدولة</th><th>القطاع</th><th>السنة</th><th>الحالة</th><th className="num">المستفيدون</th><th className="num">التكلفة</th></tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td className="code">{p.code}</td>
                  <td><Link className="link" href={`/projects/${p.id}`}>{p.name}</Link></td>
                  <td>{p.association.name}</td>
                  <td>{p.country}</td><td>{p.sector}</td><td>{p.year}</td>
                  <td><Badge status={p.status} label={PROJECT_STATUS[p.status]} /></td>
                  <td className="num">{p.beneficiaries == null ? '—' : fmt(p.beneficiaries)}</td>
                  <td className="num">{qar(p.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

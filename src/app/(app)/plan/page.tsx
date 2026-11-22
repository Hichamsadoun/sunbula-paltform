import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Stat, Badge, Field, Empty } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { COUNTRIES, PROJECT_STATUS, SECTORS, qar, toNum } from '@/lib/format';
import { openProject } from '../projects/actions';
import { deleteTarget, saveTarget } from './actions';

type P = { id: string; code: string; name: string; year: number; country: string; sector: string; status: string; cost: number; paid: number };

const sum = (a: P[], f: (p: P) => number) => a.reduce((s, p) => s + f(p), 0);

export default async function PlanPage({ searchParams }: { searchParams: Promise<{ year?: string; error?: string }> }) {
  await requireStaff();
  const sp = await searchParams;
  const [targets, rawProjects] = await Promise.all([
    db.planTarget.findMany({ orderBy: [{ year: 'asc' }, { country: 'asc' }, { sector: 'asc' }] }),
    db.project.findMany({ orderBy: { code: 'asc' }, include: { payments: { where: { status: 'PAID' }, select: { amount: true } } } }),
  ]);
  const projects: P[] = rawProjects.map((p) => ({
    id: p.id, code: p.code, name: p.name, year: p.year, country: p.country, sector: p.sector, status: p.status,
    cost: toNum(p.cost), paid: p.payments.reduce((s, x) => s + toNum(x.amount), 0),
  }));
  const now = new Date().getFullYear();
  const years = [...new Set([...targets.map((t) => t.year), ...projects.map((p) => p.year), now, now + 1, now + 2])].sort();
  const year = Number(sp.year) || now;

  const inTarget = (t: { year: number; country: string; sector: string }) =>
    projects.filter((p) => p.year === t.year && p.country === t.country && (!t.sector || p.sector === t.sector));

  const summary = years.map((y) => {
    const ps = projects.filter((p) => p.year === y);
    const target = targets.filter((t) => t.year === y).reduce((s, t) => s + toNum(t.amount), 0);
    const planned = sum(ps.filter((p) => p.status === 'PLANNED'), (p) => p.cost);
    const opened = sum(ps.filter((p) => p.status !== 'PLANNED'), (p) => p.cost);
    return { y, target, planned, opened, paid: sum(ps, (p) => p.paid) };
  });
  const cur = summary.find((s) => s.y === year)!;
  const yearTargets = targets.filter((t) => t.year === year);
  const yearProjects = projects.filter((p) => p.year === year);

  return (
    <>
      <PageHead title="خطة المشاريع" sub="المبالغ المستهدفة لكل سنة ودولة وقطاع، وما خُصّص لها من مشاريع">
        <Link className="btn" href={`/projects/new?status=PLANNED&year=${year}`}>+ مشروع مستهدف</Link>
      </PageHead>

      <div className="table-wrap">
        <table>
          <thead><tr><th>السنة</th><th className="num">المستهدف</th><th className="num">مشاريع مستهدفة (لم تُفتح)</th><th className="num">مشاريع مفتوحة</th><th className="num">المدفوع</th><th className="num">غير مخصص من الهدف</th><th style={{ width: 160 }}>التخصيص</th></tr></thead>
          <tbody>
            {summary.map((s) => {
              const alloc = s.planned + s.opened;
              const pct = s.target ? Math.min(100, Math.round((alloc / s.target) * 100)) : 0;
              return (
                <tr key={s.y} style={s.y === year ? { background: 'var(--soft)' } : undefined}>
                  <td><Link className="link" href={`/plan?year=${s.y}`}>{s.y}</Link></td>
                  <td className="num">{qar(s.target)}</td>
                  <td className="num">{qar(s.planned)}</td>
                  <td className="num">{qar(s.opened)}</td>
                  <td className="num">{qar(s.paid)}</td>
                  <td className="num" style={{ fontWeight: 600 }}>{qar(Math.max(0, s.target - alloc))}</td>
                  <td>{s.target ? <div className="row" style={{ flexWrap: 'nowrap' }}><div className="progress" style={{ flex: 1, height: 8 }}><div style={{ width: `${pct}%` }} /></div><small>{pct}%</small></div> : '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: 24 }}>خطة {year}</h2>
      <div className="grid g4">
        <Stat label="المستهدف" value={qar(cur.target)} />
        <Stat label="مشاريع مستهدفة لم تُفتح" value={qar(cur.planned)} />
        <Stat label="مشاريع مفتوحة" value={qar(cur.opened)} accent />
        <Stat label="المدفوع" value={qar(cur.paid)} note={`المتبقي على المفتوحة: ${qar(Math.max(0, cur.opened - cur.paid))}`} />
      </div>

      <div className="card">
        <h2>الأهداف حسب الدولة والقطاع</h2>
        {yearTargets.length === 0 ? <Empty>لم تُحدَّد أهداف لسنة {year} بعد. أضفها من النموذج أدناه.</Empty> : (
          <table>
            <thead><tr><th>الدولة</th><th>القطاع</th><th className="num">المستهدف</th><th className="num">مستهدفة</th><th className="num">مفتوحة</th><th className="num">المدفوع</th><th className="num">غير مخصص</th><th /></tr></thead>
            <tbody>
              {yearTargets.map((t) => {
                const ps = inTarget(t);
                const planned = sum(ps.filter((p) => p.status === 'PLANNED'), (p) => p.cost);
                const opened = sum(ps.filter((p) => p.status !== 'PLANNED'), (p) => p.cost);
                const gap = toNum(t.amount) - planned - opened;
                return (
                  <tr key={t.id}>
                    <td>{t.country}</td>
                    <td>{t.sector || 'كل القطاعات'}</td>
                    <td className="num">{qar(t.amount)}</td>
                    <td className="num">{qar(planned)}</td>
                    <td className="num">{qar(opened)}</td>
                    <td className="num">{qar(sum(ps, (p) => p.paid))}</td>
                    <td className="num" style={{ fontWeight: 600, color: gap < 0 ? 'var(--bad)' : undefined }}>{gap < 0 ? `تجاوز ${qar(-gap)}` : qar(gap)}</td>
                    <td><form action={deleteTarget.bind(null, t.id)}><ConfirmButton>حذف</ConfirmButton></form></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        <form action={saveTarget} className="form no-print" style={{ marginTop: 20, gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', alignItems: 'end' }}>
          {sp.error && <div className="alert full">السنة والدولة والمبلغ مطلوبة.</div>}
          <Field label="السنة" name="year"><input id="year" name="year" type="number" dir="ltr" defaultValue={year} required /></Field>
          <Field label="الدولة" name="country">
            <input id="country" name="country" list="countries" required />
            <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
          </Field>
          <Field label="القطاع (اختياري)" name="sector">
            <select id="sector" name="sector" defaultValue=""><option value="">كل القطاعات</option>{SECTORS.map((c) => <option key={c}>{c}</option>)}</select>
          </Field>
          <Field label="المبلغ المستهدف (ر.ق)" name="amount"><input id="amount" name="amount" type="number" min="0" dir="ltr" required /></Field>
          <div><button className="btn" type="submit" style={{ width: '100%', justifyContent: 'center' }}>حفظ الهدف</button></div>
        </form>
        <small style={{ color: 'var(--muted)' }}>إدخال نفس السنة والدولة والقطاع مرة أخرى يحدّث المبلغ.</small>
      </div>

      <div className="card">
        <h2>مشاريع {year}</h2>
        {yearProjects.length === 0 ? <Empty>لا توجد مشاريع لهذه السنة. أضف مشروعاً مستهدفاً ليدخل الخطة.</Empty> : (
          <table>
            <thead><tr><th>الرمز</th><th>المشروع</th><th>الدولة</th><th>القطاع</th><th>الحالة</th><th className="num">التكلفة</th><th className="num">المدفوع</th><th /></tr></thead>
            <tbody>
              {yearProjects.map((p) => (
                <tr key={p.id}>
                  <td className="code">{p.code}</td>
                  <td><Link className="link" href={`/projects/${p.id}`}>{p.name}</Link></td>
                  <td>{p.country}</td><td>{p.sector}</td>
                  <td><Badge status={p.status} label={p.status === 'PLANNED' ? 'مستهدف' : PROJECT_STATUS[p.status]} /></td>
                  <td className="num">{qar(p.cost)}</td>
                  <td className="num">{qar(p.paid)}</td>
                  <td>{p.status === 'PLANNED' && <form action={openProject.bind(null, p.id)}><button className="btn ghost sm">فتح المشروع</button></form>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

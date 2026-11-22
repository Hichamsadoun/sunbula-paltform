import Link from 'next/link';
import { db } from '@/lib/db';
import { isStaff, requireUser, scope } from '@/lib/auth';
import { getSettings, SETTING_KEYS } from '@/lib/settings';
import { PageHead, Stat, Bars, Badge, Empty } from '@/components/ui';
import { PROJECT_STATUS, fdate, fmt, groupSum, qar, toNum } from '@/lib/format';

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const u = await requireUser();
  const staff = isStaff(u);
  const sp = await searchParams;
  const year = Number(sp.year) || new Date().getFullYear();
  const yStart = new Date(`${year}-01-01`);
  const yEnd = new Date(`${year + 1}-01-01`);

  const [projects, donations, payments, orphans, settings] = await Promise.all([
    db.project.findMany({ where: scope(u), include: { association: { select: { name: true } } } }),
    staff ? db.donation.findMany({ orderBy: { date: 'desc' }, include: { project: { select: { code: true } } } }) : Promise.resolve([]),
    db.payment.findMany({
      where: { status: 'DUE', ...(staff ? {} : { project: { associationId: u.associationId ?? '__none__' } }) },
      orderBy: { dueDate: 'asc' },
      take: 6,
      include: { project: { select: { id: true, code: true, name: true } } },
    }),
    db.orphan.findMany({ where: scope(u), select: { status: true } }),
    getSettings(),
  ]);

  const cost = projects.reduce((s, p) => s + toNum(p.cost), 0);
  const ben = projects.reduce((s, p) => s + (p.beneficiaries ?? 0), 0);
  const done = projects.filter((p) => p.status === 'DONE').length;
  const late = projects.filter((p) => p.status === 'LATE');
  const countries = new Set(projects.map((p) => p.country)).size;
  const target = toNum(settings[SETTING_KEYS.target(year)]);
  const yearDonations = donations.filter((d) => d.date >= yStart && d.date < yEnd).reduce((s, d) => s + toNum(d.amount), 0);
  const pct = target ? Math.min(100, Math.round((yearDonations / target) * 100)) : 0;
  const money = (rows: { label: string; value: number }[]) => rows.map((r) => ({ ...r, display: qar(r.value) }));
  const empty = projects.length === 0 && donations.length === 0 && orphans.length === 0;

  return (
    <>
      <PageHead title={`أهلاً بك، ${u.name}`} sub={staff ? 'ملخص المشاريع والتبرعات والكفالات' : 'ملخص مشاريع جمعيتك'}>
        {staff && <Link className="btn" href="/donations/new">+ إضافة تبرع</Link>}
        {!staff && <Link className="btn" href="/reports/new">+ رفع تقرير</Link>}
      </PageHead>

      {empty && staff && (
        <div className="card">
          <h2>ابدأ بإعداد النظام</h2>
          <ol style={{ margin: 0, paddingInlineStart: 20, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><Link className="link" href="/associations/new">أضف الجمعيات الشريكة</Link></li>
            <li><Link className="link" href="/projects/new">أضف المشاريع واربطها بالجمعيات</Link></li>
            <li><Link className="link" href="/donations/new">سجّل التبرعات</Link> و<Link className="link" href="/payments/new">الدفعات</Link></li>
            {u.role === 'ADMIN' && <li><Link className="link" href="/settings">حدد المبلغ المستهدف للسنة</Link> و<Link className="link" href="/users">أنشئ حسابات للموظفين والجمعيات</Link></li>}
          </ol>
        </div>
      )}

      <div className="grid g4">
        <Stat label="إجمالي تكلفة المشاريع" value={qar(cost)} />
        <Stat label="المشاريع المنجزة" value={`${done} / ${projects.length}`} accent />
        <Stat label="الدول" value={countries} />
        <Stat label="المستفيدون" value={fmt(ben)} />
      </div>

      {staff && (
        <div className="card" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 2fr', gap: 28, alignItems: 'center' }}>
          <div className="stat"><span>المبلغ المستهدف لعام {year}</span><b style={{ fontSize: 24 }}>{target ? qar(target) : <Link className="link" href="/settings" style={{ fontSize: 16 }}>حدد الهدف</Link>}</b></div>
          <div className="stat"><span>التبرعات المحققة</span><b className="accent" style={{ fontSize: 24 }}>{qar(yearDonations)}</b></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div className="spread" style={{ fontSize: 14 }}>
              <span style={{ color: 'var(--muted)' }}>نسبة التحقق{target ? ` · المتبقي ${qar(Math.max(0, target - yearDonations))}` : ''}</span>
              <b>{pct}%</b>
            </div>
            <div className="progress"><div style={{ width: `${pct}%` }} /></div>
          </div>
        </div>
      )}

      <div className="grid g2">
        <div className="card"><h2>القيمة حسب الدولة</h2><Bars rows={money(groupSum(projects, (p) => p.country, (p) => toNum(p.cost)))} /></div>
        <div className="card"><h2>حسب القطاع</h2><Bars rows={money(groupSum(projects, (p) => p.sector, (p) => toNum(p.cost)))} /></div>
        <div className="card"><h2>حسب السنة</h2><Bars rows={money(groupSum(projects, (p) => String(p.year), (p) => toNum(p.cost)).sort((a, b) => a.label.localeCompare(b.label)))} /></div>
        {staff ? (
          <div className="card"><h2>حسب الجهة المنفذة</h2><Bars rows={money(groupSum(projects, (p) => p.association.name, (p) => toNum(p.cost)))} /></div>
        ) : (
          <div className="card"><h2>المشاريع حسب الحالة</h2><Bars rows={groupSum(projects, (p) => PROJECT_STATUS[p.status], () => 1)} /></div>
        )}
      </div>

      <div className="grid g2">
        <div className="card">
          <div className="spread" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>الدفعات المستحقة</h2><Link className="link" href="/payments?status=DUE">الكل</Link></div>
          {payments.length === 0 ? <Empty>لا توجد دفعات مستحقة.</Empty> : (
            <table>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id}>
                    <td><Link href={`/projects/${p.project.id}`}>{p.project.code}</Link> · {p.title}</td>
                    <td style={p.dueDate < new Date() ? { color: 'var(--bad)' } : undefined}>{fdate(p.dueDate)}</td>
                    <td className="num">{qar(p.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        {staff ? (
          <div className="card">
            <div className="spread" style={{ marginBottom: 12 }}><h2 style={{ margin: 0 }}>آخر التبرعات</h2><Link className="link" href="/donations">الكل</Link></div>
            {donations.length === 0 ? <Empty>لا توجد تبرعات.</Empty> : (
              <table>
                <tbody>
                  {donations.slice(0, 6).map((d) => (
                    <tr key={d.id}><td>{d.donorName}</td><td>{d.project?.code ?? 'عام'}</td><td>{fdate(d.date)}</td><td className="num">{qar(d.amount)}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        ) : (
          <div className="card"><h2>الأيتام</h2><Bars rows={[{ label: 'مكفولون', value: orphans.filter((o) => o.status === 'SPONSORED').length }, { label: 'بانتظار كافل', value: orphans.filter((o) => o.status === 'WAITING').length }]} /></div>
        )}
      </div>

      {late.length > 0 && (
        <div className="card">
          <h2>مشاريع متأخرة</h2>
          <table>
            <tbody>
              {late.map((p) => (
                <tr key={p.id}><td className="code">{p.code}</td><td><Link className="link" href={`/projects/${p.id}`}>{p.name}</Link></td><td>{p.association.name}</td><td><Badge status="LATE" label="متأخر" /></td></tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

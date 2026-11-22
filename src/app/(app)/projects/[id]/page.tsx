import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { isStaff, requireUser, scope } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PAYMENT_STATUS, PROJECT_STATUS, fdate, fmt, qar, toNum } from '@/lib/format';
import { addPhase, deletePhase, deleteProject, togglePhase } from '../actions';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const p = await db.project.findFirst({
    where: { id, ...scope(u) },
    include: {
      association: true,
      phases: { orderBy: { sort: 'asc' } },
      payments: { orderBy: { dueDate: 'asc' } },
      donations: { orderBy: { date: 'desc' } },
      reports: { orderBy: { createdAt: 'desc' }, include: { images: { take: 1 } } },
    },
  });
  if (!p) notFound();
  const staff = isStaff(u);
  const paid = p.payments.filter((x) => x.status === 'PAID').reduce((s, x) => s + toNum(x.amount), 0);
  const donated = p.donations.reduce((s, x) => s + toNum(x.amount), 0);
  const cost = toNum(p.cost);
  const donePhases = p.phases.filter((x) => x.done).length;
  const progress = p.phases.length ? Math.round((donePhases / p.phases.length) * 100) : p.status === 'DONE' ? 100 : 0;
  const add = addPhase.bind(null, p.id);
  const del = deleteProject.bind(null, p.id);

  return (
    <>
      <PageHead
        title={p.name}
        sub={`${p.code} · ${p.country} · ${p.sector} · ${p.year}`}
        crumbs={[{ href: '/projects', label: 'المشاريع' }]}
      >
        <Link className="btn ghost" href={`/reports/new?projectId=${p.id}`}>+ تقرير</Link>
        {staff && <Link className="btn ghost" href={`/payments/new?projectId=${p.id}`}>+ دفعة</Link>}
        {staff && <Link className="btn ghost" href={`/donations/new?projectId=${p.id}`}>+ تبرع</Link>}
        {staff && <Link className="btn" href={`/projects/${p.id}/edit`}>تعديل</Link>}
      </PageHead>

      <div className="grid g4">
        <Stat label="التكلفة" value={qar(cost)} />
        <Stat label="التبرعات المسجلة" value={qar(donated)} note={cost ? `${Math.round((donated / cost) * 100)}% من التكلفة` : undefined} accent />
        <Stat label="المصروف للجمعية" value={qar(paid)} note={`المتبقي ${qar(Math.max(0, cost - paid))}`} />
        <Stat label="المستفيدون" value={p.beneficiaries == null ? '—' : fmt(p.beneficiaries)} />
      </div>

      <div className="grid g2">
        <div className="card">
          <h2>نبذة عن المشروع</h2>
          <dl className="dl">
            <dt>الحالة</dt><dd><Badge status={p.status} label={PROJECT_STATUS[p.status]} /></dd>
            <dt>الجهة المنفذة</dt><dd>{staff ? <Link className="link" href={`/associations/${p.association.id}`}>{p.association.name}</Link> : p.association.name}</dd>
            <dt>الفترة</dt><dd>{fdate(p.startDate)} ← {fdate(p.endDate)}</dd>
            <dt>الوصف</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{p.description ?? '—'}</dd>
            <dt>الأهداف</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{p.goals ?? '—'}</dd>
          </dl>
        </div>
        <div className="card">
          <div className="spread" style={{ marginBottom: 12 }}>
            <h2 style={{ margin: 0 }}>مراحل التنفيذ</h2>
            <span className="badge info">{progress}%</span>
          </div>
          <div className="progress" style={{ marginBottom: 16 }}><div style={{ width: `${progress}%` }} /></div>
          {p.phases.length === 0 ? <Empty>لا توجد مراحل.</Empty> : (
            <ul className="phases">
              {p.phases.map((ph) => (
                <li key={ph.id} className={ph.done ? 'done' : ''}>
                  <span>
                    <span className="t">{ph.title}</span>
                    {ph.dueDate && <small style={{ color: 'var(--muted)', marginInlineStart: 8 }}>{fdate(ph.dueDate)}</small>}
                  </span>
                  {staff ? (
                    <span className="row">
                      <form action={togglePhase.bind(null, ph.id)}><button className="btn ghost sm">{ph.done ? 'إلغاء الإنجاز' : 'تم'}</button></form>
                      <form action={deletePhase.bind(null, ph.id)}><ConfirmButton>حذف</ConfirmButton></form>
                    </span>
                  ) : (
                    <Badge status={ph.done ? 'DONE' : 'PLANNED'} label={ph.done ? 'منجزة' : 'قادمة'} />
                  )}
                </li>
              ))}
            </ul>
          )}
          {staff && (
            <form action={add} className="row no-print" style={{ marginTop: 14 }}>
              <input name="title" placeholder="مرحلة جديدة" required style={{ flex: 1, minWidth: 160 }} />
              <input name="dueDate" type="date" style={{ width: 160 }} />
              <button className="btn sm">إضافة</button>
            </form>
          )}
        </div>
      </div>

      <div className="card">
        <h2>الدفعات</h2>
        {p.payments.length === 0 ? <Empty>لا توجد دفعات مجدولة.</Empty> : (
          <table>
            <thead><tr><th>الدفعة</th><th>تاريخ الاستحقاق</th><th>تاريخ الدفع</th><th>الحالة</th><th className="num">المبلغ</th></tr></thead>
            <tbody>
              {p.payments.map((x) => (
                <tr key={x.id}>
                  <td>{staff ? <Link className="link" href={`/payments/${x.id}/edit`}>{x.title}</Link> : x.title}</td>
                  <td>{fdate(x.dueDate)}</td><td>{fdate(x.paidDate)}</td>
                  <td><Badge status={x.status} label={PAYMENT_STATUS[x.status]} /></td>
                  <td className="num">{qar(x.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {staff && (
        <div className="card">
          <h2>التبرعات</h2>
          {p.donations.length === 0 ? <Empty>لا توجد تبرعات مرتبطة.</Empty> : (
            <table>
              <thead><tr><th>المتبرع</th><th>التاريخ</th><th>الطريقة</th><th className="num">المبلغ</th></tr></thead>
              <tbody>
                {p.donations.map((d) => (
                  <tr key={d.id}><td><Link className="link" href={`/donations/${d.id}/edit`}>{d.donorName}</Link></td><td>{fdate(d.date)}</td><td>{d.method ?? '—'}</td><td className="num">{qar(d.amount)}</td></tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="card">
        <h2>التقارير</h2>
        {p.reports.length === 0 ? <Empty>لا توجد تقارير بعد.</Empty> : (
          <div className="gallery">
            {p.reports.map((r) => (
              <Link key={r.id} href={`/reports/${r.id}`}>
                <figure>
                  {r.images[0] ? <img src={r.images[0].url} alt="" /> : <div style={{ height: 150, display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>بدون صور</div>}
                  <figcaption><b style={{ color: 'var(--ink)' }}>{r.title}</b><br />{fdate(r.createdAt)}</figcaption>
                </figure>
              </Link>
            ))}
          </div>
        )}
      </div>

      {staff && (
        <form action={del} className="no-print">
          <ConfirmButton message="سيتم حذف المشروع مع مراحله ودفعاته وتقاريره. متأكد؟">حذف المشروع</ConfirmButton>
        </form>
      )}
    </>
  );
}

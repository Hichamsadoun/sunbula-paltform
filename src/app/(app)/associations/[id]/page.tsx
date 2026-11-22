import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Stat, Badge, Bars, Empty } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { PROJECT_STATUS, fmt, qar, toNum, groupSum } from '@/lib/format';
import { deleteAssociation } from '../actions';

export default async function AssociationPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const { id } = await params;
  const { error } = await searchParams;
  const a = await db.association.findUnique({
    where: { id },
    include: {
      projects: { orderBy: [{ year: 'desc' }, { code: 'asc' }] },
      donations: { select: { amount: true } },
      _count: { select: { orphans: true, users: true } },
    },
  });
  if (!a) notFound();
  const total = a.projects.reduce((s, p) => s + toNum(p.cost), 0);
  const ben = a.projects.reduce((s, p) => s + (p.beneficiaries ?? 0), 0);
  const del = deleteAssociation.bind(null, a.id);
  return (
    <>
      <PageHead title={a.name} sub={[a.category, a.country].filter(Boolean).join(' · ') || undefined} crumbs={[{ href: '/associations', label: 'الجمعيات' }]}>
        <Link className="btn ghost" href={`/donations/new?associationId=${a.id}`}>تبرع جديد لهذه الجمعية</Link>
        <Link className="btn ghost" href={`/projects/new?associationId=${a.id}`}>+ مشروع</Link>
        <Link className="btn" href={`/associations/${a.id}/edit`}>تعديل</Link>
      </PageHead>
      {error === 'linked' && <div className="alert">لا يمكن حذف جمعية مرتبطة بمشاريع أو أيتام. احذفها أو انقلها أولاً.</div>}
      <div className="grid g4">
        <Stat label="إجمالي قيمة المشاريع" value={qar(total)} />
        <Stat label="المشاريع" value={a.projects.length} note={`${a.projects.filter((p) => p.status === 'DONE').length} منجز`} accent />
        <Stat label="المستفيدون" value={fmt(ben)} />
        <Stat label="الأيتام المكفولون" value={a._count.orphans} />
      </div>
      <div className="grid g2">
        <div className="card">
          <h2>بيانات الجمعية</h2>
          <div className="row" style={{ marginBottom: 16 }}>
            <span className="logo-sm" style={{ width: 64, height: 64 }}>{a.logoUrl ? <img src={a.logoUrl} alt="" /> : a.name.charAt(0)}</span>
          </div>
          <dl className="dl">
            <dt>الهاتف</dt><dd dir="ltr" style={{ textAlign: 'right' }}>{a.phone ?? '—'}</dd>
            <dt>البريد</dt><dd dir="ltr" style={{ textAlign: 'right' }}>{a.email ?? '—'}</dd>
            <dt>التبرعات المباشرة</dt><dd>{qar(a.donations.reduce((s, d) => s + toNum(d.amount), 0))}</dd>
            <dt>حسابات الدخول</dt><dd>{a._count.users}</dd>
            <dt>ملاحظات</dt><dd>{a.notes ?? '—'}</dd>
          </dl>
        </div>
        <div className="card">
          <h2>القيمة حسب الدولة</h2>
          <Bars rows={groupSum(a.projects, (p) => p.country, (p) => toNum(p.cost)).map((r) => ({ ...r, display: qar(r.value) }))} />
        </div>
      </div>
      <div className="spread"><h2 style={{ fontSize: 20 }}>مشاريع الجمعية</h2></div>
      <div className="table-wrap">
        {a.projects.length === 0 ? <Empty>لا توجد مشاريع لهذه الجمعية.</Empty> : (
          <table>
            <thead><tr><th>الرمز</th><th>المشروع</th><th>الدولة</th><th>القطاع</th><th>السنة</th><th>الحالة</th><th className="num">التكلفة</th></tr></thead>
            <tbody>
              {a.projects.map((p) => (
                <tr key={p.id}>
                  <td className="code">{p.code}</td>
                  <td><Link className="link" href={`/projects/${p.id}`}>{p.name}</Link></td>
                  <td>{p.country}</td><td>{p.sector}</td><td>{p.year}</td>
                  <td><Badge status={p.status} label={PROJECT_STATUS[p.status]} /></td>
                  <td className="num">{qar(p.cost)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <form action={del} className="no-print">
        <ConfirmButton>حذف الجمعية</ConfirmButton>
      </form>
    </>
  );
}

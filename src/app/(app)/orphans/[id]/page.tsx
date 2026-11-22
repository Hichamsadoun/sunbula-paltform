import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { isStaff, requireUser, scope } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ORPHAN_STATUS, fdate, qar, toNum } from '@/lib/format';
import { deleteOrphan, deleteSponsorship, recordSponsorship } from '../actions';

export default async function OrphanPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const staff = isStaff(u);
  const { id } = await params;
  const o = await db.orphan.findFirst({
    where: { id, ...scope(u) },
    include: { association: true, sponsor: true, payments: { orderBy: { month: 'desc' } } },
  });
  if (!o) notFound();
  const total = o.payments.reduce((s, p) => s + toNum(p.amount), 0);
  const thisMonth = new Date().toISOString().slice(0, 7);
  const age = o.birthDate ? Math.floor((Date.now() - o.birthDate.getTime()) / (365.25 * 864e5)) : null;
  return (
    <>
      <PageHead title={o.name} sub={`${o.code} · ${o.country}`} crumbs={[{ href: '/orphans', label: 'الأيتام' }]}>
        {staff && <Link className="btn" href={`/orphans/${o.id}/edit`}>تعديل</Link>}
      </PageHead>
      <div className="grid g4">
        <Stat label="الحالة" value={<Badge status={o.status} label={ORPHAN_STATUS[o.status]} />} />
        <Stat label="الكفالة الشهرية" value={qar(o.monthlyAmount)} />
        <Stat label="إجمالي المدفوع" value={qar(total)} accent note={`${o.payments.length} شهر`} />
        <Stat label="العمر" value={age ?? '—'} />
      </div>
      <div className="grid g2">
        <div className="card">
          <h2>البيانات</h2>
          <dl className="dl">
            <dt>الجنس</dt><dd>{o.gender ?? '—'}</dd>
            <dt>تاريخ الميلاد</dt><dd>{fdate(o.birthDate)}</dd>
            <dt>ولي الأمر</dt><dd>{o.guardian ?? '—'}</dd>
            <dt>الجمعية</dt><dd>{o.association.name}</dd>
            <dt>الكافل</dt><dd>{o.sponsor ? (staff ? <Link className="link" href={`/sponsors/${o.sponsor.id}`}>{o.sponsor.name}</Link> : o.sponsor.name) : '—'}</dd>
            <dt>ملاحظات</dt><dd style={{ whiteSpace: 'pre-wrap' }}>{o.notes ?? '—'}</dd>
          </dl>
        </div>
        <div className="card">
          <h2>دفعات الكفالة الشهرية</h2>
          {staff && (
            <form action={recordSponsorship.bind(null, o.id)} className="row no-print" style={{ marginBottom: 14 }}>
              <input name="month" type="month" defaultValue={thisMonth} required style={{ width: 170 }} />
              <input name="amount" type="number" min="0.01" step="0.01" dir="ltr" defaultValue={o.monthlyAmount.toString()} required style={{ width: 140 }} />
              <button className="btn sm">تسجيل الدفع</button>
            </form>
          )}
          {o.payments.length === 0 ? <Empty>لا توجد دفعات مسجلة.</Empty> : (
            <table>
              <thead><tr><th>الشهر</th><th>تاريخ التسجيل</th><th className="num">المبلغ</th>{staff && <th />}</tr></thead>
              <tbody>
                {o.payments.map((p) => (
                  <tr key={p.id}>
                    <td>{p.month}</td><td>{fdate(p.paidAt)}</td><td className="num">{qar(p.amount)}</td>
                    {staff && <td><form action={deleteSponsorship.bind(null, p.id)}><ConfirmButton>حذف</ConfirmButton></form></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      {staff && (
        <form action={deleteOrphan.bind(null, o.id)} className="no-print">
          <ConfirmButton>حذف اليتيم</ConfirmButton>
        </form>
      )}
    </>
  );
}

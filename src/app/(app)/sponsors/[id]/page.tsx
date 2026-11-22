import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { ORPHAN_STATUS, qar, toNum } from '@/lib/format';
import { deleteSponsor } from '../actions';

export default async function SponsorPage({ params }: { params: Promise<{ id: string }> }) {
  await requireStaff();
  const { id } = await params;
  const s = await db.sponsor.findUnique({ where: { id }, include: { orphans: { include: { payments: { select: { amount: true } } } } } });
  if (!s) notFound();
  const active = s.orphans.filter((o) => o.status === 'SPONSORED');
  const paid = s.orphans.reduce((a, o) => a + o.payments.reduce((b, p) => b + toNum(p.amount), 0), 0);
  return (
    <>
      <PageHead title={s.name} sub={[s.phone, s.email].filter(Boolean).join(' · ') || undefined} crumbs={[{ href: '/sponsors', label: 'الكافلون' }]}>
        <Link className="btn" href={`/sponsors/${s.id}/edit`}>تعديل</Link>
      </PageHead>
      <div className="grid g3">
        <Stat label="الأيتام المكفولون حالياً" value={active.length} accent />
        <Stat label="الالتزام الشهري" value={qar(active.reduce((a, o) => a + toNum(o.monthlyAmount), 0))} />
        <Stat label="إجمالي المدفوع" value={qar(paid)} />
      </div>
      <div className="table-wrap">
        {s.orphans.length === 0 ? <Empty>لا يوجد أيتام مرتبطون. اربط يتيماً من صفحة تعديل اليتيم.</Empty> : (
          <table>
            <thead><tr><th>الرمز</th><th>الاسم</th><th>الدولة</th><th>الحالة</th><th className="num">الكفالة الشهرية</th></tr></thead>
            <tbody>
              {s.orphans.map((o) => (
                <tr key={o.id}>
                  <td className="code">{o.code}</td>
                  <td><Link className="link" href={`/orphans/${o.id}`}>{o.name}</Link></td>
                  <td>{o.country}</td>
                  <td><Badge status={o.status} label={ORPHAN_STATUS[o.status]} /></td>
                  <td className="num">{qar(o.monthlyAmount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {s.notes && <div className="card"><h2>ملاحظات</h2><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{s.notes}</p></div>}
      <form action={deleteSponsor.bind(null, s.id)} className="no-print">
        <ConfirmButton message="سيُحذف الكافل ويصبح أيتامه بانتظار كافل. متأكد؟">حذف الكافل</ConfirmButton>
      </form>
    </>
  );
}

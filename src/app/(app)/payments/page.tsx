import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isStaff, requireUser } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { PAYMENT_STATUS, fdate, qar, toNum } from '@/lib/format';
import { markPaid } from './actions';

export default async function PaymentsPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const u = await requireUser();
  const staff = isStaff(u);
  const sp = await searchParams;
  const where: Prisma.PaymentWhereInput = staff ? {} : { project: { associationId: u.associationId ?? '__none__' } };
  if (sp.status === 'DUE' || sp.status === 'PAID') where.status = sp.status;
  const list = await db.payment.findMany({
    where,
    orderBy: [{ status: 'asc' }, { dueDate: 'asc' }],
    include: { project: { select: { id: true, code: true, name: true, association: { select: { name: true } } } } },
  });
  const now = new Date();
  const due = list.filter((p) => p.status === 'DUE');
  const overdue = due.filter((p) => p.dueDate < now);
  const paid = list.filter((p) => p.status === 'PAID');
  const sum = (a: typeof list) => a.reduce((s, p) => s + toNum(p.amount), 0);
  return (
    <>
      <PageHead title="الدفعات" sub="الدفعات المستحقة والمصروفة للجهات المنفذة">
        <a className="btn ghost" href="/api/export/payments">تصدير Excel</a>
        {staff && <Link className="btn" href="/payments/new">+ إضافة دفعة</Link>}
      </PageHead>
      <div className="grid g3">
        <Stat label="مستحقة" value={qar(sum(due))} note={`${due.length} دفعة`} />
        <Stat label="متأخرة عن موعدها" value={qar(sum(overdue))} note={`${overdue.length} دفعة`} />
        <Stat label="مصروفة" value={qar(sum(paid))} note={`${paid.length} دفعة`} accent />
      </div>
      <div className="filters no-print">
        <Link className={`btn sm ${sp.status ? 'ghost' : ''}`} href="/payments">الكل</Link>
        <Link className={`btn sm ${sp.status === 'DUE' ? '' : 'ghost'}`} href="/payments?status=DUE">المستحقة</Link>
        <Link className={`btn sm ${sp.status === 'PAID' ? '' : 'ghost'}`} href="/payments?status=PAID">المصروفة</Link>
      </div>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا توجد دفعات.</Empty> : (
          <table>
            <thead><tr><th>الدفعة</th><th>المشروع</th><th>الجمعية</th><th>الاستحقاق</th><th>الصرف</th><th>الحالة</th><th className="num">المبلغ</th>{staff && <th />}</tr></thead>
            <tbody>
              {list.map((p) => {
                const late = p.status === 'DUE' && p.dueDate < now;
                return (
                  <tr key={p.id}>
                    <td>{staff ? <Link className="link" href={`/payments/${p.id}/edit`}>{p.title}</Link> : p.title}</td>
                    <td><Link href={`/projects/${p.project.id}`}>{p.project.code} · {p.project.name}</Link></td>
                    <td>{p.project.association.name}</td>
                    <td style={late ? { color: 'var(--bad)', fontWeight: 600 } : undefined}>{fdate(p.dueDate)}</td>
                    <td>{fdate(p.paidDate)}</td>
                    <td><Badge status={late ? 'LATE' : p.status} label={late ? 'متأخرة' : PAYMENT_STATUS[p.status]} /></td>
                    <td className="num">{qar(p.amount)}</td>
                    {staff && (
                      <td>{p.status === 'DUE' && <form action={markPaid.bind(null, p.id)}><button className="btn ghost sm">تسجيل الصرف</button></form>}</td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

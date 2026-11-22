import Link from 'next/link';
import type { Prisma } from '@prisma/client';
import { db } from '@/lib/db';
import { isStaff, requireUser } from '@/lib/auth';
import { PageHead, Stat, Badge, Empty } from '@/components/ui';
import { PAYMENT_STATUS, fdate, qar, toNum } from '@/lib/format';
import { markPaid } from './actions';
import { openProjectBalances } from '@/lib/balances';

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
  const balances = staff
    ? await openProjectBalances()
    : (await openProjectBalances()).filter((b) => list.some((p) => p.project.id === b.id));
  const totals = balances.reduce((t, b) => ({ cost: t.cost + b.cost, scheduled: t.scheduled + b.scheduled, paid: t.paid + b.paid }), { cost: 0, scheduled: 0, paid: 0 });
  return (
    <>
      <PageHead title="الدفعات" sub="الدفعات المستحقة والمصروفة للجهات المنفذة">
        <a className="btn ghost" href="/api/export/payments">تصدير Excel</a>
        {staff && <Link className="btn" href="/payments/new">+ إضافة دفعة</Link>}
      </PageHead>
      <div className="grid g4">
        <Stat label="التزامات المشاريع المفتوحة" value={qar(totals.cost)} note={`${balances.length} مشروع`} />
        <Stat label="المدفوع" value={qar(totals.paid)} note={totals.cost ? `${Math.round((totals.paid / totals.cost) * 100)}% من الالتزامات` : undefined} accent />
        <Stat label="المتبقي على المشاريع" value={qar(totals.cost - totals.paid)} note={`غير مجدول: ${qar(totals.cost - totals.scheduled)}`} />
        <Stat label="مستحقة الآن" value={qar(sum(due))} note={overdue.length ? `منها ${overdue.length} متأخرة بقيمة ${qar(sum(overdue))}` : `${due.length} دفعة`} />
      </div>
      {balances.length > 0 && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>المشروع</th><th className="num">التكلفة</th><th className="num">المجدول</th><th className="num">المدفوع</th><th className="num">المتبقي</th><th style={{ width: 160 }}>نسبة الصرف</th></tr></thead>
            <tbody>
              {balances.map((b) => {
                const pct = b.cost ? Math.round((b.paid / b.cost) * 100) : 0;
                return (
                  <tr key={b.id}>
                    <td><Link className="link" href={`/projects/${b.id}`}>{b.code} · {b.name}</Link></td>
                    <td className="num">{qar(b.cost)}</td>
                    <td className="num">{qar(b.scheduled)}</td>
                    <td className="num">{qar(b.paid)}</td>
                    <td className="num" style={{ fontWeight: 600 }}>{qar(b.cost - b.paid)}</td>
                    <td><div className="row" style={{ flexWrap: 'nowrap' }}><div className="progress" style={{ flex: 1, height: 8 }}><div style={{ width: `${pct}%` }} /></div><small>{pct}%</small></div></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="filters no-print">
        <Link className={`btn sm ${sp.status ? 'ghost' : ''}`} href="/payments">الكل</Link>
        <Link className={`btn sm ${sp.status === 'DUE' ? '' : 'ghost'}`} href="/payments?status=DUE">المستحقة</Link>
        <Link className={`btn sm ${sp.status === 'PAID' ? '' : 'ghost'}`} href="/payments?status=PAID">المصروفة</Link>
      </div>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا توجد دفعات.</Empty> : (
          <table>
            <thead><tr><th>الدفعة</th><th>المشروع</th><th>الجمعية</th><th>الاستحقاق</th><th>الصرف</th><th>الشيك</th><th>الحالة</th><th className="num">المبلغ</th>{staff && <th />}</tr></thead>
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
                    <td>
                      {p.checkNumber ? <span className="code">#{p.checkNumber}</span> : '—'}
                      {p.checkDate && <small style={{ display: 'block', color: 'var(--muted)' }}>{fdate(p.checkDate)}</small>}
                      {p.checkImage && <a className="link" href={p.checkImage} target="_blank" style={{ fontSize: 12 }}>صورة الشيك</a>}
                    </td>
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

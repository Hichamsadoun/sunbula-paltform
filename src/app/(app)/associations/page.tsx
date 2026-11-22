import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Empty } from '@/components/ui';
import { qar, fmt, toNum } from '@/lib/format';

export default async function AssociationsPage() {
  await requireStaff();
  const list = await db.association.findMany({
    orderBy: { name: 'asc' },
    include: { projects: { select: { cost: true, country: true, status: true, beneficiaries: true } }, _count: { select: { orphans: true } } },
  });
  return (
    <>
      <PageHead title="الجمعيات" sub="الجهات الشريكة المنفذة للمشاريع">
        <a className="btn ghost" href="/api/export/associations">تصدير Excel</a>
        <Link className="btn" href="/associations/new">+ إضافة جمعية</Link>
      </PageHead>
      <div className="table-wrap">
        {list.length === 0 ? (
          <Empty>لا توجد جمعيات بعد. ابدأ بإضافة أول جمعية.</Empty>
        ) : (
          <table>
            <thead>
              <tr>
                <th>الجمعية</th><th>التصنيف</th><th className="num">المشاريع</th><th className="num">المنجزة</th>
                <th className="num">الدول</th><th className="num">المستفيدون</th><th className="num">الأيتام</th><th className="num">إجمالي القيمة</th>
              </tr>
            </thead>
            <tbody>
              {list.map((a) => {
                const total = a.projects.reduce((s, p) => s + toNum(p.cost), 0);
                const ben = a.projects.reduce((s, p) => s + (p.beneficiaries ?? 0), 0);
                return (
                  <tr key={a.id}>
                    <td>
                      <Link href={`/associations/${a.id}`} className="row">
                        <span className="logo-sm">{a.logoUrl ? <img src={a.logoUrl} alt="" /> : a.name.charAt(0)}</span>
                        <span className="link">{a.name}</span>
                      </Link>
                    </td>
                    <td>{a.category ?? '—'}</td>
                    <td className="num">{a.projects.length}</td>
                    <td className="num">{a.projects.filter((p) => p.status === 'DONE').length}</td>
                    <td className="num">{new Set(a.projects.map((p) => p.country)).size}</td>
                    <td className="num">{fmt(ben)}</td>
                    <td className="num">{a._count.orphans}</td>
                    <td className="num">{qar(total)}</td>
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

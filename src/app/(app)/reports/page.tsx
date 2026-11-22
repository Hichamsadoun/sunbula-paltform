import Link from 'next/link';
import { db } from '@/lib/db';
import { requireUser, scope } from '@/lib/auth';
import { PageHead, Empty } from '@/components/ui';
import { fdate } from '@/lib/format';

export default async function ReportsPage() {
  const u = await requireUser();
  const list = await db.report.findMany({
    where: { project: scope(u) },
    orderBy: { createdAt: 'desc' },
    include: { project: { select: { id: true, code: true, name: true, association: { select: { name: true } } } }, _count: { select: { images: true } } },
  });
  return (
    <>
      <PageHead title="التقارير" sub="تقارير الإنجاز والأثر للمشاريع">
        <Link className="btn" href="/reports/new">+ تقرير جديد</Link>
      </PageHead>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا توجد تقارير بعد.</Empty> : (
          <table>
            <thead><tr><th>التقرير</th><th>المشروع</th><th>الجمعية</th><th>التاريخ</th><th>الصور</th><th>الحالة</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td><Link className="link" href={`/reports/${r.id}`}>{r.title}</Link></td>
                  <td><Link href={`/projects/${r.project.id}`}>{r.project.code} · {r.project.name}</Link></td>
                  <td>{r.project.association.name}</td>
                  <td>{fdate(r.createdAt)}</td>
                  <td>{r._count.images}</td>
                  <td><span className={`badge ${r.published ? 'ok' : 'warn'}`}>{r.published ? 'معتمد' : 'مسودة'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

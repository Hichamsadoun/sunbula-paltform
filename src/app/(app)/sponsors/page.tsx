import Link from 'next/link';
import { db } from '@/lib/db';
import { requireStaff } from '@/lib/auth';
import { PageHead, Empty } from '@/components/ui';
import { qar, toNum } from '@/lib/format';

export default async function SponsorsPage() {
  await requireStaff();
  const list = await db.sponsor.findMany({ orderBy: { name: 'asc' }, include: { orphans: { where: { status: 'SPONSORED' }, select: { monthlyAmount: true } } } });
  return (
    <>
      <PageHead title="الكافلون">
        <Link className="btn" href="/sponsors/new">+ إضافة كافل</Link>
      </PageHead>
      <div className="table-wrap">
        {list.length === 0 ? <Empty>لا يوجد كافلون بعد.</Empty> : (
          <table>
            <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th className="num">الأيتام المكفولون</th><th className="num">الالتزام الشهري</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td><Link className="link" href={`/sponsors/${s.id}`}>{s.name}</Link></td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{s.phone ?? '—'}</td>
                  <td dir="ltr" style={{ textAlign: 'right' }}>{s.email ?? '—'}</td>
                  <td className="num">{s.orphans.length}</td>
                  <td className="num">{qar(s.orphans.reduce((a, o) => a + toNum(o.monthlyAmount), 0))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

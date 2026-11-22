import Link from 'next/link';
import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PageHead } from '@/components/ui';
import { ROLES, fdate } from '@/lib/format';

export default async function UsersPage() {
  await requireAdmin();
  const list = await db.user.findMany({ orderBy: { createdAt: 'asc' }, include: { association: { select: { name: true } } } });
  return (
    <>
      <PageHead title="المستخدمون" sub="حسابات الدخول وصلاحياتها">
        <Link className="btn" href="/users/new">+ إضافة مستخدم</Link>
      </PageHead>
      <div className="table-wrap">
        <table>
          <thead><tr><th>الاسم</th><th>البريد</th><th>الصلاحية</th><th>الجمعية</th><th>الحالة</th><th>تاريخ الإنشاء</th></tr></thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td><Link className="link" href={`/users/${u.id}`}>{u.name}</Link></td>
                <td dir="ltr" style={{ textAlign: 'right' }}>{u.email}</td>
                <td>{ROLES[u.role]}</td>
                <td>{u.association?.name ?? '—'}</td>
                <td><span className={`badge ${u.active ? 'ok' : 'mute'}`}>{u.active ? 'مفعّل' : 'معطّل'}</span></td>
                <td>{fdate(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

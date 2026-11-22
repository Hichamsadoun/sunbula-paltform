import { db } from '@/lib/db';
import { requireAdmin } from '@/lib/auth';
import { PageHead, Empty } from '@/components/ui';

export default async function ActivityPage() {
  await requireAdmin();
  const logs = await db.auditLog.findMany({ orderBy: { createdAt: 'desc' }, take: 300, include: { user: { select: { name: true } } } });
  return (
    <>
      <PageHead title="سجل النشاط" sub="آخر 300 عملية في النظام" />
      <div className="table-wrap">
        {logs.length === 0 ? <Empty>لا يوجد نشاط.</Empty> : (
          <table>
            <thead><tr><th>الوقت</th><th>المستخدم</th><th>العملية</th><th>العنصر</th><th>التفاصيل</th></tr></thead>
            <tbody>
              {logs.map((l) => (
                <tr key={l.id}>
                  <td dir="ltr" style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>{l.createdAt.toISOString().slice(0, 16).replace('T', ' ')}</td>
                  <td>{l.user?.name ?? '—'}</td><td>{l.action}</td><td>{l.entity}</td><td>{l.summary ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

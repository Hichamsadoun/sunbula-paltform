import { redirect } from 'next/navigation';
import { destroySession, requireUser } from '@/lib/auth';
import { ROLES } from '@/lib/format';
import { Sidebar } from '@/components/Sidebar';

async function logout() {
  'use server';
  await destroySession();
  redirect('/login');
}

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const staff = user.role !== 'ASSOCIATION';
  const sections = [
    {
      items: [
        { href: '/dashboard', label: 'لوحة المؤشرات' },
        { href: '/projects', label: 'المشاريع' },
        ...(staff ? [{ href: '/associations', label: 'الجمعيات' }] : []),
      ],
    },
    {
      title: 'المالية',
      items: [
        ...(staff ? [{ href: '/donations', label: 'التبرعات' }] : []),
        { href: '/payments', label: 'الدفعات' },
      ],
    },
    {
      title: 'الكفالات',
      items: [
        { href: '/orphans', label: 'الأيتام' },
        ...(staff ? [{ href: '/sponsors', label: 'الكافلون' }] : []),
      ],
    },
    { title: 'المتابعة', items: [{ href: '/reports', label: 'التقارير' }] },
    ...(user.role === 'ADMIN'
      ? [
          {
            title: 'الإدارة',
            items: [
              { href: '/site', label: 'الصفحة الرئيسية للموقع' },
              { href: '/users', label: 'المستخدمون' },
              { href: '/settings', label: 'الإعدادات' },
              { href: '/activity', label: 'سجل النشاط' },
            ],
          },
        ]
      : []),
  ];
  return (
    <div className="shell">
      <Sidebar sections={sections} user={{ name: user.name }} roleLabel={ROLES[user.role]} logout={logout} />
      <main className="main">{children}</main>
    </div>
  );
}

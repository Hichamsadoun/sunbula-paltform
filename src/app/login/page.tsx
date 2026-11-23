import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession, getUser } from '@/lib/auth';
import { BrandLogo } from '@/components/Logo';
import { getSiteLogo } from '@/lib/settings';

export const dynamic = 'force-dynamic';

async function login(formData: FormData) {
  'use server';
  const email = String(formData.get('email') || '').trim().toLowerCase();
  const password = String(formData.get('password') || '');
  const user = await db.user.findUnique({ where: { email } });
  if (!user || !user.active || !(await bcrypt.compare(password, user.passwordHash))) {
    redirect('/login?error=1');
  }
  await createSession(user.id);
  await db.auditLog.create({ data: { userId: user.id, action: 'دخول', entity: 'النظام' } });
  redirect('/dashboard');
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getUser()) redirect('/dashboard');
  if ((await db.user.count()) === 0) redirect('/setup');
  const { error } = await searchParams;
  const logo = await getSiteLogo();
  return (
    <div className="auth">
      <form action={login} className="card">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <div className={`brand-mark${logo ? ' has-img' : ''}`}><BrandLogo src={logo} /></div>
          <span className="brand-name kufi" style={{ color: 'var(--navy)' }}>السنبلة</span>
        </div>
        <p style={{ textAlign: 'center', margin: 0, color: 'var(--muted)' }}>تسجيل الدخول إلى نظام الإدارة</p>
        {error && <div className="alert">البريد أو كلمة المرور غير صحيحة.</div>}
        <div className="field">
          <label htmlFor="email">البريد الإلكتروني</label>
          <input id="email" name="email" type="email" required autoComplete="username" dir="ltr" />
        </div>
        <div className="field">
          <label htmlFor="password">كلمة المرور</label>
          <input id="password" name="password" type="password" required autoComplete="current-password" dir="ltr" />
        </div>
        <button className="btn" type="submit" style={{ justifyContent: 'center' }}>دخول</button>
      </form>
    </div>
  );
}

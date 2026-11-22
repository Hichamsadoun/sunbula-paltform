import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { createSession } from '@/lib/auth';
import { Logo } from '@/components/Logo';

export const dynamic = 'force-dynamic';

const ERR: Record<string, string> = {
  required: 'كل الحقول مطلوبة.',
  password: 'كلمة المرور يجب ألا تقل عن 8 أحرف.',
  match: 'كلمتا المرور غير متطابقتين.',
};

/** First-run only: creates the first admin when the system has no users. */
async function setup(f: FormData) {
  'use server';
  if ((await db.user.count()) > 0) redirect('/login');
  const name = String(f.get('name') || '').trim();
  const email = String(f.get('email') || '').trim().toLowerCase();
  const password = String(f.get('password') || '');
  if (!name || !email) redirect('/setup?error=required');
  if (password.length < 8) redirect('/setup?error=password');
  if (password !== String(f.get('confirm') || '')) redirect('/setup?error=match');
  const user = await db.$transaction(async (tx) => {
    if ((await tx.user.count()) > 0) return null;
    return tx.user.create({ data: { name, email, role: 'ADMIN', passwordHash: await bcrypt.hash(password, 10) } });
  });
  if (!user) redirect('/login');
  await createSession(user.id);
  await db.auditLog.create({ data: { userId: user.id, action: 'إنشاء', entity: 'حساب المدير' } });
  redirect('/dashboard');
}

export default async function SetupPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if ((await db.user.count()) > 0) redirect('/login');
  const { error } = await searchParams;
  return (
    <div className="auth">
      <form action={setup} className="card">
        <div className="brand" style={{ justifyContent: 'center' }}>
          <div className="brand-mark"><Logo /></div>
          <span className="brand-name kufi" style={{ color: 'var(--navy)' }}>السنبلة</span>
        </div>
        <p style={{ textAlign: 'center', margin: 0, color: 'var(--muted)' }}>إعداد النظام لأول مرة: أنشئ حساب مدير النظام</p>
        {error && <div className="alert">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
        <div className="field"><label htmlFor="name">الاسم</label><input id="name" name="name" required /></div>
        <div className="field"><label htmlFor="email">البريد الإلكتروني</label><input id="email" name="email" type="email" required dir="ltr" autoComplete="username" /></div>
        <div className="field"><label htmlFor="password">كلمة المرور</label><input id="password" name="password" type="password" required minLength={8} dir="ltr" autoComplete="new-password" /></div>
        <div className="field"><label htmlFor="confirm">تأكيد كلمة المرور</label><input id="confirm" name="confirm" type="password" required minLength={8} dir="ltr" autoComplete="new-password" /></div>
        <button className="btn" type="submit" style={{ justifyContent: 'center' }}>إنشاء الحساب والدخول</button>
      </form>
    </div>
  );
}

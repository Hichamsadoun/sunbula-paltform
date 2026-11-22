import Link from 'next/link';
import type { User } from '@prisma/client';
import { Field } from '@/components/ui';
import { ROLES } from '@/lib/format';
import { saveUser } from './actions';

const ERR: Record<string, string> = {
  required: 'الاسم والبريد مطلوبان.',
  assoc: 'اختر الجمعية لحساب الجمعية.',
  password: 'كلمة المرور يجب ألا تقل عن 8 أحرف.',
  dup: 'البريد مستخدم لحساب آخر.',
  self: 'لا يمكنك إلغاء صلاحية المدير أو تعطيل حسابك أنت.',
};

export function UserForm({ user, associations, error }: { user?: User; associations: { id: string; name: string }[]; error?: string }) {
  return (
    <form action={saveUser.bind(null, user?.id ?? null)} className="card form">
      {error && <div className="alert full">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
      <Field label="الاسم *" name="name"><input id="name" name="name" required defaultValue={user?.name} /></Field>
      <Field label="البريد الإلكتروني *" name="email"><input id="email" name="email" type="email" required dir="ltr" defaultValue={user?.email} /></Field>
      <Field label="الصلاحية" name="role" hint="مدير النظام: كل شيء. موظف: إدارة البيانات بدون المستخدمين والإعدادات. حساب جمعية: يرى مشاريع جمعيته فقط ويرفع تقاريرها.">
        <select id="role" name="role" defaultValue={user?.role ?? 'STAFF'}>
          {Object.entries(ROLES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="الجمعية (لحساب الجمعية)" name="associationId">
        <select id="associationId" name="associationId" defaultValue={user?.associationId ?? ''}>
          <option value="">—</option>
          {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label={user ? 'كلمة مرور جديدة' : 'كلمة المرور *'} name="password" hint={user ? 'اتركها فارغة للإبقاء على الحالية.' : '8 أحرف على الأقل.'}>
        <input id="password" name="password" type="password" dir="ltr" minLength={8} required={!user} autoComplete="new-password" />
      </Field>
      {user && (
        <div className="field" style={{ justifyContent: 'flex-end' }}>
          <label className="check"><input type="checkbox" name="active" defaultChecked={user.active} /> الحساب مفعّل</label>
        </div>
      )}
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href="/users">إلغاء</Link>
      </div>
    </form>
  );
}

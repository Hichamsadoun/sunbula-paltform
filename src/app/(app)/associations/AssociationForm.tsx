import Link from 'next/link';
import type { Association } from '@prisma/client';
import { Field } from '@/components/ui';
import { CATEGORIES, COUNTRIES } from '@/lib/format';
import { saveAssociation } from './actions';

const ERR: Record<string, string> = { name: 'اسم الجمعية مطلوب.', dup: 'توجد جمعية بنفس الاسم.' };

export function AssociationForm({ a, error }: { a?: Association; error?: string }) {
  const action = saveAssociation.bind(null, a?.id ?? null);
  return (
    <form action={action} className="card form">
      {error && <div className="alert full">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
      <Field label="اسم الجمعية *" name="name">
        <input id="name" name="name" required defaultValue={a?.name} />
      </Field>
      <Field label="التصنيف" name="category">
        <input id="category" name="category" list="cats" defaultValue={a?.category ?? ''} />
        <datalist id="cats">{CATEGORIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="الدولة" name="country">
        <input id="country" name="country" list="countries" defaultValue={a?.country ?? ''} />
        <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="الهاتف" name="phone">
        <input id="phone" name="phone" dir="ltr" defaultValue={a?.phone ?? ''} />
      </Field>
      <Field label="البريد الإلكتروني" name="email">
        <input id="email" name="email" type="email" dir="ltr" defaultValue={a?.email ?? ''} />
      </Field>
      <Field label="الشعار" name="logo" hint={a?.logoUrl ? 'اترك الحقل فارغاً للإبقاء على الشعار الحالي.' : 'صورة PNG أو JPG.'}>
        <input id="logo" name="logo" type="file" accept="image/*" />
      </Field>
      <Field label="ملاحظات" name="notes" full>
        <textarea id="notes" name="notes" defaultValue={a?.notes ?? ''} />
      </Field>
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href={a ? `/associations/${a.id}` : '/associations'}>إلغاء</Link>
      </div>
    </form>
  );
}

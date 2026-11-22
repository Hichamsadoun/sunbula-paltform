import Link from 'next/link';
import type { Sponsor } from '@prisma/client';
import { Field } from '@/components/ui';
import { saveSponsor } from './actions';

export function SponsorForm({ s, error }: { s?: Sponsor; error?: string }) {
  return (
    <form action={saveSponsor.bind(null, s?.id ?? null)} className="card form">
      {error && <div className="alert full">اسم الكافل مطلوب.</div>}
      <Field label="الاسم *" name="name"><input id="name" name="name" required defaultValue={s?.name} /></Field>
      <Field label="الهاتف" name="phone"><input id="phone" name="phone" dir="ltr" defaultValue={s?.phone ?? ''} /></Field>
      <Field label="البريد الإلكتروني" name="email"><input id="email" name="email" type="email" dir="ltr" defaultValue={s?.email ?? ''} /></Field>
      <div />
      <Field label="ملاحظات" name="notes" full><textarea id="notes" name="notes" defaultValue={s?.notes ?? ''} /></Field>
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href={s ? `/sponsors/${s.id}` : '/sponsors'}>إلغاء</Link>
      </div>
    </form>
  );
}

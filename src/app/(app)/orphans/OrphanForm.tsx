import Link from 'next/link';
import type { Orphan } from '@prisma/client';
import { Field } from '@/components/ui';
import { COUNTRIES, inputDate } from '@/lib/format';
import { saveOrphan } from './actions';

const ERR: Record<string, string> = {
  required: 'الرمز والاسم والدولة والجمعية ومبلغ الكفالة حقول مطلوبة.',
  dup: 'رمز اليتيم مستخدم.',
};

export function OrphanForm({
  o,
  associations,
  sponsors,
  error,
  code,
}: {
  o?: Orphan;
  associations: { id: string; name: string }[];
  sponsors: { id: string; name: string }[];
  error?: string;
  code?: string;
}) {
  return (
    <form action={saveOrphan.bind(null, o?.id ?? null)} className="card form">
      {error && <div className="alert full">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
      <Field label="رمز اليتيم *" name="code">
        <input id="code" name="code" required dir="ltr" defaultValue={o?.code ?? code} />
      </Field>
      <Field label="الاسم *" name="name">
        <input id="name" name="name" required defaultValue={o?.name} />
      </Field>
      <Field label="الجنس" name="gender">
        <select id="gender" name="gender" defaultValue={o?.gender ?? ''}>
          <option value="">—</option><option>ذكر</option><option>أنثى</option>
        </select>
      </Field>
      <Field label="تاريخ الميلاد" name="birthDate">
        <input id="birthDate" name="birthDate" type="date" defaultValue={inputDate(o?.birthDate)} />
      </Field>
      <Field label="الدولة *" name="country">
        <input id="country" name="country" required list="countries" defaultValue={o?.country} />
        <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="ولي الأمر" name="guardian">
        <input id="guardian" name="guardian" defaultValue={o?.guardian ?? ''} />
      </Field>
      <Field label="الجمعية المشرفة *" name="associationId">
        <select id="associationId" name="associationId" required defaultValue={o?.associationId ?? ''}>
          <option value="" disabled>اختر الجمعية</option>
          {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="مبلغ الكفالة الشهري (ر.ق) *" name="monthlyAmount">
        <input id="monthlyAmount" name="monthlyAmount" type="number" min="0" step="0.01" required dir="ltr" defaultValue={o ? o.monthlyAmount.toString() : ''} />
      </Field>
      <Field label="الكافل" name="sponsorId" hint="اتركه فارغاً إذا كان بانتظار كافل.">
        <select id="sponsorId" name="sponsorId" defaultValue={o?.sponsorId ?? ''}>
          <option value="">— بدون كافل —</option>
          {sponsors.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </Field>
      <div className="field" style={{ justifyContent: 'flex-end' }}>
        <label className="check"><input type="checkbox" name="ended" defaultChecked={o?.status === 'ENDED'} /> انتهت الكفالة</label>
      </div>
      <Field label="ملاحظات" name="notes" full>
        <textarea id="notes" name="notes" defaultValue={o?.notes ?? ''} />
      </Field>
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href={o ? `/orphans/${o.id}` : '/orphans'}>إلغاء</Link>
      </div>
    </form>
  );
}

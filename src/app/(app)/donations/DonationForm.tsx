import Link from 'next/link';
import type { Donation } from '@prisma/client';
import { Field } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { METHODS, inputDate } from '@/lib/format';
import { deleteDonation, saveDonation } from './actions';

export function DonationForm({
  d,
  projects,
  associations,
  error,
  defaults,
}: {
  d?: Donation;
  projects: { id: string; code: string; name: string }[];
  associations: { id: string; name: string }[];
  error?: string;
  defaults?: { projectId?: string; associationId?: string };
}) {
  const action = saveDonation.bind(null, d?.id ?? null);
  return (
    <>
      <form action={action} className="card form">
        {error && <div className="alert full">اسم المتبرع ومبلغ أكبر من صفر مطلوبان.</div>}
        <Field label="اسم المتبرع *" name="donorName">
          <input id="donorName" name="donorName" required defaultValue={d?.donorName} />
        </Field>
        <Field label="المبلغ (ر.ق) *" name="amount">
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required dir="ltr" defaultValue={d ? d.amount.toString() : ''} />
        </Field>
        <Field label="التاريخ *" name="date">
          <input id="date" name="date" type="date" required defaultValue={inputDate(d?.date ?? new Date())} />
        </Field>
        <Field label="طريقة الدفع" name="method">
          <select id="method" name="method" defaultValue={d?.method ?? ''}>
            <option value="">—</option>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <Field label="المشروع" name="projectId" hint="اختياري. إذا اخترت مشروعاً تُربط الجمعية تلقائياً.">
          <select id="projectId" name="projectId" defaultValue={d?.projectId ?? defaults?.projectId ?? ''}>
            <option value="">— تبرع عام —</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
          </select>
        </Field>
        <Field label="الجمعية" name="associationId">
          <select id="associationId" name="associationId" defaultValue={d?.associationId ?? defaults?.associationId ?? ''}>
            <option value="">—</option>
            {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </Field>
        <Field label="رقم المرجع / الإيصال" name="reference">
          <input id="reference" name="reference" dir="ltr" defaultValue={d?.reference ?? ''} />
        </Field>
        <div />
        <h3 className="full" style={{ margin: '6px 0 0', fontSize: 16 }}>بيانات الشيك (إن وُجد)</h3>
        <Field label="رقم الشيك" name="checkNumber">
          <input id="checkNumber" name="checkNumber" dir="ltr" defaultValue={d?.checkNumber ?? ''} />
        </Field>
        <Field label="تاريخ إصدار الشيك" name="checkDate">
          <input id="checkDate" name="checkDate" type="date" defaultValue={inputDate(d?.checkDate)} />
        </Field>
        <Field label="البنك" name="bankName">
          <input id="bankName" name="bankName" defaultValue={d?.bankName ?? ''} />
        </Field>
        <Field label="صورة الشيك" name="checkImage" hint={d?.checkImage ? 'اترك الحقل فارغاً للإبقاء على الصورة الحالية.' : undefined}>
          {d?.checkImage && <a href={d.checkImage} target="_blank"><img src={d.checkImage} alt="صورة الشيك" style={{ maxWidth: 220, maxHeight: 120, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 6 }} /></a>}
          <input id="checkImage" name="checkImage" type="file" accept="image/*" />
        </Field>
        <Field label="ملاحظات" name="notes" full>
          <textarea id="notes" name="notes" defaultValue={d?.notes ?? ''} />
        </Field>
        <div className="form-actions">
          <button className="btn" type="submit">حفظ</button>
          <Link className="btn ghost" href="/donations">إلغاء</Link>
        </div>
      </form>
      {d && (
        <form action={deleteDonation.bind(null, d.id)}>
          <ConfirmButton>حذف التبرع</ConfirmButton>
        </form>
      )}
    </>
  );
}

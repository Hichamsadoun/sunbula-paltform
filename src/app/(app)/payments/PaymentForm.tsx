import Link from 'next/link';
import type { Payment } from '@prisma/client';
import { Field } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { inputDate } from '@/lib/format';
import { deletePayment, savePayment } from './actions';

export function PaymentForm({
  p,
  projects,
  error,
  projectId,
}: {
  p?: Payment;
  projects: { id: string; code: string; name: string }[];
  error?: string;
  projectId?: string;
}) {
  return (
    <>
      <form action={savePayment.bind(null, p?.id ?? null)} className="card form">
        {error && <div className="alert full">المشروع والعنوان والمبلغ وتاريخ الاستحقاق مطلوبة.</div>}
        <Field label="المشروع *" name="projectId">
          <select id="projectId" name="projectId" required defaultValue={p?.projectId ?? projectId ?? ''}>
            <option value="" disabled>اختر المشروع</option>
            {projects.map((x) => <option key={x.id} value={x.id}>{x.code} · {x.name}</option>)}
          </select>
        </Field>
        <Field label="عنوان الدفعة *" name="title" hint="مثال: الدفعة الأولى 40%">
          <input id="title" name="title" required defaultValue={p?.title} />
        </Field>
        <Field label="المبلغ (ر.ق) *" name="amount">
          <input id="amount" name="amount" type="number" min="0.01" step="0.01" required dir="ltr" defaultValue={p ? p.amount.toString() : ''} />
        </Field>
        <Field label="تاريخ الاستحقاق *" name="dueDate">
          <input id="dueDate" name="dueDate" type="date" required defaultValue={inputDate(p?.dueDate)} />
        </Field>
        <Field label="تاريخ الصرف" name="paidDate" hint="اتركه فارغاً إذا لم تُصرف بعد.">
          <input id="paidDate" name="paidDate" type="date" defaultValue={inputDate(p?.paidDate)} />
        </Field>
        <div />
        <Field label="ملاحظات" name="notes" full>
          <textarea id="notes" name="notes" defaultValue={p?.notes ?? ''} />
        </Field>
        <div className="form-actions">
          <button className="btn" type="submit">حفظ</button>
          <Link className="btn ghost" href="/payments">إلغاء</Link>
        </div>
      </form>
      {p && (
        <form action={deletePayment.bind(null, p.id)}>
          <ConfirmButton>حذف الدفعة</ConfirmButton>
        </form>
      )}
    </>
  );
}

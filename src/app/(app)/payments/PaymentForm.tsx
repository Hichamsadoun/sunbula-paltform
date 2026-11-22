import Link from 'next/link';
import type { Payment } from '@prisma/client';
import { Field } from '@/components/ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { METHODS, inputDate, qar } from '@/lib/format';
import { deletePayment, savePayment } from './actions';

export type ProjectBalance = { id: string; code: string; name: string; cost: number; scheduled: number; paid: number };

export function PaymentForm({
  p,
  projects,
  error,
  left,
  projectId,
  from,
}: {
  p?: Payment;
  projects: ProjectBalance[];
  error?: string;
  left?: string;
  projectId?: string;
  from?: string;
}) {
  const ERR: Record<string, string> = {
    required: 'المشروع والعنوان والمبلغ وتاريخ الاستحقاق مطلوبة.',
    closed: 'لا يمكن جدولة دفعات إلا لمشروع مفتوح. افتح المشروع أولاً من صفحته.',
    over: `مجموع الدفعات يتجاوز تكلفة المشروع. المتبقي المتاح للجدولة: ${qar(left ?? 0)}.`,
  };
  const selected = projects.find((x) => x.id === (p?.projectId ?? projectId));
  return (
    <>
      {selected && (
        <div className="grid g4">
          <div className="card stat"><span>تكلفة المشروع</span><b style={{ fontSize: 22 }}>{qar(selected.cost)}</b></div>
          <div className="card stat"><span>المجدول</span><b style={{ fontSize: 22 }}>{qar(selected.scheduled)}</b></div>
          <div className="card stat"><span>المدفوع</span><b className="accent" style={{ fontSize: 22 }}>{qar(selected.paid)}</b></div>
          <div className="card stat"><span>المتبقي للجدولة</span><b style={{ fontSize: 22 }}>{qar(Math.max(0, selected.cost - selected.scheduled + (p ? Number(p.amount) : 0)))}</b></div>
        </div>
      )}
      <form action={savePayment.bind(null, p?.id ?? null)} className="card form">
        {from && <input type="hidden" name="from" value={from} />}
        {error && <div className="alert full">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
        {projects.length === 0 && <div className="note full">لا توجد مشاريع مفتوحة. الدفعات تُربط فقط بالمشاريع المفتوحة (قيد التنفيذ أو منجزة).</div>}
        <Field label="المشروع *" name="projectId" hint="تظهر المشاريع المفتوحة فقط، مع المتبقي غير المجدول.">
          <select id="projectId" name="projectId" required defaultValue={p?.projectId ?? projectId ?? ''}>
            <option value="" disabled>اختر المشروع</option>
            {projects.map((x) => (
              <option key={x.id} value={x.id}>{x.code} · {x.name} — المتبقي {qar(Math.max(0, x.cost - x.scheduled))}</option>
            ))}
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
        <Field label="طريقة الصرف" name="method">
          <select id="method" name="method" defaultValue={p?.method ?? ''}>
            <option value="">—</option>
            {METHODS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </Field>
        <h3 className="full" style={{ margin: '6px 0 0', fontSize: 16 }}>بيانات الشيك</h3>
        <Field label="رقم الشيك" name="checkNumber">
          <input id="checkNumber" name="checkNumber" dir="ltr" defaultValue={p?.checkNumber ?? ''} />
        </Field>
        <Field label="تاريخ إصدار الشيك" name="checkDate">
          <input id="checkDate" name="checkDate" type="date" defaultValue={inputDate(p?.checkDate)} />
        </Field>
        <Field label="البنك" name="bankName">
          <input id="bankName" name="bankName" defaultValue={p?.bankName ?? ''} />
        </Field>
        <Field label="صورة الشيك" name="checkImage" hint={p?.checkImage ? 'اترك الحقل فارغاً للإبقاء على الصورة الحالية.' : undefined}>
          {p?.checkImage && <a href={p.checkImage} target="_blank"><img src={p.checkImage} alt="صورة الشيك" style={{ maxWidth: 220, maxHeight: 120, borderRadius: 10, border: '1px solid var(--line)', marginBottom: 6 }} /></a>}
          <input id="checkImage" name="checkImage" type="file" accept="image/*" />
        </Field>
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

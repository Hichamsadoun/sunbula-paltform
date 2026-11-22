import Link from 'next/link';
import type { Project } from '@prisma/client';
import { Field } from '@/components/ui';
import { COUNTRIES, SECTORS, PROJECT_STATUS, inputDate } from '@/lib/format';
import { saveProject } from './actions';

const ERR: Record<string, string> = {
  required: 'الرمز والاسم والدولة والقطاع والجمعية حقول مطلوبة.',
  dup: 'رمز المشروع مستخدم لمشروع آخر.',
  noassoc: 'أضف جمعية أولاً قبل إضافة المشاريع.',
};

export function ProjectForm({
  p,
  associations,
  error,
  defaults,
}: {
  p?: Project;
  associations: { id: string; name: string }[];
  error?: string;
  defaults?: { associationId?: string; code?: string };
}) {
  const action = saveProject.bind(null, p?.id ?? null);
  return (
    <form action={action} className="card form">
      {error && <div className="alert full">{ERR[error] ?? 'تعذّر الحفظ.'}</div>}
      {associations.length === 0 && (
        <div className="note full">لا توجد جمعيات بعد. <Link className="link" href="/associations/new">أضف جمعية</Link> أولاً.</div>
      )}
      <Field label="رمز المشروع *" name="code" hint="مثال: SN-26001">
        <input id="code" name="code" required dir="ltr" defaultValue={p?.code ?? defaults?.code} />
      </Field>
      <Field label="اسم المشروع *" name="name">
        <input id="name" name="name" required defaultValue={p?.name} />
      </Field>
      <Field label="الجهة المنفذة *" name="associationId">
        <select id="associationId" name="associationId" required defaultValue={p?.associationId ?? defaults?.associationId ?? ''}>
          <option value="" disabled>اختر الجمعية</option>
          {associations.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </select>
      </Field>
      <Field label="الحالة" name="status">
        <select id="status" name="status" defaultValue={p?.status ?? 'IN_PROGRESS'}>
          {Object.entries(PROJECT_STATUS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </Field>
      <Field label="الدولة *" name="country">
        <input id="country" name="country" required list="countries" defaultValue={p?.country} />
        <datalist id="countries">{COUNTRIES.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="القطاع *" name="sector">
        <input id="sector" name="sector" required list="sectors" defaultValue={p?.sector} />
        <datalist id="sectors">{SECTORS.map((c) => <option key={c} value={c} />)}</datalist>
      </Field>
      <Field label="التكلفة (ر.ق) *" name="cost">
        <input id="cost" name="cost" type="number" min="0" step="0.01" required dir="ltr" defaultValue={p ? p.cost.toString() : ''} />
      </Field>
      <Field label="عدد المستفيدين" name="beneficiaries">
        <input id="beneficiaries" name="beneficiaries" type="number" min="0" dir="ltr" defaultValue={p?.beneficiaries ?? ''} />
      </Field>
      <Field label="السنة *" name="year">
        <input id="year" name="year" type="number" min="2000" max="2100" required dir="ltr" defaultValue={p?.year ?? new Date().getFullYear()} />
      </Field>
      <div />
      <Field label="تاريخ البدء" name="startDate">
        <input id="startDate" name="startDate" type="date" defaultValue={inputDate(p?.startDate)} />
      </Field>
      <Field label="تاريخ الانتهاء المتوقع" name="endDate">
        <input id="endDate" name="endDate" type="date" defaultValue={inputDate(p?.endDate)} />
      </Field>
      <Field label="نبذة عن المشروع" name="description" full>
        <textarea id="description" name="description" defaultValue={p?.description ?? ''} />
      </Field>
      <Field label="الأهداف" name="goals" full>
        <textarea id="goals" name="goals" defaultValue={p?.goals ?? ''} />
      </Field>
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href={p ? `/projects/${p.id}` : '/projects'}>إلغاء</Link>
      </div>
    </form>
  );
}

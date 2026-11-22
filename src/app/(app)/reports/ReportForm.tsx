import Link from 'next/link';
import type { Report } from '@prisma/client';
import { Field } from '@/components/ui';
import { saveReport } from './actions';

export function ReportForm({
  r,
  projects,
  error,
  projectId,
}: {
  r?: Report;
  projects: { id: string; code: string; name: string }[];
  error?: string;
  projectId?: string;
}) {
  return (
    <form action={saveReport.bind(null, r?.id ?? null)} className="card form">
      {error && <div className="alert full">المشروع وعنوان التقرير مطلوبان.</div>}
      <Field label="المشروع *" name="projectId">
        <select id="projectId" name="projectId" required defaultValue={r?.projectId ?? projectId ?? ''}>
          <option value="" disabled>اختر المشروع</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.code} · {p.name}</option>)}
        </select>
      </Field>
      <Field label="عنوان التقرير *" name="title" hint="مثال: التقرير الختامي، تقرير الربع الأول">
        <input id="title" name="title" required defaultValue={r?.title} />
      </Field>
      <Field label="ملخص التنفيذ" name="summary" full>
        <textarea id="summary" name="summary" defaultValue={r?.summary ?? ''} />
      </Field>
      <Field label="النتائج والأثر" name="results" full>
        <textarea id="results" name="results" defaultValue={r?.results ?? ''} />
      </Field>
      <Field label="ملاحظات" name="notes" full>
        <textarea id="notes" name="notes" defaultValue={r?.notes ?? ''} />
      </Field>
      <Field label={r ? 'إضافة صور' : 'صور المشروع'} name="images" hint="يمكن اختيار عدة صور معاً.">
        <input id="images" name="images" type="file" accept="image/*" multiple />
      </Field>
      <div className="field" style={{ justifyContent: 'flex-end' }}>
        <label className="check"><input type="checkbox" name="published" defaultChecked={r?.published ?? false} /> اعتماد التقرير ونشره</label>
      </div>
      <div className="form-actions">
        <button className="btn" type="submit">حفظ</button>
        <Link className="btn ghost" href={r ? `/reports/${r.id}` : '/reports'}>إلغاء</Link>
      </div>
    </form>
  );
}

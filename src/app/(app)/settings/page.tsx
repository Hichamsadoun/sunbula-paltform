import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { audit, str } from '@/lib/forms';
import { getSettings, setSetting, SETTING_KEYS } from '@/lib/settings';
import { PageHead, Field } from '@/components/ui';

async function save(f: FormData) {
  'use server';
  const u = await requireAdmin();
  const year = Number(str(f, 'year')) || new Date().getFullYear();
  const target = str(f, 'target').replace(/,/g, '');
  if (target) await setSetting(SETTING_KEYS.target(year), String(Number(target) || 0));
  await setSetting(SETTING_KEYS.orgName, str(f, 'orgName'));
  await setSetting(SETTING_KEYS.heroTitle, str(f, 'heroTitle'));
  await setSetting(SETTING_KEYS.heroText, str(f, 'heroText'));
  await setSetting(SETTING_KEYS.publicStats, f.get('publicStats') === 'on' ? '1' : '0');
  await audit(u, 'تعديل', 'الإعدادات');
  revalidatePath('/', 'layout');
  redirect('/settings?saved=1');
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const s = await getSettings();
  const year = new Date().getFullYear();
  return (
    <>
      <PageHead title="الإعدادات" />
      {saved && <div className="note">تم الحفظ.</div>}
      <form action={save} className="card form">
        <Field label="اسم الجهة" name="orgName"><input id="orgName" name="orgName" defaultValue={s.orgName ?? 'السنبلة للتنمية'} /></Field>
        <div />
        <Field label="السنة" name="year"><input id="year" name="year" type="number" dir="ltr" defaultValue={year} /></Field>
        <Field label="المبلغ المستهدف لهذه السنة (ر.ق)" name="target" hint={s[SETTING_KEYS.target(year)] ? `الحالي: ${Number(s[SETTING_KEYS.target(year)]).toLocaleString('en-US')}` : 'غير محدد'}>
          <input id="target" name="target" type="number" min="0" dir="ltr" defaultValue={s[SETTING_KEYS.target(year)] ?? ''} />
        </Field>
        <Field label="عنوان الصفحة العامة" name="heroTitle" full><input id="heroTitle" name="heroTitle" defaultValue={s.heroTitle ?? 'نزرع الخير، ونحصد الأثر'} /></Field>
        <Field label="نص الصفحة العامة" name="heroText" full><textarea id="heroText" name="heroText" defaultValue={s.heroText ?? 'مشاريع تتابع أثرها، وتقارير واضحة من التبرع إلى الإنجاز.'} /></Field>
        <div className="field full">
          <label className="check"><input type="checkbox" name="publicStats" defaultChecked={s.publicStats !== '0'} /> عرض الأرقام الإجمالية في الصفحة العامة</label>
        </div>
        <div className="form-actions"><button className="btn" type="submit">حفظ</button></div>
      </form>
    </>
  );
}

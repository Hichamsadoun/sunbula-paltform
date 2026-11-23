import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/db';
import { audit, saveImages, str } from '@/lib/forms';
import { BrandLogo } from '@/components/Logo';
import { getSettings, setSetting } from '@/lib/settings';
import { HOME_DEFAULTS, OVERRIDES } from '@/lib/home';
import { PageHead, Field } from '@/components/ui';

const TEXTS: { key: string; label: string; area?: boolean; hint?: string }[] = [
  { key: 'heroTitle', label: 'العنوان الرئيسي', area: true, hint: 'كل سطر يظهر في سطر مستقل.' },
  { key: 'heroText', label: 'النص تحت العنوان', area: true },
  { key: 'presName', label: 'اسم الرئيس' },
  { key: 'presTitle', label: 'المنصب' },
  { key: 'presWords', label: 'كلمة الرئيس', area: true, hint: 'اترك سطراً فارغاً بين الفقرات.' },
  { key: 'aboutTitle', label: 'عنوان «عن السنبلة»', area: true },
  { key: 'aboutText', label: 'نص «عن السنبلة»', area: true, hint: 'اترك سطراً فارغاً بين الفقرات.' },
  { key: 'achievementsText', label: 'نص «إنجازاتنا»', area: true, hint: 'اتركه فارغاً ليُكتب تلقائياً من الأرقام.' },
  { key: 'orphanMonthly', label: 'كفالة اليتيم شهرياً (ر.ق)' },
  { key: 'contactEmail', label: 'البريد الإلكتروني للتواصل' },
  { key: 'contactPhone', label: 'رقم الهاتف' },
  { key: 'contactAddress', label: 'العنوان' },
];

async function save(f: FormData) {
  'use server';
  const u = await requireAdmin();
  for (const t of TEXTS) await setSetting(`home:${t.key}`, str(f, t.key));
  for (const o of OVERRIDES) await setSetting(`home:${o.key}`, str(f, o.key).replace(/,/g, ''));
  const [pres] = await saveImages([f.get('presPhoto')].filter(Boolean) as FormDataEntryValue[]);
  if (pres) await setSetting('home:presPhoto', pres);
  const [logo] = await saveImages([f.get('logo')].filter(Boolean) as FormDataEntryValue[]);
  if (logo) await setSetting('home:logo', logo);
  if (f.get('logoReset')) await setSetting('home:logo', '');
  const [orph] = await saveImages([f.get('orphanPhoto')].filter(Boolean) as FormDataEntryValue[]);
  if (orph) await setSetting('home:orphanPhoto', orph);
  await audit(u, 'تعديل', 'الصفحة الرئيسية');
  revalidatePath('/');
  redirect('/site?saved=1');
}

async function reset() {
  'use server';
  const u = await requireAdmin();
  await db.setting.deleteMany({ where: { key: { startsWith: 'home:' } } });
  await audit(u, 'استعادة', 'الصفحة الرئيسية');
  revalidatePath('/');
  redirect('/site?saved=1');
}

export default async function SitePage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  await requireAdmin();
  const { saved } = await searchParams;
  const s = await getSettings();
  const val = (k: string) => s[`home:${k}`] ?? HOME_DEFAULTS[k] ?? '';
  return (
    <>
      <PageHead title="الصفحة الرئيسية" sub="ما يراه الزوار على الرابط الرئيسي للموقع">
        <Link className="btn ghost" href="/" target="_blank">عرض الصفحة ↗</Link>
      </PageHead>
      {saved && <div className="note">تم الحفظ. التغييرات ظاهرة الآن في الصفحة الرئيسية.</div>}
      <div className="note">
        الأرقام (المشاريع، المستفيدون، الدول، الأيتام، نسبة تحقق الهدف) تُحسب تلقائياً من بيانات النظام. المبلغ المستهدف للسنة يُضبط من <Link className="link" href="/settings">الإعدادات</Link>، والمشاريع تظهر بصورها من التقارير المعتمدة.
      </div>
      <form action={save} className="grid" style={{ gap: 20 }}>
        <div className="card form">
          <h2 className="full" style={{ margin: 0 }}>النصوص</h2>
          {TEXTS.map((t) => (
            <Field key={t.key} label={t.label} name={t.key} full={t.area} hint={t.hint}>
              {t.area ? <textarea id={t.key} name={t.key} defaultValue={val(t.key)} /> : <input id={t.key} name={t.key} defaultValue={val(t.key)} />}
            </Field>
          ))}
        </div>
        <div className="card form">
          <h2 className="full" style={{ margin: 0 }}>الصور</h2>
          <Field label="شعار المنصة (يظهر أعلى الموقع وفي النظام)" name="logo" hint="صورة PNG أو JPG مربعة يفضّل أن تكون بخلفية شفافة.">
            <span className={`brand-mark${s['home:logo'] ? ' has-img' : ''}`} style={{ marginBottom: 6 }}><BrandLogo src={s['home:logo']} /></span>
            <input id="logo" name="logo" type="file" accept="image/*" />
            {s['home:logo'] && <label style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6, fontWeight: 400 }}><input type="checkbox" name="logoReset" style={{ width: 'auto' }} /> الرجوع إلى شعار السنبلة الافتراضي</label>}
          </Field>
          <Field label="صورة الرئيس" name="presPhoto" hint="اترك الحقل فارغاً للإبقاء على الصورة الحالية.">
            <img src={s['home:presPhoto'] || '/president.jpg'} alt="" style={{ width: 90, height: 110, objectFit: 'cover', borderRadius: 12, marginBottom: 6 }} />
            <input id="presPhoto" name="presPhoto" type="file" accept="image/*" />
          </Field>
          <Field label="صورة كفالة الأيتام (أعلى الصفحة)" name="orphanPhoto">
            {s['home:orphanPhoto'] && <img src={s['home:orphanPhoto']} alt="" style={{ width: 150, height: 104, objectFit: 'cover', borderRadius: 12, marginBottom: 6 }} />}
            <input id="orphanPhoto" name="orphanPhoto" type="file" accept="image/*" />
          </Field>
        </div>
        <div className="card form">
          <h2 className="full" style={{ margin: 0 }}>تعديل الأرقام يدوياً (اختياري)</h2>
          <p className="full" style={{ margin: 0, color: 'var(--muted)' }}>اترك الحقل فارغاً ليُحسب تلقائياً. استخدمه فقط إذا أردت إظهار رقم يشمل إنجازات سابقة غير مسجلة في النظام.</p>
          {OVERRIDES.map((o) => (
            <Field key={o.key} label={o.label} name={o.key}>
              <input id={o.key} name={o.key} type="number" min="0" dir="ltr" placeholder="تلقائي" defaultValue={s[`home:${o.key}`] ?? ''} />
            </Field>
          ))}
        </div>
        <div className="row"><button className="btn" type="submit">حفظ التغييرات</button></div>
      </form>
      <form action={reset}>
        <button className="btn danger sm" type="submit">استعادة النصوص الأصلية</button>
      </form>
    </>
  );
}

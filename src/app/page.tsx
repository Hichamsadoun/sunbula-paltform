import Link from 'next/link';
import { db } from '@/lib/db';
import { getSettings } from '@/lib/settings';
import { Logo } from '@/components/Logo';
import { fmt, toNum } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [s, projects, orphans] = await Promise.all([
    getSettings(),
    db.project.findMany({ select: { cost: true, beneficiaries: true, country: true, status: true } }),
    db.orphan.count({ where: { status: 'SPONSORED' } }),
  ]);
  const show = s.publicStats !== '0' && projects.length > 0;
  const stats = [
    { label: 'مشروع منجز', value: fmt(projects.filter((p) => p.status === 'DONE').length) },
    { label: 'مستفيد', value: fmt(projects.reduce((a, p) => a + (p.beneficiaries ?? 0), 0)) },
    { label: 'دولة', value: fmt(new Set(projects.map((p) => p.country)).size) },
    { label: 'يتيم في كفالتنا', value: fmt(orphans) },
    { label: 'ر.ق قيمة المشاريع', value: fmt(projects.reduce((a, p) => a + toNum(p.cost), 0)) },
  ];
  return (
    <>
      <header className="pub-nav">
        <div className="in">
          <div className="brand">
            <div className="brand-mark"><Logo /></div>
            <span className="brand-name kufi" style={{ color: 'var(--navy)' }}>{s.orgName || 'السنبلة للتنمية'}</span>
          </div>
          <Link className="btn" href="/login">دخول النظام</Link>
        </div>
      </header>
      <section className="hero">
        <div className="in">
          <h1 className="kufi">{s.heroTitle || 'نزرع الخير، ونحصد الأثر'}</h1>
          <p>{s.heroText || 'مشاريع تتابع أثرها، وتقارير واضحة من التبرع إلى الإنجاز.'}</p>
        </div>
      </section>
      <div className="wrap">
        {show && (
          <div className="grid g4" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))' }}>
            {stats.map((x) => (
              <div key={x.label} className="card stat"><b className="accent">{x.value}</b><span>{x.label}</span></div>
            ))}
          </div>
        )}
        <div className="grid g3">
          <div className="card"><h2>البذرة: نختار المشروع</h2><p style={{ margin: 0, color: 'var(--muted)' }}>ندرس الاحتياج مع الجهات الشريكة ونحدد المشروع الأنسب.</p></div>
          <div className="card"><h2>النماء: نتابع التنفيذ</h2><p style={{ margin: 0, color: 'var(--muted)' }}>نتابع مراحل التنفيذ والدفعات خطوة بخطوة.</p></div>
          <div className="card"><h2>الحصاد: نقيس الأثر</h2><p style={{ margin: 0, color: 'var(--muted)' }}>تقارير مصورة بالنتائج وعدد المستفيدين.</p></div>
        </div>
      </div>
    </>
  );
}

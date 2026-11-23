import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/Logo';
import { getHomeData, arCount, PROJECTS_W, COUNTRIES_W, TABS } from '@/lib/home';
import { FLAGS, ICONS } from '@/lib/home-assets';
import { fmt } from '@/lib/format';
import { HomeMotion } from '@/components/HomeMotion';
import './home.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'السنبلة للتنمية' };

const Svg = ({ html, className }: { html: string; className?: string }) => (
  <span className={className} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />
);
const Lines = ({ text }: { text: string }) => (
  <>{text.split('\n').map((l, i, a) => <span key={i}>{l}{i < a.length - 1 && <br />}</span>)}</>
);
const Paras = ({ text, className }: { text: string; className?: string }) => (
  <>{text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p, i) => <p key={i} className={className}>{p}</p>)}</>
);

function Donut({ pct, size = 180 }: { pct: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  return (
    <div className="hp-donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" width={size} height={size} aria-hidden="true">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#E4E9F2" strokeWidth="10" />
        {pct > 0 && <circle cx="50" cy="50" r={r} fill="none" stroke="#1F3A68" strokeWidth="10" strokeLinecap="round"
          className="hp-arc" style={{ ['--arc' as string]: `${(pct / 100) * c}`, ['--c' as string]: `${c}` }}
          strokeDasharray={`${(pct / 100) * c} ${c}`} transform="rotate(-90 50 50)" />}
      </svg>
      <span style={{ fontSize: size / 5 }}>{pct}%<small style={{ fontSize: Math.max(11, size / 14) }}>{size > 120 ? 'نسبة التحصيل' : ''}</small></span>
    </div>
  );
}

const NAV = [
  ['#plan', 'خطتنا'], ['#president', 'كلمة الرئيس'], ['#about', 'عن السنبلة'], ['#achievements', 'إنجازاتنا'], ['#orphans', 'الأيتام'],
  ['#projects', 'المشاريع'], ['#how', 'كيف نعمل'], ['#contact', 'تواصل معنا'],
];

/** Public home page: the original design, laid out responsively and filled from the system's data. */
export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const d = await getHomeData(tab ?? 'all');
  const s = d.stats;
  const short = d.orgName.split(' ')[0];

  return (
    <div className="hp">
      <header className="hp-nav">
        <div className="hx hp-nav-in">
          <a href="#top" className="hp-brand">
            <span className="hp-mark"><Logo size={28} /></span>
            <span><b className="kufi">{short}</b><small>للتنمية</small></span>
          </a>
          <nav className="hp-links">{NAV.map(([h, l]) => <a key={h} href={h}>{l}</a>)}</nav>
          <div className="hp-cta">
            <Link className="hb hb-line" href="/login">تسجيل الدخول</Link>
          </div>
        </div>
      </header>

      {d.associations.length > 0 && (
        <div className="hp-partners" aria-label="الجمعيات الشريكة">
          <div className="hx hp-partners-in">
            <span className="hp-partners-label">شركاؤنا في الخير</span>
            <div className="hp-marquee">
              <div className="hp-marquee-track" style={{ animationDuration: `${Math.max(20, d.associations.length * 6)}s` }}>
                {[0, 1].map((k) =>
                  Array.from({ length: Math.max(1, Math.ceil(8 / d.associations.length)) }).flatMap((_, rep) =>
                    d.associations.map((a) => (
                      <span className="hp-partner" key={`${k}-${rep}-${a.id}`} aria-hidden={k === 1 || rep > 0 ? true : undefined}>
                        {a.logoUrl ? <img src={a.logoUrl} alt={a.name} /> : <i>{a.name.charAt(0)}</i>}
                        <b>{a.name}</b>
                      </span>
                    )),
                  ),
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <main id="top">
        {/* HERO */}
        <section className="hx">
          <div className="hp-hero" data-reveal>
            <span className="hp-hero-deco" aria-hidden="true"><Logo size={220} /></span>
            <div className="hp-hero-text">
              <span className="hp-pill">{short}</span>
              <h1><Lines text={d.text('heroTitle')} /></h1>
              <p>{d.text('heroText')}</p>
              <div className="hp-row">
                <a className="hb" href="#contact">ادعم مشروعاً</a>
                <a className="hb hb-white" href="#projects">استعرض المشاريع</a>
              </div>
            </div>
            <div className="hp-tiles hp-stagger" data-reveal>
              {d.sectorCounts.map((t) => (
                <div className="hp-tile" key={t.name}>
                  <Svg className="hp-ico" html={ICONS[t.icon]} />
                  <b>{t.name}</b>
                  <small>{arCount(t.count, PROJECTS_W)}</small>
                </div>
              ))}
              <a className="hp-tile hp-tile-dark" href="#orphans">
                <span className="hp-big">{fmt(s.orphans)}</span>
                <b>كفالة الأيتام</b>
                <small>يتيم مكفول</small>
              </a>
            </div>
          </div>
        </section>

        {/* PLAN */}
        {d.plan && (
          <section id="plan" className="hx hp-sec">
            <div className="hp-card hp-plan" data-reveal>
              <div className="hp-plan-main">
                <Donut pct={d.plan.pct} />
                <div>
                  <span className="hp-eyebrow">خطتنا {d.plan.from === d.plan.to ? d.plan.from : `${d.plan.from} – ${d.plan.to}`}</span>
                  <h2>{d.plan.rows.length === 1 ? 'خطة سنة واحدة' : d.plan.rows.length === 2 ? 'خطة لسنتين' : `خطة لـ ${d.plan.rows.length} سنوات`}</h2>
                  <div className="hp-plan-figs">
                    <div><small>المستهدف للخطة كاملة</small><b>{fmt(d.plan.target)} ر.ق</b></div>
                    <div><small>المحصّل</small><b className="navy" data-count={`${fmt(d.plan.collected)} ر.ق`}>{fmt(d.plan.collected)} ر.ق</b></div>
                    <div><small>المتبقي</small><b>{fmt(Math.max(0, d.plan.target - d.plan.collected))} ر.ق</b></div>
                  </div>
                </div>
              </div>
              <div className="hp-plan-years hp-stagger" data-reveal>
                {d.plan.rows.map((r) => (
                  <div className="hp-plan-year" key={r.year}>
                    <Donut pct={r.pct} size={92} />
                    <div>
                      <b className="hp-plan-y">{r.year}</b>
                      <small>المستهدف: {fmt(r.target)} ر.ق</small>
                      <small>المحصّل: {fmt(r.collected)} ر.ق</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* PRESIDENT */}
        <section id="president" className="hx hp-sec">
          <div className="hp-card hp-pres" data-reveal>
            <figure>
              <img src={d.presPhoto} alt={d.text('presName')} />
              <figcaption><b>{d.text('presName')}</b><small>{d.text('presTitle')}</small></figcaption>
            </figure>
            <div className="hp-pres-words">
              <span className="hp-eyebrow">كلمة الرئيس</span>
              <Svg className="hp-quote" html={ICONS.quote} />
              <Paras text={d.text('presWords')} />
            </div>
          </div>
        </section>

        {/* IMPACT */}
        <section className="hx hp-sec">
          <div className="hp-impact" data-reveal>
            <div className="hp-impact-top">
              <div><small>المبلغ المستهدف لعام {d.year}</small><b>{s.target ? `${fmt(s.target)} ر.ق` : '—'}</b></div>
              <div><small>إجمالي قيمة المشاريع المنفذة</small><b className="silver">{fmt(s.totalValue)} ر.ق</b></div>
              <div className="hp-impact-bar">
                <div className="hp-spread"><small>نسبة التحقق من الهدف</small><b>{s.pct}%</b></div>
                <div className="hp-track dark"><div style={{ width: `${s.pct}%` }} /></div>
                {s.target > 0 && <small>المتبقي للوصول إلى الهدف: {fmt(Math.max(0, s.target - s.totalValue))} ر.ق</small>}
              </div>
            </div>
            <div className="hp-impact-nums">
              <div><i className="dot a" /><b>{fmt(s.done)}</b><small>منجز</small></div>
              <div><i className="dot b" /><b>{fmt(s.inProgress)}</b><small>قيد التنفيذ</small></div>
              <div><i className="dot c" /><b>{fmt(s.planned)}</b><small>مشاريع جديدة</small></div>
              <div><b>{fmt(s.countries)}</b><small>دول</small></div>
              <div><b>{fmt(s.partners)}</b><small>مؤسسات شريكة</small></div>
            </div>
          </div>
        </section>

        {/* ABOUT */}
        <section id="about" className="hx hp-sec">
          <div className="hp-split" data-reveal>
            <div><span className="hp-eyebrow">عن السنبلة</span><h2><Lines text={d.text('aboutTitle')} /></h2></div>
            <div><Paras text={d.text('aboutText')} className="hp-lead" /></div>
          </div>
          <div className="hp-grid3 hp-stagger" data-reveal>
            {[
              ['seed', 'البذرة: نختار المشروع', 'ندرس الاحتياج الفعلي، ونختار المشروع الأنفع والجهة المنفذة الأكفأ.'],
              ['grow', 'النماء: نتابع التنفيذ', 'متابعة ميدانية وتقارير دورية بالصور والأرقام في كل مرحلة.'],
              ['harvest', 'الحصاد: نقيس الأثر', 'مستفيدون حقيقيون، وخدمات مستدامة، وأثر يمكن رؤيته وقياسه.'],
            ].map(([i, t, b]) => (
              <div className="hp-card hp-feature" key={t}><Svg className="hp-ico" html={ICONS[i]} /><h3>{t}</h3><p>{b}</p></div>
            ))}
          </div>
        </section>

        {/* ACHIEVEMENTS */}
        <section id="achievements" className="hx hp-sec">
          <div className="hp-split" data-reveal>
            <div><span className="hp-eyebrow">إنجازاتنا</span><h2>في {arCount(s.countries, COUNTRIES_W)} حول العالم</h2></div>
            {d.achievementsText && <p className="hp-lead">{d.achievementsText}</p>}
          </div>
          <div className="hp-stats hp-stagger" data-reveal>
            <div className="hp-stat dark"><b data-count={fmt(s.totalValue)}>{fmt(s.totalValue)}</b><small>إجمالي قيمة البرامج المنفذة (ر.ق)</small></div>
            <div className="hp-stat"><b data-count={`+${fmt(s.beneficiaries)}`}>+{fmt(s.beneficiaries)}</b><small>مستفيد</small></div>
            <div className="hp-stat"><b data-count={fmt(s.countries)}>{fmt(s.countries)}</b><small>دول</small></div>
            <div className="hp-stat"><b data-count={fmt(s.done)}>{fmt(s.done)}</b><small>مشروع منجز</small></div>
          </div>
          {d.countries.length > 0 && (
            <>
              <h3 className="hp-sub">الدول التي وصلنا إليها</h3>
              <div className="hp-countries hp-stagger" data-reveal>
                {d.countries.map((c) => (
                  <div className="hp-card hp-country" key={c.name}>
                    {FLAGS[c.name] && <Svg className="hp-flag" html={FLAGS[c.name]} />}
                    <b>{c.name}</b><small>{arCount(c.projects, PROJECTS_W)}</small>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* ORPHANS */}
        <section id="orphans" className="hx hp-sec">
          <div className="hp-head" data-reveal>
            <div>
              <span className="hp-eyebrow">كفالة الأيتام</span>
              <h2>{fmt(s.orphans)} يتيماً في كفالتنا</h2>
              <p className="hp-muted">بكفالة شهرية تشمل الغذاء والتعليم والرعاية الصحية</p>
            </div>
            <div className="hp-row">
              {d.orphanMonthly > 0 && <div className="hp-chip-stat"><b>{fmt(d.orphanMonthly)} ر.ق</b><small>كفالة اليتيم شهرياً</small></div>}
              <a className="hb" href="#contact">اكفل يتيماً</a>
            </div>
          </div>
          {d.orphanRows.length > 0 && (
            <div className="hp-auto hp-stagger" data-reveal>
              {d.orphanRows.map((o) => (
                <div className="hp-card hp-orphan" key={o.name}>
                  <div className="hp-spread">
                    <span className="hp-row tight">{FLAGS[o.name] && <Svg className="hp-flag sm" html={FLAGS[o.name]} />}<b>{o.name}</b></span>
                    <small className="hp-muted">{o.share}%</small>
                  </div>
                  <div><span className="hp-num" data-count={fmt(o.n)}>{fmt(o.n)}</span> <small className="hp-muted">يتيماً مكفولاً</small></div>
                  <div className="hp-track"><div style={{ width: `${o.share}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* HOW */}
        <section id="how" className="hx hp-sec">
          <div className="hp-center" data-reveal><span className="hp-eyebrow">كيف نعمل</span><h2>ثلاث خطوات من التبرع إلى الأثر</h2></div>
          <div className="hp-grid3 hp-stagger" data-reveal>
            {[
              ['سجّل التبرع', 'أدخل الجمعية، المشروع، والمبلغ، وحدّد إن كان دفعة واحدة أو على دفعات.'],
              ['تابع الدفعات', 'جدول واضح لما دُفع وما هو مستحق، مع تنبيه قبل موعد كل دفعة.'],
              ['شاهد الإنجاز', 'نسبة إنجاز كل مشروع، مع الصور والتقارير التي ترسلها الجمعية.'],
            ].map(([t, b], i) => (
              <div className="hp-card hp-feature" key={t}><span className="hp-step">{i + 1}</span><h3>{t}</h3><p>{b}</p></div>
            ))}
          </div>
        </section>

        {/* PROJECTS */}
        <section id="projects" className="hx hp-sec">
          <div className="hp-head" data-reveal>
            <div><span className="hp-eyebrow">المشاريع</span><h2>مشاريع تتابع أثرها</h2></div>
            <div className="hp-tabs">
              {TABS.map((t) => <a key={t.key} href={`/?tab=${t.key}#projects`} className={d.tab === t.key ? 'on' : ''}>{t.label}</a>)}
            </div>
          </div>
          {d.cards.length === 0 ? (
            <div className="hp-empty"><b>لا توجد مشاريع لعرضها بعد</b><span>تظهر المشاريع هنا تلقائياً عند إضافتها في النظام.</span></div>
          ) : (
            <div className="hp-auto wide hp-stagger" data-reveal>
              {d.cards.map((p) => (
                <Link href={`/p/${p.id}`} className="hp-card hp-project" key={p.id}>
                  {p.img ? <img src={p.img} alt="" /> : <div className="hp-ph">{p.sector}</div>}
                  <div className="hp-project-body">
                    <span className="hp-tag">{p.sector}</span>
                    <h3>{p.name}</h3>
                    <small className="hp-muted">{p.meta}</small>
                    <div className="hp-track"><div style={{ width: `${p.progress}%` }} /></div>
                    <div className="hp-spread"><b className="navy">{p.status} · {p.progress}%</b><small className="hp-muted">{p.value}</small></div>
                    <span className="hp-more">عرض تقرير المشروع ←</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* REPORTS */}
        <section id="reports" className="hx hp-sec">
          <div className="hp-band" data-reveal>
            <div>
              <h2>تقارير واضحة<br />لكل ريال تبرعت به</h2>
              <p>اعرف أين ذهب تبرعك، ومتى، وما الذي تحقق.</p>
              <a className="hb hb-silver" href="#projects">استعرض المشاريع وتقاريرها</a>
            </div>
            <div className="hp-band-list">
              {[['report', 'تقرير سنوي بكل التبرعات والمشاريع'], ['bell', 'متابعة مواعيد الدفعات وتحديثات الإنجاز'], ['photo', 'صور ومرفقات الإنجاز لكل مشروع']].map(([i, t]) => (
                <div key={t}><Svg className="hp-ico light" html={ICONS[i]} /><span>{t}</span></div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer id="contact" className="hp-foot">
        <div className="hx">
          <div className="hp-foot-top">
            <div><b className="kufi hp-foot-brand">{short}</b><p className="hp-muted">{d.orgName} — نتابع التبرع حتى يصبح أثراً.</p></div>
            <div className="hp-foot-cols">
              <div><b>المنصة</b><a href="#projects">المشاريع</a><a href="#how">كيف نعمل</a><Link href="/login">دخول النظام</Link></div>
              {d.contact.length > 0 && <div><b>تواصل معنا</b>{d.contact.map((c) => <span key={c} dir="auto">{c}</span>)}</div>}
            </div>
          </div>
          <div className="hp-foot-bottom"><span>© {d.year} {d.orgName}. جميع الحقوق محفوظة.</span></div>
        </div>
      </footer>
      <HomeMotion />
    </div>
  );
}

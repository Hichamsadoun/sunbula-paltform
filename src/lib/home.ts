import 'server-only';
import { db } from './db';
import { getSettings, SETTING_KEYS } from './settings';
import { fmt, toNum } from './format';


/** Defaults are the texts of the original design; every one can be changed from «الصفحة الرئيسية» in the admin. */
export const HOME_DEFAULTS: Record<string, string> = {
  heroTitle: 'حبّةٌ واحدة\nتُنبت سبع سنابل',
  heroText: 'نحوّل العطاء إلى مشاريع تنموية يتضاعف أثرها: تمكين اقتصادي، ومياه، وتعليم، وصحة، وإغاثة، وكفالة أيتام.',
  presName: 'خالد عبدالله اليافعي',
  presTitle: 'رئيس السنبلة للتنمية',
  presWords:
    'العمل الإنساني ليس عطاءً عابراً، بل مسؤولية نحملها تجاه كل أسرة أثقلتها الحاجة. ومن هذا الإيمان انطلقت السنبلة، مستلهمةً اسمها من قوله تعالى: ﴿كَمَثَلِ حَبَّةٍ أَنبَتَتْ سَبْعَ سَنَابِلَ﴾؛ فالحبّة الصغيرة إذا وُضعت في أرضها الصحيحة أنبتت خيراً يتضاعف ويمتد.\n\nنؤمن بأن أفضل ما نقدّمه للمحتاج ليس ما يسدّ حاجته اليوم فحسب، بل ما يمكّنه من الاعتماد على نفسه غداً. لذلك نعمل مع شركائنا على مشاريع تنموية مستدامة تحفظ كرامة الإنسان، وتصنع له مصدر رزق، وتعيد إليه الأمل. وكل ما تحقق هو ثمرة ثقة المتبرعين وجهود العاملين، نسأل الله أن يجعله في ميزان حسناتهم.',
  aboutTitle: 'نزرع الخير\nليُثمر أثراً يبقى',
  aboutText:
    'السنبلة للتنمية مبادرة تؤمن بأن العطاء كالبذرة: إذا وُضع في أرضه الصحيحة نما وتضاعف. لذلك نختار مشاريع يمتد أثرها ويبقى: تمكين اقتصادي يصنع دخلاً، ومياه تروي القرى، وتعليم يفتح الأبواب، وصحة تحفظ الحياة.\n\nنعمل مع جهات شريكة موثوقة، ونتابع كل مشروع من البذرة حتى الحصاد، ونشارك المتبرعين تقارير واضحة بكل ما تحقق.',
  achievementsText: '',
  orphanMonthly: '300',
  contactEmail: '',
  contactPhone: '',
  contactAddress: 'الدوحة، قطر',
};

/** Headline numbers the admin can override (e.g. to include history not entered in the system). */
export const OVERRIDES = [
  { key: 'ov_totalValue', label: 'إجمالي قيمة المشاريع المنفذة (ر.ق)' },
  { key: 'ov_beneficiaries', label: 'عدد المستفيدين' },
  { key: 'ov_countries', label: 'عدد الدول' },
  { key: 'ov_done', label: 'المشاريع المنجزة' },
  { key: 'ov_inProgress', label: 'المشاريع قيد التنفيذ' },
  { key: 'ov_planned', label: 'المشاريع الجديدة' },
  { key: 'ov_partners', label: 'المؤسسات الشريكة' },
  { key: 'ov_orphans', label: 'الأيتام المكفولون' },
] as const;

/** Arabic counted noun: 0 → «لا …», 1, 2 (dual), 3–10 (plural), 11+ (singular accusative). */
export function arCount(n: number, w: { one: string; two: string; few: string; many: string; none: string }) {
  if (n === 0) return w.none;
  if (n === 1) return w.one;
  if (n === 2) return w.two;
  return `${fmt(n)} ${n <= 10 ? w.few : w.many}`;
}
export const PROJECTS_W = { none: 'لا مشاريع بعد', one: 'مشروع واحد', two: 'مشروعان', few: 'مشاريع', many: 'مشروعاً' };
export const COUNTRIES_W = { none: 'لا دول بعد', one: 'دولة واحدة', two: 'دولتان', few: 'دول', many: 'دولة' };

export const SECTOR_TILES = [
  { name: 'التمكين الاقتصادي', icon: 'econ' },
  { name: 'المياه', icon: 'water' },
  { name: 'التعليم', icon: 'edu' },
  { name: 'الصحة', icon: 'health' },
  { name: 'الإغاثة', icon: 'relief' },
];

export const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'DONE', label: 'المنجزة' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
] as const;

export async function getHomeData(tab: string) {
  const [s, projects, orphans, partners, planTargets, donations] = await Promise.all([
    getSettings(),
    db.project.findMany({
      orderBy: [{ year: 'desc' }, { createdAt: 'desc' }],
      include: {
        association: { select: { name: true } },
        phases: { select: { done: true } },
        reports: { where: { published: true }, orderBy: { createdAt: 'desc' }, take: 1, include: { images: { take: 1 } } },
      },
    }),
    db.orphan.findMany({ where: { status: 'SPONSORED' }, select: { country: true } }),
    db.association.count(),
    db.planTarget.findMany({ select: { year: true, amount: true } }),
    db.donation.findMany({ select: { date: true, amount: true } }),
  ]);
  const planYears = [...new Set(planTargets.map((t) => t.year))].sort();
  const planRows = planYears.map((y) => {
    const target = planTargets.filter((t) => t.year === y).reduce((a, t) => a + toNum(t.amount), 0);
    const collected = donations.filter((x) => x.date.getUTCFullYear() === y).reduce((a, x) => a + toNum(x.amount), 0);
    return { year: y, target, collected, pct: target ? Math.min(100, Math.round((collected / target) * 100)) : 0 };
  });
  const planTarget = planRows.reduce((a, r) => a + r.target, 0);
  const planCollected = planRows.reduce((a, r) => a + r.collected, 0);
  const plan = planRows.length
    ? { rows: planRows, target: planTarget, collected: planCollected, pct: planTarget ? Math.min(100, Math.round((planCollected / planTarget) * 100)) : 0, from: planYears[0], to: planYears[planYears.length - 1] }
    : null;
  const text = (k: string) => (s[`home:${k}`] ?? HOME_DEFAULTS[k] ?? '').toString();
  const ov = (k: string, computed: number) => (s[`home:ov_${k}`] ? Number(s[`home:ov_${k}`]) : computed);

  const year = new Date().getFullYear();
  const active = projects.filter((p) => p.status !== 'PLANNED');
  const totalValue = ov('totalValue', active.reduce((a, p) => a + toNum(p.cost), 0));
  const target = toNum(s[SETTING_KEYS.target(year)]);
  const countryList = [...new Set(active.map((p) => p.country))];
  const byCountry = new Map<string, number>();
  for (const o of orphans) byCountry.set(o.country, (byCountry.get(o.country) ?? 0) + 1);
  const orphanRows = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);
  const current = TABS.some((t) => t.key === tab) ? tab : 'all';
  const orgName = s.orgName || 'السنبلة للتنمية';

  const stats = {
    totalValue,
    target,
    pct: target ? Math.min(100, Math.round((totalValue / target) * 100)) : 0,
    countries: ov('countries', countryList.length),
    done: ov('done', projects.filter((p) => p.status === 'DONE').length),
    inProgress: ov('inProgress', projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'LATE').length),
    planned: ov('planned', projects.filter((p) => p.status === 'PLANNED').length),
    partners: ov('partners', partners),
    beneficiaries: ov('beneficiaries', projects.reduce((a, p) => a + (p.beneficiaries ?? 0), 0)),
    orphans: ov('orphans', orphans.length),
  };

  const achievementsText =
    text('achievementsText') ||
    (stats.done || stats.totalValue
      ? `نفّذت ${orgName} ${arCount(stats.done, PROJECTS_W)} في ${arCount(stats.countries, COUNTRIES_W)}، بقيمة ${fmt(stats.totalValue)} ر.ق، ووصل أثرها إلى أكثر من ${fmt(stats.beneficiaries)} مستفيد.`
      : '');

  return {
    plan,
    year,
    orgName,
    text,
    stats,
    achievementsText,
    sectorCounts: SECTOR_TILES.map((t) => ({ ...t, count: projects.filter((p) => p.sector === t.name).length })),
    countries: countryList.map((c) => ({ name: c, projects: active.filter((p) => p.country === c).length })),
    orphanRows: orphanRows.map(([name, n]) => ({ name, n, share: Math.round((n / orphans.length) * 100) })),
    orphanMonthly: Number(text('orphanMonthly')) || 0,
    presPhoto: s['home:presPhoto'] || '/president.jpg',
    orphanPhoto: s['home:orphanPhoto'] || null,
    tab: current,
    projectsTotal: projects.length,
    cards: projects
      .filter((p) => (current === 'all' ? p.status !== 'PLANNED' : p.status === current))
      .slice(0, 6)
      .map((p) => {
        const prog = p.phases.length ? Math.round((p.phases.filter((x) => x.done).length / p.phases.length) * 100) : p.status === 'DONE' ? 100 : 0;
        return {
          id: p.id,
          name: p.name,
          sector: p.sector,
          meta: `${p.association.name} · ${p.country} · ${p.year}`,
          img: p.reports[0]?.images[0]?.url ?? null,
          progress: p.status === 'DONE' ? 100 : prog,
          status: p.status === 'DONE' ? 'منجز' : p.status === 'LATE' ? 'متأخر' : 'قيد التنفيذ',
          value: `${p.beneficiaries != null ? `${fmt(p.beneficiaries)} مستفيد · ` : ''}${fmt(p.cost)} ر.ق`,
        };
      }),
    contact: [text('contactEmail'), text('contactPhone'), text('contactAddress')].filter(Boolean),
  };
}

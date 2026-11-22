import 'server-only';
import { db } from './db';
import { getSettings, SETTING_KEYS } from './settings';
import { FLAGS, HOME_TEMPLATE } from './home-template';
import { fmt, toNum } from './format';

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

const lines = (s: string) => esc(s).replace(/\n/g, '<br>');
const paras = (s: string, style: string) =>
  s.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean).map((p) => `<p style="${style}">${lines(p)}</p>`).join('\n');

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

const SECTORS = ['التمكين الاقتصادي', 'المياه', 'التعليم', 'الصحة', 'الإغاثة'];
const arCount = (n: number, one: string, two: string, few: string, many: string) =>
  n === 0 ? `لا ${many}` : n === 1 ? one : n === 2 ? two : n <= 10 ? `${fmt(n)} ${few}` : `${fmt(n)} ${many}`;
const projCount = (n: number) => arCount(n, 'مشروع واحد', 'مشروعان', 'مشاريع', 'مشروعاً');

const TABS = [
  { key: 'all', label: 'الكل' },
  { key: 'DONE', label: 'المنجزة' },
  { key: 'IN_PROGRESS', label: 'قيد التنفيذ' },
] as const;

export async function renderHome(tab: string): Promise<{ html: string; orgName: string }> {
  const [s, projects, orphans, partners] = await Promise.all([
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
  ]);
  const v = (k: string) => (s[`home:${k}`] ?? HOME_DEFAULTS[k] ?? '').toString();
  const ov = (k: string, computed: number) => (s[`home:ov_${k}`] ? Number(s[`home:ov_${k}`]) : computed);

  const year = new Date().getFullYear();
  const active = projects.filter((p) => p.status !== 'PLANNED');
  const totalValue = ov('totalValue', active.reduce((a, p) => a + toNum(p.cost), 0));
  const target = toNum(s[SETTING_KEYS.target(year)]);
  const pct = target ? Math.min(100, Math.round((totalValue / target) * 100)) : 0;
  const countries = ov('countries', new Set(active.map((p) => p.country)).size);
  const done = ov('done', projects.filter((p) => p.status === 'DONE').length);
  const beneficiaries = ov('beneficiaries', projects.reduce((a, p) => a + (p.beneficiaries ?? 0), 0));
  const orphanTotal = ov('orphans', orphans.length);
  const byCountry = new Map<string, number>();
  for (const o of orphans) byCountry.set(o.country, (byCountry.get(o.country) ?? 0) + 1);
  const orphanRows = [...byCountry.entries()].sort((a, b) => b[1] - a[1]);
  const maxOrphans = Math.max(1, ...orphanRows.map((r) => r[1]));
  const orgName = s.orgName || 'السنبلة للتنمية';
  const flag = (c: string) => FLAGS[c] ?? '';

  const chip = (t: string) =>
    `<span style="padding: 6px 12px; border-radius: 999px; background: #E4E9F2; font-size: 13px; font-weight: 600; color: #16294A">${esc(t)}</span>`;

  const countryList = [...new Set(active.map((p) => p.country))];
  const countryTiles = countryList.length
    ? `<div style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 14px">${countryList
        .map((c) => {
          const n = active.filter((p) => p.country === c).length;
          return `<div style="display: flex; flex-direction: column; align-items: center; gap: 12px; padding: 22px 12px; background: #FFFFFF; border: 1px solid #DCE0E6; border-radius: 18px">${flag(c)}<span style="font-size: 16px; font-weight: 600">${esc(c)}</span><span style="font-size: 13px; color: #586274">${projCount(n)}</span></div>`;
        })
        .join('')}</div>`
    : '<span style="font-size: 15px; color: #586274">ستظهر هنا الدول بعد إضافة المشاريع.</span>';

  const orphanCards = orphanRows.length
    ? orphanRows
        .map(([c, n]) => `<div style="padding: 24px; background: #FFFFFF; border: 1px solid #DCE0E6; border-radius: 20px; display: flex; flex-direction: column; gap: 14px">
<div style="display: flex; align-items: center; justify-content: space-between">
<div style="display: flex; align-items: center; gap: 12px">${flag(c)}<span style="font-size: 19px; font-weight: 700">${esc(c)}</span></div>
<span style="font-size: 13px; color: #586274">${Math.round((n / orphans.length) * 100)}%</span>
</div>
<div style="display: flex; align-items: baseline; gap: 8px"><span style="font-size: 38px; font-weight: 700; color: #1F3A68; line-height: 1.1">${fmt(n)}</span><span style="font-size: 15px; color: #586274">يتيماً مكفولاً</span></div>
<div style="height: 8px; border-radius: 999px; background: #E6E9ED; overflow: hidden"><div style="width: ${Math.round((n / maxOrphans) * 100)}%; height: 100%; background: #1F3A68; border-radius: 999px"></div></div>
</div>`)
        .join('')
    : '<div style="grid-column: 1 / -1; padding: 40px; background: #FFFFFF; border: 1px dashed #B6BDC8; border-radius: 20px; text-align: center; color: #586274">ستظهر هنا أعداد الأيتام المكفولين حسب الدولة.</div>';

  const current = TABS.some((t) => t.key === tab) ? tab : 'all';
  const projectTabs = TABS.map((t) => {
    const on = t.key === current;
    return `<a href="/?tab=${t.key}#projects" style="padding: 12px 22px; border-radius: 999px; font-size: 16px; font-weight: 600; background: ${on ? '#1F3A68' : '#FFFFFF'}; color: ${on ? '#FFFFFF' : '#1A2233'}; border: 1px solid ${on ? '#1F3A68' : '#DCE0E6'}">${t.label}</a>`;
  }).join('');
  const shown = projects.filter((p) => (current === 'all' ? p.status !== 'PLANNED' : p.status === current)).slice(0, 6);
  const projectCards = shown.length
    ? `<div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px">${shown
        .map((p) => {
          const img = p.reports[0]?.images[0]?.url;
          const prog = p.phases.length ? Math.round((p.phases.filter((x) => x.done).length / p.phases.length) * 100) : p.status === 'DONE' ? 100 : 0;
          const status = p.status === 'DONE' ? 'منجز' : p.status === 'LATE' ? 'متأخر' : `قيد التنفيذ · ${prog}%`;
          const value = `${p.beneficiaries != null ? `${fmt(p.beneficiaries)} مستفيد · ` : ''}${fmt(p.cost)} ر.ق`;
          return `<div style="background: #FFFFFF; border: 1px solid #DCE0E6; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column">
${img ? `<img src="${esc(img)}" alt="" style="height: 180px; width: 100%; object-fit: cover; display: block">` : `<div style="height: 180px; background: #E4E9F2; display: flex; align-items: center; justify-content: center; color: #16294A; font-size: 15px">${esc(p.sector)}</div>`}
<div style="padding: 26px; display: flex; flex-direction: column; gap: 12px">
<span style="align-self: flex-start; padding: 6px 12px; border-radius: 999px; background: #ECEEF1; font-size: 13px; font-weight: 600; color: #3F4A5A">${esc(p.sector)}</span>
<h3 style="margin: 0; font-size: 21px; font-weight: 700; line-height: 1.5">${esc(p.name)}</h3>
<span style="font-size: 15px; color: #586274">${esc(`${p.association.name} · ${p.country} · ${p.year}`)}</span>
<div style="height: 10px; border-radius: 999px; background: #E6E9ED; overflow: hidden"><div style="width: ${p.status === 'DONE' ? 100 : prog}%; height: 100%; background: #1F3A68"></div></div>
<div style="display: flex; justify-content: space-between; font-size: 15px"><span style="font-weight: 700; color: #16294A">${status}</span><span style="color: #586274">${value}</span></div>
<a href="/p/${p.id}" style="font-size: 15px; font-weight: 600">عرض تقرير المشروع ←</a>
</div>
</div>`;
        })
        .join('')}</div>`
    : `<div style="padding: 56px; background: #FFFFFF; border: 1px dashed #B6BDC8; border-radius: 24px; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center"><span style="font-size: 22px; font-weight: 700">لا توجد مشاريع لعرضها بعد</span><span style="font-size: 16px; color: #586274">تظهر المشاريع هنا تلقائياً عند إضافتها في النظام.</span></div>`;

  const orphanPhoto = s['home:orphanPhoto']
    ? `<img src="${esc(s['home:orphanPhoto'])}" alt="" style="width: 150px; height: 104px; flex-shrink: 0; border-radius: 14px; object-fit: cover">`
    : '';

  const contact = [v('contactEmail'), v('contactPhone'), v('contactAddress')]
    .filter(Boolean)
    .map((t) => `<span style="color: #586274" dir="auto">${esc(t)}</span>`)
    .join('');

  const achievementsText =
    v('achievementsText') ||
    (done || totalValue
      ? `نفّذت ${orgName} ${fmt(done)} مشروعاً تنموياً وإغاثياً في ${fmt(countries)} دول، بقيمة ${fmt(totalValue)} ر.ق، مع ${fmt(ov('partners', partners))} جهات شريكة، ووصل أثرها إلى أكثر من ${fmt(beneficiaries)} مستفيد.`
      : 'تظهر هنا أرقام الإنجاز تلقائياً من بيانات النظام.');

  const text: Record<string, string> = {
    orgShort: orgName.split(' ')[0],
    orgName,
    heroText: v('heroText'),
    sectorCount: String(SECTORS.length + 1),
    sec1: projCount(projects.filter((p) => p.sector === SECTORS[0]).length),
    sec2: projCount(projects.filter((p) => p.sector === SECTORS[1]).length),
    sec3: projCount(projects.filter((p) => p.sector === SECTORS[2]).length),
    sec4: projCount(projects.filter((p) => p.sector === SECTORS[3]).length),
    sec5: projCount(projects.filter((p) => p.sector === SECTORS[4]).length),
    orphans: fmt(orphanTotal),
    orphanCountries: fmt(byCountry.size),
    orphanMonthly: fmt(Number(v('orphanMonthly')) || 0),
    presName: v('presName'),
    presTitle: v('presTitle'),
    presPhoto: s['home:presPhoto'] || '/president.jpg',
    year: String(year),
    target: fmt(target),
    totalValue: fmt(totalValue),
    pct: String(pct),
    remaining: fmt(Math.max(0, target - totalValue)),
    done: fmt(done),
    inProgress: fmt(ov('inProgress', projects.filter((p) => p.status === 'IN_PROGRESS' || p.status === 'LATE').length)),
    planned: fmt(ov('planned', projects.filter((p) => p.status === 'PLANNED').length)),
    countries: fmt(countries),
    partners: fmt(ov('partners', partners)),
    beneficiaries: fmt(beneficiaries),
    achievementsText,
    projectsTotal: fmt(projects.length),
  };
  const raw: Record<string, string> = {
    heroTitle: lines(v('heroTitle')),
    aboutTitle: lines(v('aboutTitle')),
    aboutText: paras(v('aboutText'), 'margin: 0; font-size: 19px; line-height: 2; color: #3F4A5A; text-align: justify'),
    presWords: paras(v('presWords'), 'margin: 0; font-size: 25px; line-height: 2; color: #1A2233'),
    orphanChips: orphanRows.slice(0, 6).map(([c, n]) => chip(`${c} · ${fmt(n)}`)).join(''),
    orphanPhoto,
    countryTiles,
    orphanCards,
    projectTabs,
    projectCards,
    contact,
  };
  const html = HOME_TEMPLATE.replace(/\{\{\{(\w+)\}\}\}/g, (_, k) => raw[k] ?? '').replace(/\{\{(\w+)\}\}/g, (_, k) => esc(text[k] ?? ''));
  return { html, orgName };
}

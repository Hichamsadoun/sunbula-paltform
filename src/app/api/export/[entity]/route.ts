import ExcelJS from 'exceljs';
import type { Prisma, ProjectStatus } from '@prisma/client';
import { db } from '@/lib/db';
import { getUser, isStaff, scope } from '@/lib/auth';
import { ORPHAN_STATUS, PAYMENT_STATUS, PROJECT_STATUS, fdate, toNum } from '@/lib/format';

type Sheet = { name: string; columns: { header: string; key: string; width?: number }[]; rows: Record<string, unknown>[] };

export async function GET(req: Request, { params }: { params: Promise<{ entity: string }> }) {
  const u = await getUser();
  if (!u) return new Response('Unauthorized', { status: 401 });
  const { entity } = await params;
  const sp = new URL(req.url).searchParams;
  const staff = isStaff(u);
  let sheet: Sheet | null = null;

  if (entity === 'projects') {
    const where: Prisma.ProjectWhereInput = { ...scope(u) };
    if (sp.get('year')) where.year = Number(sp.get('year'));
    if (sp.get('country')) where.country = sp.get('country')!;
    if (sp.get('sector')) where.sector = sp.get('sector')!;
    if (sp.get('status')) where.status = sp.get('status') as ProjectStatus;
    if (sp.get('association') && staff) where.associationId = sp.get('association')!;
    const q = sp.get('q');
    if (q) where.OR = [{ name: { contains: q, mode: 'insensitive' } }, { code: { contains: q, mode: 'insensitive' } }];
    const list = await db.project.findMany({ where, orderBy: [{ year: 'desc' }, { code: 'asc' }], include: { association: true } });
    sheet = {
      name: 'المشاريع',
      columns: [
        { header: 'الرمز', key: 'code', width: 12 }, { header: 'المشروع', key: 'name', width: 34 }, { header: 'الجمعية', key: 'assoc', width: 22 },
        { header: 'الدولة', key: 'country', width: 12 }, { header: 'القطاع', key: 'sector', width: 18 }, { header: 'السنة', key: 'year', width: 8 },
        { header: 'الحالة', key: 'status', width: 12 }, { header: 'المستفيدون', key: 'ben', width: 12 }, { header: 'التكلفة (ر.ق)', key: 'cost', width: 16 },
      ],
      rows: list.map((p) => ({ code: p.code, name: p.name, assoc: p.association.name, country: p.country, sector: p.sector, year: p.year, status: PROJECT_STATUS[p.status], ben: p.beneficiaries, cost: toNum(p.cost) })),
    };
  } else if (entity === 'associations' && staff) {
    const list = await db.association.findMany({ orderBy: { name: 'asc' }, include: { projects: { select: { cost: true, beneficiaries: true } } } });
    sheet = {
      name: 'الجمعيات',
      columns: [
        { header: 'الجمعية', key: 'name', width: 28 }, { header: 'التصنيف', key: 'cat', width: 16 }, { header: 'الدولة', key: 'country', width: 12 },
        { header: 'الهاتف', key: 'phone', width: 16 }, { header: 'البريد', key: 'email', width: 24 }, { header: 'المشاريع', key: 'n', width: 10 },
        { header: 'المستفيدون', key: 'ben', width: 12 }, { header: 'إجمالي القيمة (ر.ق)', key: 'total', width: 18 },
      ],
      rows: list.map((a) => ({ name: a.name, cat: a.category, country: a.country, phone: a.phone, email: a.email, n: a.projects.length, ben: a.projects.reduce((s, p) => s + (p.beneficiaries ?? 0), 0), total: a.projects.reduce((s, p) => s + toNum(p.cost), 0) })),
    };
  } else if (entity === 'donations' && staff) {
    const where: Prisma.DonationWhereInput = {};
    const y = sp.get('year');
    if (y && /^\d{4}$/.test(y)) where.date = { gte: new Date(`${y}-01-01`), lt: new Date(`${Number(y) + 1}-01-01`) };
    if (sp.get('association')) where.associationId = sp.get('association')!;
    if (sp.get('q')) where.donorName = { contains: sp.get('q')!, mode: 'insensitive' };
    const list = await db.donation.findMany({ where, orderBy: { date: 'desc' }, include: { project: true, association: true } });
    sheet = {
      name: 'التبرعات',
      columns: [
        { header: 'التاريخ', key: 'date', width: 12 }, { header: 'المتبرع', key: 'donor', width: 26 }, { header: 'المشروع', key: 'project', width: 30 },
        { header: 'الجمعية', key: 'assoc', width: 22 }, { header: 'الطريقة', key: 'method', width: 14 }, { header: 'المرجع', key: 'ref', width: 16 }, { header: 'رقم الشيك', key: 'chk', width: 14 }, { header: 'تاريخ الشيك', key: 'chkDate', width: 12 }, { header: 'البنك', key: 'bank', width: 16 },
        { header: 'المبلغ (ر.ق)', key: 'amount', width: 16 },
      ],
      rows: list.map((d) => ({ date: fdate(d.date), donor: d.donorName, project: d.project ? `${d.project.code} ${d.project.name}` : 'تبرع عام', assoc: d.association?.name, method: d.method, ref: d.reference, chk: d.checkNumber, chkDate: d.checkDate ? fdate(d.checkDate) : '', bank: d.bankName, amount: toNum(d.amount) })),
    };
  } else if (entity === 'payments') {
    const list = await db.payment.findMany({
      where: staff ? {} : { project: { associationId: u.associationId ?? '__none__' } },
      orderBy: { dueDate: 'asc' },
      include: { project: { include: { association: true } } },
    });
    sheet = {
      name: 'الدفعات',
      columns: [
        { header: 'الدفعة', key: 'title', width: 24 }, { header: 'المشروع', key: 'project', width: 30 }, { header: 'الجمعية', key: 'assoc', width: 22 },
        { header: 'الاستحقاق', key: 'due', width: 12 }, { header: 'الصرف', key: 'paid', width: 12 }, { header: 'الحالة', key: 'status', width: 10 },
        { header: 'رقم الشيك', key: 'chk', width: 14 }, { header: 'تاريخ الشيك', key: 'chkDate', width: 12 }, { header: 'البنك', key: 'bank', width: 16 },
        { header: 'المبلغ (ر.ق)', key: 'amount', width: 16 },
      ],
      rows: list.map((p) => ({ title: p.title, project: `${p.project.code} ${p.project.name}`, assoc: p.project.association.name, due: fdate(p.dueDate), paid: p.paidDate ? fdate(p.paidDate) : '', status: PAYMENT_STATUS[p.status], chk: p.checkNumber, chkDate: p.checkDate ? fdate(p.checkDate) : '', bank: p.bankName, amount: toNum(p.amount) })),
    };
  } else if (entity === 'orphans') {
    const list = await db.orphan.findMany({ where: scope(u), orderBy: { code: 'asc' }, include: { association: true, sponsor: true } });
    sheet = {
      name: 'الأيتام',
      columns: [
        { header: 'الرمز', key: 'code', width: 12 }, { header: 'الاسم', key: 'name', width: 24 }, { header: 'الجنس', key: 'gender', width: 8 },
        { header: 'تاريخ الميلاد', key: 'birth', width: 12 }, { header: 'الدولة', key: 'country', width: 12 }, { header: 'الجمعية', key: 'assoc', width: 22 },
        { header: 'الكافل', key: 'sponsor', width: 22 }, { header: 'الحالة', key: 'status', width: 14 }, { header: 'الكفالة الشهرية (ر.ق)', key: 'amount', width: 18 },
      ],
      rows: list.map((o) => ({ code: o.code, name: o.name, gender: o.gender, birth: o.birthDate ? fdate(o.birthDate) : '', country: o.country, assoc: o.association.name, sponsor: o.sponsor?.name, status: ORPHAN_STATUS[o.status], amount: toNum(o.monthlyAmount) })),
    };
  }

  if (!sheet) return new Response('Not found', { status: 404 });

  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(sheet.name, { views: [{ rightToLeft: true, state: 'frozen', ySplit: 1 }] });
  ws.columns = sheet.columns;
  ws.addRows(sheet.rows);
  const head = ws.getRow(1);
  head.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  head.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F3A68' } };
  ws.columns.forEach((c) => { if (c.key && ['cost', 'amount', 'total'].includes(c.key)) c.numFmt = '#,##0'; });
  const buf = await wb.xlsx.writeBuffer();
  const file = `sunbula-${entity}-${new Date().toISOString().slice(0, 10)}.xlsx`;
  return new Response(buf as ArrayBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${file}"`,
    },
  });
}

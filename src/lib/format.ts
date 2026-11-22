import type { Prisma } from '@prisma/client';

type Num = number | string | Prisma.Decimal | null | undefined;

export const toNum = (v: Num) => (v == null ? 0 : Number(v.toString()));

export const fmt = (v: Num) => Math.round(toNum(v)).toLocaleString('en-US');

export const qar = (v: Num) => `${fmt(v)} ر.ق`;

export const fdate = (d: Date | null | undefined) =>
  d ? d.toISOString().slice(0, 10) : '—';

export const inputDate = (d: Date | null | undefined) => (d ? d.toISOString().slice(0, 10) : '');

export const PROJECT_STATUS: Record<string, string> = {
  PLANNED: 'مستهدف (لم يُفتح)',
  IN_PROGRESS: 'قيد التنفيذ',
  DONE: 'منجز',
  LATE: 'متأخر',
};

export const PAYMENT_STATUS: Record<string, string> = { DUE: 'مستحقة', PAID: 'مدفوعة' };

export const ORPHAN_STATUS: Record<string, string> = {
  WAITING: 'بانتظار كافل',
  SPONSORED: 'مكفول',
  ENDED: 'منتهية',
};

export const ROLES: Record<string, string> = {
  ADMIN: 'مدير النظام',
  STAFF: 'موظف',
  ASSOCIATION: 'حساب جمعية',
};

export const SECTORS = ['التمكين الاقتصادي', 'المياه', 'التعليم', 'الصحة', 'الإغاثة', 'كفالة الأيتام', 'أخرى'];
export const COUNTRIES = ['سوريا', 'اليمن', 'فلسطين', 'السودان', 'تركيا', 'إثيوبيا', 'الصومال', 'لبنان', 'أخرى'];
export const CATEGORIES = ['تنموية', 'خيرية', 'إغاثية وإنسانية', 'تعليمية', 'صحية'];
export const METHODS = ['تحويل بنكي', 'نقداً', 'شيك', 'بطاقة', 'أخرى'];

export const statusTone = (s: string) =>
  ({ DONE: 'ok', PAID: 'ok', SPONSORED: 'ok', LATE: 'bad', DUE: 'warn', WAITING: 'warn', IN_PROGRESS: 'info', PLANNED: 'mute', ENDED: 'mute' } as Record<string, string>)[s] ?? 'mute';

/** Groups rows by a key and sums a value, largest first. */
export function groupSum<T>(rows: T[], key: (r: T) => string, val: (r: T) => number) {
  const m = new Map<string, number>();
  for (const r of rows) m.set(key(r), (m.get(key(r)) ?? 0) + val(r));
  return [...m.entries()].map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value);
}

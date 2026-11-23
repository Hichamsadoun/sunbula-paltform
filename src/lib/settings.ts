import { db } from './db';

export const SETTING_KEYS = {
  orgName: 'orgName',
  target: (year: number) => `target:${year}`,
};

export async function getSettings(): Promise<Record<string, string>> {
  const rows = await db.setting.findMany();
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function setSetting(key: string, value: string) {
  await db.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
}

/** URL of the uploaded organisation logo, or null to use the built-in mark. */
export async function getSiteLogo(): Promise<string | null> {
  const r = await db.setting.findUnique({ where: { key: 'home:logo' } });
  return r?.value || null;
}

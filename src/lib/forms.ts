import 'server-only';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from './db';
import { putFile } from './storage';
import type { SessionUser } from './auth';

export const str = (f: FormData, k: string) => {
  const v = f.get(k);
  const s = typeof v === 'string' ? v.trim() : '';
  return s;
};
export const opt = (f: FormData, k: string) => str(f, k) || null;
export const num = (f: FormData, k: string) => {
  const s = str(f, k).replace(/,/g, '');
  const n = Number(s);
  if (!s || Number.isNaN(n)) return null;
  return n;
};
export const date = (f: FormData, k: string) => {
  const s = str(f, k);
  return s ? new Date(s + 'T00:00:00Z') : null;
};
export const bool = (f: FormData, k: string) => f.get(k) === 'on' || f.get(k) === 'true';

const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

/** Saves uploaded images and returns their URLs (served by /uploads/[name]). */
export async function saveImages(files: FormDataEntryValue[]): Promise<string[]> {
  const urls: string[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const ext = path.extname(f.name).toLowerCase();
    if (!ALLOWED.has(ext) || !f.type.startsWith('image/')) continue;
    const name = `${randomUUID()}${ext}`;
    await putFile(name, await f.arrayBuffer(), f.type);
    urls.push(`/uploads/${name}`);
  }
  return urls;
}

export async function audit(u: SessionUser, action: string, entity: string, entityId?: string, summary?: string) {
  await db.auditLog.create({ data: { userId: u.id, action, entity, entityId, summary } });
}

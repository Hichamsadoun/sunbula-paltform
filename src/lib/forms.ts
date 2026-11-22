import 'server-only';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import { db } from './db';
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

export const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

const ALLOWED = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg']);

/** Saves uploaded images under public/uploads and returns their public URLs. */
export async function saveImages(files: FormDataEntryValue[]): Promise<string[]> {
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  const urls: string[] = [];
  for (const f of files) {
    if (!(f instanceof File) || f.size === 0) continue;
    const ext = path.extname(f.name).toLowerCase();
    if (!ALLOWED.has(ext) || !f.type.startsWith('image/')) continue;
    const name = `${randomUUID()}${ext}`;
    await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()));
    urls.push(`/uploads/${name}`);
  }
  return urls;
}

export async function audit(u: SessionUser, action: string, entity: string, entityId?: string, summary?: string) {
  await db.auditLog.create({ data: { userId: u.id, action, entity, entityId, summary } });
}

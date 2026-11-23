import path from 'path';
import { getUser } from '@/lib/auth';
import { db } from '@/lib/db';
import { getFile } from '@/lib/storage';

const TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

/** Images of the public site and of published reports are public; everything else needs a signed-in user. */
async function isPublic(url: string) {
  const [setting, image, logo] = await Promise.all([
    db.setting.findFirst({ where: { key: { startsWith: 'home:' }, value: url } }),
    db.reportImage.findFirst({ where: { url, report: { published: true } } }),
    db.association.findFirst({ where: { logoUrl: url }, select: { id: true } }),
  ]);
  return !!(setting || image || logo);
}

export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.[a-z]+$/.test(name)) return new Response('Not found', { status: 404 });
  const pub = await isPublic(`/uploads/${name}`);
  if (!pub && !(await getUser())) return new Response('Unauthorized', { status: 401 });
  const type = TYPES[path.extname(name)];
  if (!type) return new Response('Not found', { status: 404 });
  const buf = await getFile(name);
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(buf as BodyInit, {
      headers: { 'Content-Type': type, 'Cache-Control': pub ? 'public, max-age=86400' : 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff', ...(type === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}) },
  });
}

import path from 'path';
import { getUser } from '@/lib/auth';
import { getFile } from '@/lib/storage';

const TYPES: Record<string, string> = {
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.gif': 'image/gif', '.svg': 'image/svg+xml',
};

/** Serves uploaded images to signed-in users only (orphan and report photos are private). */
export async function GET(_req: Request, { params }: { params: Promise<{ name: string }> }) {
  if (!(await getUser())) return new Response('Unauthorized', { status: 401 });
  const { name } = await params;
  if (!/^[0-9a-f-]{36}\.[a-z]+$/.test(name)) return new Response('Not found', { status: 404 });
  const type = TYPES[path.extname(name)];
  if (!type) return new Response('Not found', { status: 404 });
  const buf = await getFile(name);
  if (!buf) return new Response('Not found', { status: 404 });
  return new Response(buf as BodyInit, {
      headers: { 'Content-Type': type, 'Cache-Control': 'private, max-age=86400', 'X-Content-Type-Options': 'nosniff', ...(type === 'image/svg+xml' ? { 'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'" } : {}) },
  });
}

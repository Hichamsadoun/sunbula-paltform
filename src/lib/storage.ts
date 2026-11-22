import 'server-only';
import { readFile, writeFile, mkdir } from 'fs/promises';
import path from 'path';

/**
 * File storage for uploaded images.
 * On Netlify (serverless, no persistent disk) files go to Netlify Blobs; elsewhere to UPLOAD_DIR on disk.
 */
const onNetlify = () => !!(process.env.NETLIFY || process.env.NETLIFY_BLOBS_CONTEXT);

export const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

async function store() {
  const { getStore } = await import('@netlify/blobs');
  return getStore({ name: 'uploads', consistency: 'strong' });
}

export async function putFile(name: string, data: ArrayBuffer, contentType: string) {
  if (onNetlify()) {
    await (await store()).set(name, data, { metadata: { contentType } });
    return;
  }
  const dir = uploadDir();
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, name), Buffer.from(data));
}

export async function getFile(name: string): Promise<Uint8Array | null> {
  if (onNetlify()) {
    const buf = await (await store()).get(name, { type: 'arrayBuffer' });
    return buf ? new Uint8Array(buf) : null;
  }
  try {
    return new Uint8Array(await readFile(path.join(uploadDir(), name)));
  } catch {
    return null;
  }
}

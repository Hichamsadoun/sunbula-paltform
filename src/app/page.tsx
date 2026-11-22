import type { Metadata } from 'next';
import { renderHome } from '@/lib/home';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'السنبلة للتنمية' };

/** Public home page: the original design, filled from the system's data and the «الصفحة الرئيسية» settings. */
export default async function Home({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const { html } = await renderHome(tab ?? 'all');
  return <div className="home" dangerouslySetInnerHTML={{ __html: html }} />;
}

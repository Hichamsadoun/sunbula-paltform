'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandLogo } from './Logo';

type Item = { href: string; label: string };
type Section = { title?: string; items: Item[] };

export function Sidebar({
  sections,
  user,
  roleLabel,
  logout,
  logo,
}: {
  sections: Section[];
  user: { name: string };
  roleLabel: string;
  logout: () => Promise<void>;
  logo?: string | null;
}) {
  const path = usePathname();
  const on = (href: string) => (href === '/dashboard' ? path === href : path === href || path.startsWith(href + '/'));
  return (
    <aside className="side">
      <Link href="/dashboard" className="brand">
        <div className={`brand-mark${logo ? ' has-img' : ''}`}><BrandLogo src={logo} /></div>
        <span className="brand-name kufi">السنبلة</span>
      </Link>
      <nav className="nav">
        {sections.map((s, i) => (
          <div key={i} style={{ display: 'contents' }}>
            {s.title && <div className="nav-sec">{s.title}</div>}
            {s.items.map((it) => (
              <Link key={it.href} href={it.href} className={on(it.href) ? 'on' : ''}>
                {it.label}
              </Link>
            ))}
          </div>
        ))}
      </nav>
      <div className="me">
        <div className="avatar">{user.name.trim().charAt(0) || 'م'}</div>
        <div>
          <span style={{ fontWeight: 600 }}>{user.name}</span>
          <small>{roleLabel}</small>
          <form action={logout}>
            <button type="submit">تسجيل الخروج</button>
          </form>
        </div>
      </div>
    </aside>
  );
}

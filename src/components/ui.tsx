import Link from 'next/link';
import { statusTone } from '@/lib/format';

export function Badge({ status, label }: { status: string; label: string }) {
  return <span className={`badge ${statusTone(status)}`}>{label}</span>;
}

export function PageHead({
  title,
  sub,
  crumbs,
  children,
}: {
  title: string;
  sub?: string;
  crumbs?: { href: string; label: string }[];
  children?: React.ReactNode;
}) {
  return (
    <div className="head">
      <div>
        {crumbs && (
          <div className="crumbs">
            {crumbs.map((c, i) => (
              <span key={c.href}>
                <Link href={c.href}>{c.label}</Link>
                {i < crumbs.length - 1 ? ' / ' : ''}
              </span>
            ))}
          </div>
        )}
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      {children && <div className="actions no-print">{children}</div>}
    </div>
  );
}

export function Stat({ label, value, accent, note }: { label: string; value: React.ReactNode; accent?: boolean; note?: string }) {
  return (
    <div className="card stat">
      <span>{label}</span>
      <b className={accent ? 'accent' : ''}>{value}</b>
      {note && <small>{note}</small>}
    </div>
  );
}

export function Field({
  label,
  name,
  children,
  full,
  hint,
}: {
  label: string;
  name?: string;
  children: React.ReactNode;
  full?: boolean;
  hint?: string;
}) {
  return (
    <div className={`field${full ? ' full' : ''}`}>
      <label htmlFor={name}>{label}</label>
      {children}
      {hint && <small>{hint}</small>}
    </div>
  );
}

export function Bars({ rows, unit = '' }: { rows: { label: string; value: number; display?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  if (!rows.length) return <div className="empty">لا توجد بيانات</div>;
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar-row" key={r.label}>
          <span>{r.label}</span>
          <div className="track">
            <div style={{ width: `${(r.value / max) * 100}%` }} />
          </div>
          <span className="val">{r.display ?? `${Math.round(r.value).toLocaleString('en-US')}${unit}`}</span>
        </div>
      ))}
    </div>
  );
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}

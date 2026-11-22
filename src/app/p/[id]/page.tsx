import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { Logo } from '@/components/Logo';
import { Badge } from '@/components/ui';
import { PROJECT_STATUS, fdate, fmt, qar } from '@/lib/format';

export const dynamic = 'force-dynamic';

/** Public project page linked from the home page. Shows only published reports. */
export default async function PublicProject({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await db.project.findUnique({
    where: { id },
    include: {
      association: { select: { name: true } },
      phases: { orderBy: { sort: 'asc' } },
      reports: { where: { published: true }, orderBy: { createdAt: 'desc' }, include: { images: true } },
    },
  });
  if (!p || p.status === 'PLANNED') notFound();
  const progress = p.phases.length ? Math.round((p.phases.filter((x) => x.done).length / p.phases.length) * 100) : p.status === 'DONE' ? 100 : 0;
  return (
    <>
      <header className="pub-nav">
        <div className="in">
          <Link href="/" className="brand">
            <div className="brand-mark"><Logo /></div>
            <span className="brand-name kufi" style={{ color: 'var(--navy)' }}>السنبلة</span>
          </Link>
          <Link className="btn ghost" href="/#projects">← كل المشاريع</Link>
        </div>
      </header>
      <div className="wrap">
        <div>
          <span className="badge mute">{p.sector}</span>
          <h1 style={{ fontSize: 36, marginTop: 10 }}>{p.name}</h1>
          <p style={{ color: 'var(--muted)', margin: '6px 0 0' }}>{p.association.name} · {p.country} · {p.year}</p>
        </div>
        <div className="grid g4">
          <div className="card stat"><span>الحالة</span><b><Badge status={p.status} label={PROJECT_STATUS[p.status]} /></b></div>
          <div className="card stat"><span>نسبة الإنجاز</span><b className="accent">{progress}%</b></div>
          <div className="card stat"><span>المستفيدون</span><b>{p.beneficiaries == null ? '—' : fmt(p.beneficiaries)}</b></div>
          <div className="card stat"><span>قيمة المشروع</span><b>{qar(p.cost)}</b></div>
        </div>
        {(p.description || p.goals) && (
          <div className="grid g2">
            {p.description && <div className="card"><h2>نبذة عن المشروع</h2><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.description}</p></div>}
            {p.goals && <div className="card"><h2>الأهداف</h2><p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{p.goals}</p></div>}
          </div>
        )}
        {p.phases.length > 0 && (
          <div className="card">
            <h2>مراحل التنفيذ</h2>
            <div className="progress" style={{ marginBottom: 16 }}><div style={{ width: `${progress}%` }} /></div>
            <ul className="phases">
              {p.phases.map((ph) => (
                <li key={ph.id} className={ph.done ? 'done' : ''}><span className="t">{ph.title}</span><Badge status={ph.done ? 'DONE' : 'PLANNED'} label={ph.done ? 'منجزة' : 'قادمة'} /></li>
              ))}
            </ul>
          </div>
        )}
        {p.reports.map((r) => (
          <div className="card" key={r.id}>
            <h2>{r.title} <small style={{ color: 'var(--muted)', fontWeight: 400, fontSize: 14 }}>· {fdate(r.createdAt)}</small></h2>
            {r.summary && <p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{r.summary}</p>}
            {r.results && <><h3 style={{ fontSize: 16, margin: '12px 0 6px' }}>النتائج والأثر</h3><p style={{ whiteSpace: 'pre-wrap', marginTop: 0 }}>{r.results}</p></>}
            {r.images.length > 0 && (
              <div className="gallery">{r.images.map((img) => <figure key={img.id}><img src={img.url} alt="" /></figure>)}</div>
            )}
          </div>
        ))}
        {p.reports.length === 0 && <div className="card" style={{ color: 'var(--muted)' }}>لم يُنشر تقرير لهذا المشروع بعد.</div>}
      </div>
    </>
  );
}

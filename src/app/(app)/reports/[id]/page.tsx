import Link from 'next/link';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { requireUser, scope } from '@/lib/auth';
import { PageHead, Stat, Badge } from '@/components/ui';
import { ConfirmButton, PrintButton } from '@/components/ConfirmButton';
import { PROJECT_STATUS, fdate, fmt, qar, toNum } from '@/lib/format';
import { deleteImage, deleteReport } from '../actions';

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const u = await requireUser();
  const { id } = await params;
  const r = await db.report.findFirst({
    where: { id, project: scope(u) },
    include: {
      images: true,
      project: { include: { association: true, phases: { orderBy: { sort: 'asc' } }, payments: true } },
    },
  });
  if (!r) notFound();
  const p = r.project;
  const paid = p.payments.filter((x) => x.status === 'PAID').reduce((s, x) => s + toNum(x.amount), 0);
  const Section = ({ title, text }: { title: string; text: string | null }) =>
    text ? (
      <div className="card"><h2>{title}</h2><p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{text}</p></div>
    ) : null;
  return (
    <>
      <PageHead title={r.title} sub={`${p.code} · ${p.name} · ${p.association.name} · ${fdate(r.createdAt)}`} crumbs={[{ href: '/reports', label: 'التقارير' }]}>
        <PrintButton />
        <Link className="btn" href={`/reports/${r.id}/edit`}>تعديل</Link>
      </PageHead>
      <div className="grid g4">
        <Stat label="تكلفة المشروع" value={qar(p.cost)} />
        <Stat label="المصروف" value={qar(paid)} />
        <Stat label="المستفيدون" value={p.beneficiaries == null ? '—' : fmt(p.beneficiaries)} accent />
        <Stat label="حالة المشروع" value={<Badge status={p.status} label={PROJECT_STATUS[p.status]} />} />
      </div>
      <Section title="ملخص التنفيذ" text={r.summary} />
      <Section title="النتائج والأثر" text={r.results} />
      {p.phases.length > 0 && (
        <div className="card">
          <h2>مراحل التنفيذ</h2>
          <ul className="phases">
            {p.phases.map((ph) => (
              <li key={ph.id} className={ph.done ? 'done' : ''}>
                <span className="t">{ph.title}</span>
                <Badge status={ph.done ? 'DONE' : 'PLANNED'} label={ph.done ? 'منجزة' : 'قادمة'} />
              </li>
            ))}
          </ul>
        </div>
      )}
      <div className="card">
        <h2>صور المشروع</h2>
        {r.images.length === 0 ? <p style={{ color: 'var(--muted)', margin: 0 }}>لا توجد صور. أضفها من «تعديل».</p> : (
          <div className="gallery">
            {r.images.map((img) => (
              <figure key={img.id}>
                <a href={img.url} target="_blank"><img src={img.url} alt={img.caption ?? ''} /></a>
                <form action={deleteImage.bind(null, img.id)} className="no-print" style={{ position: 'absolute', top: 6, left: 6 }}>
                  <ConfirmButton message="حذف الصورة؟">×</ConfirmButton>
                </form>
              </figure>
            ))}
          </div>
        )}
      </div>
      <Section title="ملاحظات" text={r.notes} />
      <p style={{ color: 'var(--muted)', fontSize: 13 }}>أعدّه: {r.createdBy ?? '—'} · {r.published ? 'معتمد' : 'مسودة'}</p>
      <form action={deleteReport.bind(null, r.id)} className="no-print">
        <ConfirmButton>حذف التقرير</ConfirmButton>
      </form>
    </>
  );
}

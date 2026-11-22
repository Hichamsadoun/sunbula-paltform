'use client';

export function ConfirmButton({
  children,
  message = 'هل أنت متأكد من الحذف؟ لا يمكن التراجع.',
  className = 'btn danger sm',
}: {
  children: React.ReactNode;
  message?: string;
  className?: string;
}) {
  return (
    <button
      type="submit"
      className={className}
      onClick={(e) => {
        if (!confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

export function PrintButton() {
  return (
    <button type="button" className="btn ghost" onClick={() => window.print()}>
      تصدير PDF / طباعة
    </button>
  );
}

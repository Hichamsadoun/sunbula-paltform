export function Logo({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" aria-hidden="true">
      <path d="M50 95 C50 72 50 46 51 14" fill="none" stroke="#FFFFFF" strokeWidth="5" strokeLinecap="round" />
      {[74, 60, 46, 32].map((y) => (
        <g key={y}>
          <ellipse cx="41" cy={y} rx="7" ry="11" transform={`rotate(-35 41 ${y})`} fill="#FFFFFF" />
          <ellipse cx="60" cy={y - 5} rx="7" ry="11" transform={`rotate(35 60 ${y - 5})`} fill="#B8C2D0" />
        </g>
      ))}
      <ellipse cx="51" cy="17" rx="6" ry="10" fill="#FFFFFF" />
    </svg>
  );
}

/** The organisation's mark: the uploaded logo (Site settings) when there is one, otherwise the wheat icon. */
export function BrandLogo({ src, size = 30 }: { src?: string | null; size?: number }) {
  return src ? <img className="brand-img" src={src} alt="" /> : <Logo size={size} />;
}

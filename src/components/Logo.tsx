export default function Logo({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      {/* Minimal world-grid seal */}
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.1" />
      <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <ellipse cx="12" cy="12" rx="4.2" ry="10" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <line x1="2" y1="12" x2="22" y2="12" stroke="currentColor" strokeWidth="0.7" opacity="0.7" />
      <circle cx="17.2" cy="7.4" r="1.6" fill="var(--primary)" stroke="none" />
    </svg>
  );
}

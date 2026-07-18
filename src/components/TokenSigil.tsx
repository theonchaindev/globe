/**
 * Deterministic geometric mark per mission — a minimal "agency seal"
 * generated from the token's hue and ticker. No cartoon logos.
 */
export default function TokenSigil({
  ticker,
  hue,
  size = 40,
}: {
  ticker: string;
  hue: number;
  size?: number;
}) {
  const c = `hsl(${(hue % 50) + 25} 14% 66%)`; // desaturated bone — hue only whispers
  const rot = (hue % 90) - 45;
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden className="shrink-0">
      <rect x="1" y="1" width="38" height="38" rx="9" fill="var(--panel-2)" stroke="var(--border)" />
      <g transform={`rotate(${rot} 20 20)`}>
        <circle cx="20" cy="20" r="11" fill="none" stroke={c} strokeWidth="1.1" opacity="0.8" />
        <circle cx="20" cy="20" r="5.5" fill="none" stroke={c} strokeWidth="1" opacity="0.5" />
        <line x1="20" y1="6" x2="20" y2="34" stroke={c} strokeWidth="0.7" opacity="0.4" />
        <circle cx="20" cy="9" r="1.6" fill={c} />
      </g>
      <text
        x="20"
        y="23.5"
        textAnchor="middle"
        fontSize="8.5"
        fontWeight="700"
        fill="white"
        fontFamily="var(--font-geist-mono)"
        letterSpacing="0.5"
      >
        {ticker.slice(0, 2)}
      </text>
    </svg>
  );
}

/**
 * Fixed full-page backdrop: latitude/longitude grid, faint great-circle
 * flight paths, coordinate labels and radar rings. Everything stays under
 * ~5% opacity so it reads as texture, never decoration.
 */
export default function Background() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {/* vertical vignette so panels sit on pure depth */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(1200px 800px at 70% -10%, rgba(77,227,255,0.045), transparent 60%), radial-gradient(900px 600px at 10% 110%, rgba(168,255,53,0.03), transparent 60%)",
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1440 900"
      >
        {/* fine grid */}
        <defs>
          <pattern id="grid" width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="1440" height="900" fill="url(#grid)" />

        {/* latitude lines */}
        {[150, 300, 450, 600, 750].map((y) => (
          <line key={y} x1="0" y1={y} x2="1440" y2={y} stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        ))}
        {/* longitude lines */}
        {[180, 420, 720, 1020, 1260].map((x) => (
          <line key={x} x1={x} y1="0" x2={x} y2="900" stroke="rgba(255,255,255,0.035)" strokeWidth="1" />
        ))}

        {/* great-circle flight paths */}
        <path d="M -50 700 Q 400 340 900 520 T 1500 300" fill="none" stroke="rgba(77,227,255,0.05)" strokeWidth="1" />
        <path d="M -50 250 Q 500 520 1000 300 T 1500 480" fill="none" stroke="rgba(168,255,53,0.045)" strokeWidth="1" />
        <path d="M 200 -50 Q 600 400 1100 250 T 1500 700" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

        {/* radar rings, top-right */}
        {[90, 180, 270].map((r) => (
          <circle key={r} cx="1240" cy="140" r={r} fill="none" stroke="rgba(255,255,255,0.028)" strokeWidth="1" />
        ))}
        {/* topographic contours, bottom-left */}
        {[60, 110, 165, 225].map((r) => (
          <circle key={r} cx="140" cy="820" r={r} fill="none" stroke="rgba(255,255,255,0.025)" strokeWidth="1" />
        ))}

        {/* coordinate labels */}
        {[
          { x: 186, y: 144, t: "51.5074° N  0.1278° W" },
          { x: 1026, y: 456, t: "35.6762° N  139.6503° E" },
          { x: 430, y: 756, t: "40.7128° N  74.0060° W" },
        ].map((c) => (
          <text
            key={c.t}
            x={c.x}
            y={c.y}
            fill="rgba(255,255,255,0.05)"
            fontSize="9"
            fontFamily="var(--font-geist-mono)"
            letterSpacing="1.5"
          >
            {c.t}
          </text>
        ))}
      </svg>
    </div>
  );
}

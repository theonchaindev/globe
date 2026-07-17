"use client";

/** Equirectangular projection into a 360x180 viewBox. */
function pt(lat: number, lon: number): [number, number] {
  return [lon + 180, 90 - lat];
}

/** GLOBAL relay stations — ambient network infrastructure on the map. */
const RELAYS: Array<{ id: string; lat: number; lon: number; label: string; hot: boolean }> = [
  { id: "LDN-04", lat: 51.5, lon: -0.12, label: "LONDON", hot: true },
  { id: "NYC-01", lat: 40.71, lon: -74.0, label: "NEW YORK", hot: true },
  { id: "TYO-02", lat: 35.68, lon: 139.69, label: "TOKYO", hot: false },
  { id: "SIN-03", lat: 1.35, lon: 103.82, label: "SINGAPORE", hot: true },
  { id: "DXB-05", lat: 25.2, lon: 55.27, label: "DUBAI", hot: false },
  { id: "ZRH-06", lat: 47.37, lon: 8.54, label: "ZURICH", hot: false },
  { id: "HKG-07", lat: 22.28, lon: 114.16, label: "HONG KONG", hot: true },
  { id: "SYD-08", lat: -33.86, lon: 151.2, label: "SYDNEY", hot: false },
  { id: "BER-09", lat: 52.52, lon: 13.4, label: "BERLIN", hot: false },
  { id: "SFO-10", lat: 37.77, lon: -122.42, label: "SAN FRANCISCO", hot: true },
  { id: "GRU-11", lat: -23.55, lon: -46.63, label: "SAO PAULO", hot: false },
  { id: "BOM-12", lat: 19.08, lon: 72.88, label: "MUMBAI", hot: false },
];

/** Crude low-poly continent silhouettes — recognisable at 6% opacity. */
const CONTINENTS: string[] = [
  // North America
  "M 25 30 L 60 22 L 95 26 L 110 40 L 100 52 L 88 60 L 80 74 L 68 66 L 52 60 L 40 48 L 28 42 Z",
  // South America
  "M 88 96 L 102 92 L 112 104 L 110 122 L 100 142 L 92 134 L 86 114 Z",
  // Europe
  "M 168 30 L 190 24 L 202 32 L 196 44 L 182 48 L 170 42 Z",
  // Africa
  "M 168 58 L 192 54 L 206 66 L 202 86 L 190 106 L 180 96 L 172 76 Z",
  // Asia
  "M 204 24 L 250 18 L 290 26 L 302 42 L 288 54 L 268 62 L 248 56 L 228 50 L 210 42 Z",
  // SE Asia / India
  "M 244 62 L 258 60 L 264 74 L 254 84 L 246 74 Z",
  // Australia
  "M 292 112 L 314 108 L 322 120 L 310 130 L 296 126 Z",
];

const ARCS: Array<[number, number]> = [
  [0, 2], [1, 4], [2, 3], [3, 6], [4, 5], [5, 0], [6, 1], [0, 9], [9, 4], [2, 5],
];

export default function WorldMap({ compact = false }: { compact?: boolean }) {
  const nodes = RELAYS.map((r) => ({
    ...r,
    xy: pt(r.lat, r.lon),
  }));

  return (
    <svg viewBox="0 0 360 180" className="h-auto w-full" aria-label="Global mission map">
      {/* graticule */}
      {Array.from({ length: 5 }, (_, i) => (i + 1) * 30).map((y) => (
        <line key={`lat${y}`} x1="0" y1={y} x2="360" y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
      ))}
      {Array.from({ length: 11 }, (_, i) => (i + 1) * 30).map((x) => (
        <line key={`lon${x}`} x1={x} y1="0" x2={x} y2="180" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" />
      ))}

      {/* continents */}
      {CONTINENTS.map((d, i) => (
        <path key={i} d={d} fill="rgba(255,255,255,0.055)" stroke="rgba(255,255,255,0.1)" strokeWidth="0.4" />
      ))}

      {/* connection arcs */}
      {ARCS.map(([a, b], i) => {
        const A = nodes[a % nodes.length].xy;
        const B = nodes[b % nodes.length].xy;
        const mx = (A[0] + B[0]) / 2;
        const my = Math.min(A[1], B[1]) - 18;
        return (
          <path
            key={i}
            d={`M ${A[0]} ${A[1]} Q ${mx} ${my} ${B[0]} ${B[1]}`}
            fill="none"
            stroke={i % 2 ? "rgba(77,227,255,0.28)" : "rgba(168,255,53,0.24)"}
            strokeWidth="0.5"
            className="dash-flow"
            style={{ animationDelay: `${i * 0.35}s`, animationDuration: `${2 + (i % 3)}s` }}
          />
        );
      })}

      {/* mission nodes */}
      {nodes.map((n, i) => (
        <g key={n.id}>
          <circle cx={n.xy[0]} cy={n.xy[1]} r="1.4" fill={n.hot ? "var(--primary)" : "var(--accent)"} />
          <circle cx={n.xy[0]} cy={n.xy[1]} r="3.6" fill="none" stroke={n.hot ? "rgba(168,255,53,0.3)" : "rgba(77,227,255,0.25)"} strokeWidth="0.4">
            <animate attributeName="r" values="1.5;5.5" dur={`${2.2 + (i % 4) * 0.5}s`} repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.9;0" dur={`${2.2 + (i % 4) * 0.5}s`} repeatCount="indefinite" />
          </circle>
          {!compact && (
            <text x={n.xy[0] + 4} y={n.xy[1] + 1.5} fontSize="4" fill="rgba(255,255,255,0.4)" fontFamily="var(--font-geist-mono)" letterSpacing="0.5">
              {n.label}
            </text>
          )}
        </g>
      ))}

      {/* radar sweep */}
      <g className="radar-sweep" style={{ transformBox: "view-box" }}>
        <line x1="180" y1="90" x2="360" y2="90" stroke="url(#sweepGrad)" strokeWidth="0.6" />
      </g>
      <defs>
        <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="rgba(168,255,53,0)" />
          <stop offset="1" stopColor="rgba(168,255,53,0.22)" />
        </linearGradient>
      </defs>
    </svg>
  );
}

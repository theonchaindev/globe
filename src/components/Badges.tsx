import type { Chain, MissionStatus, Risk } from "@/lib/types";

export function ChainBadge({ chain, className = "" }: { chain: Chain; className?: string }) {
  const isSol = chain === "SOLANA";
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded border border-line px-1.5 py-0.5 text-[9px] tracking-[0.16em] ${className}`}
      style={{ color: isSol ? "var(--accent)" : "var(--warning)" }}
    >
      <span
        className="h-1 w-1 rounded-full"
        style={{ background: "currentColor" }}
      />
      {chain}
    </span>
  );
}

const STATUS_COLOR: Record<MissionStatus, string> = {
  ACTIVE: "var(--primary)",
  COMPLETE: "var(--accent)",
  CLASSIFIED: "var(--warning)",
  FAILED: "var(--danger)",
};

export function StatusBadge({ status }: { status: MissionStatus }) {
  return (
    <span
      className="mono inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[9px] tracking-[0.16em]"
      style={{
        color: STATUS_COLOR[status],
        background: `color-mix(in srgb, ${STATUS_COLOR[status]} 8%, transparent)`,
        border: `1px solid color-mix(in srgb, ${STATUS_COLOR[status]} 25%, transparent)`,
      }}
    >
      {status === "ACTIVE" && (
        <span className="pulse-dot h-1 w-1 rounded-full" style={{ background: "currentColor" }} />
      )}
      {status}
    </span>
  );
}

const RISK_COLOR: Record<Risk, string> = {
  LOW: "var(--primary)",
  MODERATE: "var(--warning)",
  ELEVATED: "#ff9d4d",
  SEVERE: "var(--danger)",
};

export function RiskBadge({ risk }: { risk: Risk }) {
  return (
    <span className="mono inline-flex items-center gap-1.5 text-[9px] tracking-[0.14em]" style={{ color: RISK_COLOR[risk] }}>
      <span className="flex gap-[2px]">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className="h-2 w-[3px] rounded-[1px]"
            style={{
              background:
                i <= ["LOW", "MODERATE", "ELEVATED", "SEVERE"].indexOf(risk)
                  ? RISK_COLOR[risk]
                  : "rgba(255,255,255,0.1)",
            }}
          />
        ))}
      </span>
      {risk}
    </span>
  );
}

export function ClearanceBadge({ level }: { level: string }) {
  return <span className="stamp text-faint">{level}</span>;
}

export function VerifiedBadge() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" className="inline-block shrink-0" aria-label="Verified">
      <path
        d="M12 2l2.4 2.1 3.1-.4 1 3 2.9 1.2-.7 3.1 2 2.4-2 2.4.7 3.1-2.9 1.2-1 3-3.1-.4L12 25l-2.4-2.3-3.1.4-1-3-2.9-1.2.7-3.1-2-2.4 2-2.4-.7-3.1 2.9-1.2 1-3 3.1.4L12 2z"
        fill="rgba(168,255,53,0.14)"
        transform="scale(0.9) translate(1.3 0)"
      />
      <path d="M8.5 12.2l2.4 2.4 4.6-5" stroke="var(--primary)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

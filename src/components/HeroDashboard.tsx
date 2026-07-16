"use client";

import { motion } from "framer-motion";
import WorldMap from "./WorldMap";
import Counter from "./Counter";
import { MISSIONS, GLOBAL_STATS, FEED } from "@/lib/data";
import { fmtUsd } from "@/lib/format";
import { ChainBadge } from "./Badges";

export default function HeroDashboard() {
  const recent = MISSIONS.filter((m) => m.status === "ACTIVE").slice(0, 4);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.9, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
      className="panel-elevated relative overflow-hidden"
    >
      {/* title bar */}
      <div className="flex items-center justify-between border-b border-line px-5 py-3">
        <div className="flex items-center gap-2.5">
          <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-primary" />
          <span className="microlabel !text-muted">GLOBAL OPERATIONS — LIVE</span>
        </div>
        <span className="mono text-[9px] tracking-[0.16em] text-faint">
          FEED 0x7A31 // ENCRYPTED
        </span>
      </div>

      {/* map */}
      <div className="border-b border-line bg-[rgba(5,6,7,0.5)] p-4">
        <WorldMap />
      </div>

      {/* stats row */}
      <div className="grid grid-cols-4 divide-x divide-[rgba(255,255,255,0.08)] border-b border-line">
        {[
          { label: "RAISED", value: GLOBAL_STATS.capitalRaised, fmt: fmtUsd },
          { label: "ACTIVE", value: GLOBAL_STATS.liveMissions, fmt: (n: number) => Math.round(n).toLocaleString() },
          { label: "COMPLETE", value: GLOBAL_STATS.graduated, fmt: (n: number) => Math.round(n).toLocaleString() },
          { label: "VOL 24H", value: GLOBAL_STATS.dailyVolume, fmt: fmtUsd },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3.5">
            <p className="microlabel">{s.label}</p>
            <p className="mono mt-1 text-[15px] font-medium text-white">
              <Counter value={s.value} format={s.fmt} />
            </p>
          </div>
        ))}
      </div>

      {/* recent launches */}
      <div className="px-5 py-4">
        <p className="microlabel mb-3">RECENT DEPLOYMENTS</p>
        <ul className="space-y-2.5">
          {recent.map((m) => (
            <li key={m.id} className="flex items-center gap-3 text-[12px]">
              <span className="mono w-[104px] shrink-0 text-[10px] text-faint">{m.id}</span>
              <span className="truncate font-medium text-white">{m.name}</span>
              <span className="mono text-muted">${m.ticker}</span>
              <ChainBadge chain={m.chain} className="ml-auto" />
              <span className="mono tnum w-14 text-right text-[11px] text-primary">
                {m.fundingPct}%
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* ticker strip */}
      <div className="overflow-hidden border-t border-line bg-[rgba(5,6,7,0.5)] py-2">
        <div className="mono flex animate-[ticker_38s_linear_infinite] gap-10 whitespace-nowrap text-[10px] tracking-[0.1em] text-faint">
          {[...FEED, ...FEED].map((f, i) => (
            <span key={i} className="flex items-center gap-2">
              <span className="text-muted">{f.time}</span>
              <span
                style={{
                  color:
                    f.type === "GRADUATE" || f.type === "BUY"
                      ? "var(--primary)"
                      : f.type === "SELL"
                        ? "var(--danger)"
                        : "var(--accent)",
                }}
              >
                {f.type}
              </span>
              {f.text}
            </span>
          ))}
        </div>
      </div>
      <style jsx>{`
        @keyframes ticker {
          from { transform: translateX(0); }
          to { transform: translateX(-50%); }
        }
      `}</style>
    </motion.div>
  );
}

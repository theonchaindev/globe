"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { Mission } from "@/lib/data";
import { fmtUsd, fmtNum, timeSince } from "@/lib/format";
import { ChainBadge, StatusBadge, RiskBadge, ClearanceBadge, VerifiedBadge } from "./Badges";
import TokenSigil from "./TokenSigil";

export default function MissionCard({ m, index = 0 }: { m: Mission; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/missions/${m.slug}`}
        className="panel group relative block overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.16)] hover:bg-panel2"
      >
        {/* corner clearance stamp */}
        <div className="absolute right-4 top-4 flex flex-col items-end gap-2">
          <ClearanceBadge level={m.clearance} />
        </div>

        {/* header row */}
        <div className="flex items-start gap-3.5 pr-20">
          <div className="relative">
            <TokenSigil ticker={m.ticker} hue={m.hue} />
            {m.status === "ACTIVE" && (
              <span className="pulse-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="microlabel">{m.id}</p>
            <h3 className="mt-0.5 flex items-center gap-1.5 truncate text-[15px] font-semibold text-white">
              {m.name}
              {m.verified && <VerifiedBadge />}
            </h3>
            <p className="mono text-[11px] text-muted">${m.ticker}</p>
          </div>
        </div>

        {/* badges */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ChainBadge chain={m.chain} />
          <StatusBadge status={m.status} />
          <span className="mono text-[9px] tracking-[0.14em] text-faint">
            AGENT {m.agent}
          </span>
        </div>

        {/* funding */}
        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="microlabel">Funding</span>
            <span className="mono tnum text-[11px] text-white">
              {m.fundingPct}%{" "}
              <span className="text-faint">· {fmtUsd(m.raised)} / {fmtUsd(m.target)}</span>
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${m.fundingPct}%`,
                background:
                  m.status === "FAILED"
                    ? "var(--danger)"
                    : m.fundingPct >= 100
                      ? "var(--accent)"
                      : "var(--primary)",
              }}
            />
          </div>
        </div>

        {/* stats grid */}
        <dl className="mt-4 grid grid-cols-4 gap-3 border-t border-line pt-4">
          {[
            ["MCAP", fmtUsd(m.marketCap)],
            ["LIQ", fmtUsd(m.liquidity)],
            ["VOL 24H", fmtUsd(m.volume24h)],
            ["HOLDERS", fmtNum(m.holders)],
          ].map(([k, v]) => (
            <div key={k}>
              <dt className="microlabel">{k}</dt>
              <dd className="mono tnum mt-1 text-[12px] text-white">{v}</dd>
            </div>
          ))}
        </dl>

        {/* footer micro row */}
        <div className="mono mt-4 flex items-center justify-between text-[9px] tracking-[0.12em] text-faint">
          <span>T+{timeSince(m.ageMinutes)}</span>
          <RiskBadge risk={m.risk} />
          <span>
            {Math.abs(m.coords.lat).toFixed(2)}°{m.coords.lat >= 0 ? "N" : "S"}{" "}
            {Math.abs(m.coords.lon).toFixed(2)}°{m.coords.lon >= 0 ? "E" : "W"}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

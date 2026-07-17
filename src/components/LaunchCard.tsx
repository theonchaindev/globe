"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChainBadge, StatusBadge } from "./Badges";
import TokenSigil from "./TokenSigil";
import type { LiveLaunch } from "@/lib/useLiveLaunches";
import { shortHash } from "@/lib/format";

/** Card for a REAL launched mission — everything on it comes from chain. */
export default function LaunchCard({ l, index = 0 }: { l: LiveLaunch; index?: number }) {
  const { record, live } = l;
  const stats = live && live !== "error" ? live : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.5, delay: (index % 6) * 0.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <Link
        href={`/live/${record.address}`}
        className="panel group relative block overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-[rgba(255,255,255,0.16)] hover:bg-panel2"
      >
        <div className="flex items-start gap-3.5">
          <div className="relative">
            <TokenSigil ticker={record.ticker} hue={(record.ticker.charCodeAt(0) || 65) * 7} />
            {stats && !stats.graduated && (
              <span className="pulse-dot absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full bg-primary" />
            )}
          </div>
          <div className="min-w-0">
            <p className="microlabel">{shortHash(record.address).toUpperCase()}</p>
            <h3 className="mt-0.5 truncate text-[15px] font-semibold text-white">{record.name}</h3>
            <p className="mono text-[11px] text-muted">${record.ticker}</p>
          </div>
          <div className="ml-auto flex flex-col items-end gap-1.5">
            <ChainBadge chain={record.chain} />
            {stats && <StatusBadge status={stats.graduated ? "COMPLETE" : "ACTIVE"} />}
          </div>
        </div>

        <div className="mt-4">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="microlabel">Curve Progress</span>
            <span className="mono tnum text-[11px] text-white">
              {stats ? `${stats.progressPct.toFixed(1)}%` : live === "error" ? "—" : "…"}
              {stats && <span className="text-faint"> · {stats.reserveLabel}</span>}
            </span>
          </div>
          <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${stats?.progressPct ?? 0}%`,
                background: stats?.graduated ? "var(--accent)" : "var(--primary)",
              }}
            />
          </div>
        </div>

        <div className="mono mt-4 flex items-center justify-between border-t border-line pt-3.5 text-[9px] tracking-[0.12em] text-faint">
          <span>{stats ? `PRICE ${stats.priceLabel}` : live === "error" ? "STATE UNAVAILABLE" : "READING CHAIN…"}</span>
          <span>FEE {(record.tradingFeeBps / 100).toFixed(2)}%</span>
          <span>{new Date(record.createdAt).toISOString().slice(0, 10)}</span>
        </div>
      </Link>
    </motion.div>
  );
}

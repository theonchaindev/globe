"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Insignia from "./Insignia";
import type { LiveLaunch } from "@/lib/useLiveLaunches";
import { EASE } from "./motion";

/**
 * Editorial list row for a real launched mission. Red fills in on hover;
 * everything on it is read from chain.
 */
export default function MissionRow({
  l,
  index,
  rankLabel,
}: {
  l: LiveLaunch;
  index: number;
  /** override the left-hand number (leaderboard rank) */
  rankLabel?: string;
}) {
  const { record, live } = l;
  const stats = live && live !== "error" ? live : null;
  const pct = stats?.progressPct ?? 0;

  return (
    <motion.li
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.8, delay: Math.min(index, 8) * 0.05, ease: EASE }}
      className="border-b border-line"
    >
      <Link
        href={`/live/${record.address}`}
        className="row-wipe group grid grid-cols-[auto_1fr_auto] items-center gap-x-5 gap-y-3 py-5 pl-1 pr-2 md:grid-cols-[56px_minmax(0,2.4fr)_120px_minmax(0,1.6fr)_140px_32px] md:gap-x-6 md:py-6"
      >
        <span className="row-dim mono text-[11px] text-faint transition-colors">
          {rankLabel ?? String(index + 1).padStart(2, "0")}
        </span>

        <span className="flex min-w-0 items-center gap-4">
          <Insignia image={record.image} ticker={record.ticker} size={44} />
          <span className="min-w-0">
            <span className="display-md block truncate text-[26px] text-white md:text-[30px]">{record.name}</span>
            <span className="row-dim mono block text-[11px] text-muted transition-colors">${record.ticker}</span>
          </span>
        </span>

        {/* mobile: compact right column */}
        <span className="flex flex-col items-end gap-1 md:hidden">
          <span className="mono tnum text-[13px] text-white">{stats ? `${pct.toFixed(1)}%` : "…"}</span>
          <span className="row-dim mono text-[9px] tracking-[0.16em] text-faint">{record.chain}</span>
        </span>

        <span className="row-dim mono hidden text-[10px] tracking-[0.18em] text-muted transition-colors md:block">
          {record.chain}
        </span>

        <span className="col-span-3 md:col-span-1">
          <span className="relative block h-[3px] bg-[rgba(244,242,238,0.1)] group-hover:bg-[rgba(255,255,255,0.3)]">
            <motion.span
              className="absolute inset-y-0 left-0 block bg-red group-hover:bg-white"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.3, ease: EASE }}
            />
          </span>
          <span className="row-dim mono mt-2 hidden justify-between text-[10px] tracking-[0.1em] text-faint md:flex">
            <span>{stats ? (stats.amm ? stats.reserveLabel : `${pct.toFixed(1)}% TO GRADUATION`) : live === "error" ? "STATE UNAVAILABLE" : "READING CHAIN…"}</span>
            {stats?.graduated && <span className="text-white">GRADUATED</span>}
          </span>
        </span>

        <span className="row-dim mono hidden text-right text-[12px] text-muted transition-colors md:block">
          {stats ? stats.priceLabel : live === "error" ? "—" : <span className="skeleton inline-block h-3 w-20" />}
        </span>

        <ArrowUpRight
          size={20}
          className="hidden text-faint transition-all duration-500 group-hover:rotate-45 group-hover:text-white md:block"
        />
      </Link>
    </motion.li>
  );
}

/** Column headings for a list of MissionRows (desktop only). */
export function MissionRowHead({ first = "No." }: { first?: string }) {
  return (
    <div className="microlabel hidden grid-cols-[56px_minmax(0,2.4fr)_120px_minmax(0,1.6fr)_140px_32px] gap-x-6 border-b border-line-strong pb-3 pl-1 pr-2 md:grid">
      <span>{first}</span>
      <span>Mission</span>
      <span>Theatre</span>
      <span>Curve</span>
      <span className="text-right">Price</span>
      <span />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import Insignia from "./Insignia";
import type { LiveLaunch } from "@/lib/useLiveLaunches";
import { shortHash } from "@/lib/format";
import { EASE } from "./motion";

/** Poster-style tile for a real launched mission — grid view. */
export default function LaunchCard({ l, index = 0 }: { l: LiveLaunch; index?: number }) {
  const { record, live } = l;
  const stats = live && live !== "error" ? live : null;
  const pct = stats?.progressPct ?? 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.8, delay: (index % 6) * 0.06, ease: EASE }}
      className="bg-bg"
    >
      <Link href={`/live/${record.address}`} className="card group flex h-full flex-col !border-0 p-6">
        <div className="flex items-start justify-between">
          <Insignia image={record.image} ticker={record.ticker} size={52} />
          <ArrowUpRight size={20} className="text-faint transition-all duration-500 group-hover:rotate-45 group-hover:text-red" />
        </div>

        <p className="mono mt-10 text-[10px] tracking-[0.18em] text-faint">
          {record.chain} · {shortHash(record.address).toUpperCase()}
        </p>
        <h3 className="display mt-2 truncate text-[44px] text-white">{record.name}</h3>
        <p className="mono text-[12px] text-muted">${record.ticker}</p>

        <div className="mt-auto pt-10">
          <div className="mb-2 flex items-baseline justify-between">
            <span className="microlabel">{stats?.amm ? "Pool" : "To graduation"}</span>
            <span className="display text-[28px] text-white">
              {stats ? (stats.amm ? "AMM" : `${pct.toFixed(0)}%`) : live === "error" ? "—" : <span className="skeleton inline-block h-5 w-12" />}
            </span>
          </div>
          <div className="h-[3px] bg-[rgba(244,242,238,0.1)]">
            <motion.div
              className="h-full bg-red"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1.3, ease: EASE }}
            />
          </div>
          <p className="mono mt-3 text-[10px] tracking-[0.12em] text-faint">
            {stats ? `PRICE ${stats.priceLabel}` : live === "error" ? "STATE UNAVAILABLE" : "READING CHAIN…"}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

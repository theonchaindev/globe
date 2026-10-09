"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SpinningGlobe from "./SpinningGlobe";
import Counter from "./Counter";
import { ChainBadge } from "./Badges";
import { useLiveLaunches } from "@/lib/useLiveLaunches";

export default function HeroDashboard() {
  const { launches } = useLiveLaunches();
  const recent = launches.slice(0, 4);
  const active = launches.filter((l) => l.live && l.live !== "error" && !l.live.graduated).length;
  const graduated = launches.filter((l) => l.live && l.live !== "error" && l.live.graduated).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, filter: "blur(8px)" }}
      animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      transition={{ duration: 1.1, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
      className="panel-elevated brackets relative overflow-hidden shadow-[0_40px_120px_-40px_rgba(0,0,0,0.9)]"
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

      {/* globe */}
      <div className="border-b border-line bg-[rgba(7,6,5,0.5)] p-4">
        <SpinningGlobe />
      </div>

      {/* stats row — real registry counts */}
      <div className="grid grid-cols-4 divide-x divide-[rgba(255,255,255,0.08)] border-b border-line">
        {[
          { label: "DEPLOYED", value: launches.length },
          { label: "ACTIVE", value: active },
          { label: "GRADUATED", value: graduated },
          { label: "THEATRES", value: 2 },
        ].map((s) => (
          <div key={s.label} className="px-4 py-3.5">
            <p className="microlabel">{s.label}</p>
            <p className="mono tnum mt-1 text-[15px] font-medium text-white"><Counter value={s.value} /></p>
          </div>
        ))}
      </div>

      {/* recent deployments — real launches only */}
      <div className="px-5 py-4">
        <p className="microlabel mb-3">RECENT DEPLOYMENTS</p>
        {recent.length === 0 ? (
          <p className="mono py-2 text-[10px] tracking-[0.14em] text-faint">
            NO DEPLOYMENTS ON RECORD —{" "}
            <Link href="/launch" className="text-primary hover:underline">
              FILE THE FIRST MISSION
            </Link>
          </p>
        ) : (
          <ul className="space-y-2.5">
            {recent.map((l) => (
              <li key={l.record.id}>
                <Link href={`/live/${l.record.address}`} className="flex items-center gap-3 text-[12px]">
                  <span className="mono w-[104px] shrink-0 truncate text-[10px] text-faint">
                    {l.record.address.slice(0, 10)}…
                  </span>
                  <span className="truncate font-medium text-white">{l.record.name}</span>
                  <span className="mono text-muted">${l.record.ticker}</span>
                  <ChainBadge chain={l.record.chain} className="ml-auto" />
                  <span className="mono tnum w-14 text-right text-[11px] text-primary">
                    {l.live && l.live !== "error" ? `${l.live.progressPct.toFixed(0)}%` : "…"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

    </motion.div>
  );
}

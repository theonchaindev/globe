"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import Insignia from "@/components/Insignia";
import MissionRow, { MissionRowHead } from "@/components/MissionRow";
import PageHeader from "@/components/PageHeader";
import { EASE } from "@/components/motion";
import { EmptyState, SearchField, SkeletonRow } from "@/components/ui";

export default function LeaderboardPage() {
  const { launches, loaded } = useLiveLaunches();
  const [query, setQuery] = useState("");

  const ranked = useMemo(
    () =>
      launches
        .filter((l) => l.live && l.live !== "error")
        .sort((a, b) => {
          const pa = a.live && a.live !== "error" ? a.live.progressPct : 0;
          const pb = b.live && b.live !== "error" ? b.live.progressPct : 0;
          return pb - pa;
        }),
    [launches],
  );

  const rows = useMemo(() => {
    if (!query) return ranked;
    const q = query.toLowerCase();
    return ranked.filter(
      (l) => l.record.name.toLowerCase().includes(q) || l.record.ticker.toLowerCase().includes(q),
    );
  }, [ranked, query]);

  const podium = ranked.slice(0, 3);
  // still reading chain for some launches — don't flash the empty state
  const pending = launches.some((l) => l.live === null);

  return (
    <div>
      <PageHeader
        code="FILE 03 — NETWORK RANKINGS"
        title="Leaderboard"
        description="Missions ranked by live bonding-curve progress. The closest to graduating sit at the top."
      />

      <div className="wrap">
        {(!loaded || (pending && ranked.length === 0)) && [0, 1, 2].map((i) => <SkeletonRow key={i} />)}

        {loaded && !pending && ranked.length === 0 && (
          <EmptyState
            title="No ranked missions"
            body="Rankings come from live on-chain curve progress. Launch a token to claim the first slot."
          />
        )}

        {podium.length > 0 && (
          <div className="mb-20 grid gap-px border border-line bg-line md:grid-cols-3">
            {podium.map((l, i) => {
              const stats = l.live && l.live !== "error" ? l.live : null;
              return (
                <motion.div
                  key={l.record.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.5 + i * 0.12, ease: EASE }}
                  className="bg-bg"
                >
                  <Link href={`/live/${l.record.address}`} className="card group block h-full !border-0 p-7">
                    <span
                      className={`display block text-[120px] leading-[0.8] transition-colors duration-700 sm:text-[150px] ${
                        i === 0 ? "text-red" : "text-transparent group-hover:text-red"
                      }`}
                      style={i === 0 ? undefined : { WebkitTextStroke: "1px rgba(244,242,238,0.35)" }}
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div className="mt-8 flex items-center gap-3">
                      <Insignia image={l.record.image} ticker={l.record.ticker} size={40} />
                      <div className="min-w-0">
                        <p className="display-md truncate text-[28px] text-white">{l.record.name}</p>
                        <p className="mono text-[11px] text-muted">${l.record.ticker} · {l.record.chain}</p>
                      </div>
                    </div>
                    <div className="mt-6 flex items-baseline justify-between border-t border-line pt-4">
                      <span className="microlabel">To graduation</span>
                      <span className="display text-[36px] text-white">
                        {stats ? `${stats.progressPct.toFixed(1)}%` : "…"}
                      </span>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}

        {ranked.length > 0 && (
          <>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-6">
              <h2 className="display text-[48px] text-white sm:text-[64px]">Full rankings</h2>
              <SearchField value={query} onChange={setQuery} placeholder="Search missions…" className="w-full sm:w-72" />
            </div>
            <MissionRowHead first="Rank" />
            <ul>
              {rows.map((l) => (
                <MissionRow
                  key={l.record.id}
                  l={l}
                  index={ranked.indexOf(l)}
                  rankLabel={`#${String(ranked.indexOf(l) + 1).padStart(2, "0")}`}
                />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

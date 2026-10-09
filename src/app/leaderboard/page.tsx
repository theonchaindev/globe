"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Trophy } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";
import { Bar, EmptyState, SearchField, SkeletonCard } from "@/components/ui";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";
import { shortHash } from "@/lib/format";

export default function LeaderboardPage() {
  const { launches, loaded } = useLiveLaunches();
  const [query, setQuery] = useState("");

  const rows = useMemo(() => {
    let out = launches.filter((l) => l.live && l.live !== "error");
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (l) =>
          l.record.name.toLowerCase().includes(q) ||
          l.record.ticker.toLowerCase().includes(q),
      );
    }
    return out.sort((a, b) => {
      const pa = a.live && a.live !== "error" ? a.live.progressPct : 0;
      const pb = b.live && b.live !== "error" ? b.live.progressPct : 0;
      return pb - pa;
    });
  }, [launches, query]);

  const podium = rows.slice(0, 3);

  return (
    <div>
      <PageHeader
        code="FILE 03 — NETWORK RANKINGS"
        title="Leaderboard"
        description="Missions ranked by live bonding-curve progress — the closest to graduating sit at the top."
      />

      {!loaded && (
        <div className="grid gap-3 sm:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {loaded && rows.length === 0 && (
        <EmptyState
          icon={<Trophy size={22} strokeWidth={1.5} />}
          title="No ranked missions yet"
          body="Rankings are computed from live on-chain curve progress. Launch a token to claim the first slot."
        />
      )}

      {podium.length > 0 && (
        <Stagger className="mb-8 grid items-end gap-3 sm:grid-cols-3">
          {podium.map((l, i) => {
            const stats = l.live && l.live !== "error" ? l.live : null;
            return (
              <StaggerItem
                key={l.record.id}
                className={i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"}
              >
              <Link
                href={`/live/${l.record.address}`}
                className={`card block p-5 ${i === 0 ? "brackets !border-line-strong sm:pb-10 sm:pt-8" : ""}`}
              >
                <span className="mono absolute right-4 top-4 text-[22px] font-bold text-[rgba(255,255,255,0.08)]">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <Insignia image={l.record.image} ticker={l.record.ticker} size={40} />
                <p className="mt-3 text-[14px] font-semibold text-white">{l.record.name}</p>
                <p className="mono text-[10px] text-faint">{shortHash(l.record.creator).toUpperCase()}</p>
                <div className="mt-4 flex items-end justify-between">
                  <div>
                    <p className="microlabel">PROGRESS</p>
                    <p className="mono tnum text-xl font-medium text-primary">
                      {stats ? `${stats.progressPct.toFixed(1)}%` : "…"}
                    </p>
                  </div>
                  <ChainBadge chain={l.record.chain} />
                </div>
              </Link>
              </StaggerItem>
            );
          })}
        </Stagger>
      )}

      {rows.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <SearchField value={query} onChange={setQuery} placeholder="Search missions…" className="min-w-[220px] flex-1 sm:max-w-xs" />
          </div>

          <Reveal className="panel overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="border-b border-line">
                  {["#", "Mission", "Theatre", "Status", "Raised", "Price", "Progress"].map((h) => (
                    <th key={h} className="microlabel whitespace-nowrap px-4 py-3.5">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((l, i) => {
                  const stats = l.live && l.live !== "error" ? l.live : null;
                  return (
                    <tr key={l.record.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel2">
                      <td className="mono tnum px-4 py-3.5 text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</td>
                      <td className="px-4 py-3.5">
                        <Link href={`/live/${l.record.address}`} className="flex items-center gap-3">
                          <Insignia image={l.record.image} ticker={l.record.ticker} size={28} />
                          <div>
                            <p className="text-[13px] font-medium text-white">{l.record.name}</p>
                            <p className="mono text-[9px] text-faint">${l.record.ticker}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3.5"><ChainBadge chain={l.record.chain} /></td>
                      <td className="px-4 py-3.5">
                        {stats && <StatusBadge status={stats.graduated ? "COMPLETE" : "ACTIVE"} />}
                      </td>
                      <td className="mono tnum px-4 py-3.5 text-[12px] text-white">{stats?.reserveLabel ?? "—"}</td>
                      <td className="mono tnum px-4 py-3.5 text-[12px] text-muted">{stats?.priceLabel ?? "—"}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex w-28 items-center gap-2">
                          <Bar pct={stats?.progressPct ?? 0} done={stats?.graduated} className="flex-1" />
                          <span className="mono tnum text-[10px] text-primary">
                            {stats ? `${stats.progressPct.toFixed(1)}%` : "—"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </Reveal>
        </>
      )}
    </div>
  );
}

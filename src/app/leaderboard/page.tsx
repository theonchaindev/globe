"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ArrowRight } from "lucide-react";
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
    <div className="py-10">
      <div className="mb-8">
        <p className="microlabel mb-2">NETWORK RANKINGS — RANKED BY CURVE PROGRESS</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Top Operatives</h1>
      </div>

      {loaded && rows.length === 0 && (
        <div className="panel flex flex-col items-center gap-3 border-dashed px-6 py-20 text-center">
          <p className="text-[15px] font-medium text-white">No ranked missions yet</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-muted">
            Rankings are computed from live on-chain curve progress. Launch a
            mission to claim the first slot.
          </p>
          <Link
            href="/launch"
            className="mt-2 flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-black transition-all hover:brightness-110"
          >
            Deploy Mission <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {podium.length > 0 && (
        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {podium.map((l, i) => {
            const stats = l.live && l.live !== "error" ? l.live : null;
            return (
              <Link
                key={l.record.id}
                href={`/live/${l.record.address}`}
                className={`panel-elevated relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 ${
                  i === 0 ? "sm:order-2 border-[rgba(232,224,208,0.3)]" : i === 1 ? "sm:order-1" : "sm:order-3"
                }`}
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
            );
          })}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search missions…"
                className="h-9 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-[13px] text-white placeholder:text-faint focus:border-[rgba(232,224,208,0.4)] focus:outline-none"
              />
            </div>
          </div>

          <div className="panel overflow-x-auto">
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
                          <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                            <div
                              className="h-full rounded-full"
                              style={{
                                width: `${stats?.progressPct ?? 0}%`,
                                background: stats?.graduated ? "var(--accent)" : "var(--primary)",
                              }}
                            />
                          </div>
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
          </div>
        </>
      )}
    </div>
  );
}

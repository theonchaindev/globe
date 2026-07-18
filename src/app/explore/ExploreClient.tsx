"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, LayoutGrid, Table2, ArrowRight, RefreshCw } from "lucide-react";
import type { Chain } from "@/lib/types";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import LaunchCard from "@/components/LaunchCard";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";
import { shortHash } from "@/lib/format";

type View = "grid" | "table";

const CHAIN_FILTERS: Array<{ label: string; value: Chain | "ALL" }> = [
  { label: "All Theatres", value: "ALL" },
  { label: "Solana", value: "SOLANA" },
  { label: "Robinhood", value: "ROBINHOOD" },
];

export default function ExploreClient() {
  const params = useSearchParams();
  const { launches, loaded, refresh } = useLiveLaunches();
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<Chain | "ALL">(
    (params.get("chain") as Chain) || "ALL",
  );

  const filtered = useMemo(() => {
    let out = [...launches];
    if (chain !== "ALL") out = out.filter((l) => l.record.chain === chain);
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (l) =>
          l.record.name.toLowerCase().includes(q) ||
          l.record.ticker.toLowerCase().includes(q) ||
          l.record.address.toLowerCase().includes(q),
      );
    }
    return out.sort((a, b) => b.record.createdAt - a.record.createdAt);
  }, [launches, chain, query]);

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="microlabel mb-2">MISSION DATABASE</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Explore</h1>
          <p className="mono mt-2 text-[11px] tracking-[0.1em] text-faint">
            {filtered.length} LIVE MISSION{filtered.length === 1 ? "" : "S"} ON RECORD — ALL DATA READ FROM CHAIN
          </p>
        </div>
        <button
          onClick={() => void refresh()}
          className="mono flex h-8 items-center gap-2 rounded-md border border-line px-3 text-[10px] tracking-[0.14em] text-muted transition-colors hover:text-white"
        >
          <RefreshCw size={11} /> REFRESH
        </button>
      </div>

      {/* controls */}
      <div className="mb-8 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search missions, tickers, addresses…"
            className="h-9 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-[13px] text-white placeholder:text-faint focus:border-[rgba(232,224,208,0.4)] focus:outline-none"
          />
        </div>

        <div className="flex overflow-hidden rounded-md border border-line">
          {CHAIN_FILTERS.map((c) => (
            <button
              key={c.value}
              onClick={() => setChain(c.value)}
              className={`h-9 px-3.5 text-[12px] transition-colors ${
                chain === c.value ? "bg-panel2 text-white" : "text-muted hover:text-white"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex overflow-hidden rounded-md border border-line">
          {(
            [
              { v: "grid", icon: LayoutGrid },
              { v: "table", icon: Table2 },
            ] as const
          ).map(({ v, icon: Icon }) => (
            <button
              key={v}
              onClick={() => setView(v)}
              aria-label={`${v} view`}
              className={`flex h-9 w-10 items-center justify-center transition-colors ${
                view === v ? "bg-panel2 text-primary" : "text-muted hover:text-white"
              }`}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>
      </div>

      {/* empty state */}
      {loaded && filtered.length === 0 && (
        <div className="panel flex flex-col items-center gap-3 border-dashed px-6 py-20 text-center">
          <p className="text-[15px] font-medium text-white">No missions on record</p>
          <p className="max-w-sm text-[13px] leading-relaxed text-muted">
            Every mission listed here is a real on-chain launch. Deploy one and it
            appears immediately with live curve state.
          </p>
          <Link
            href="/launch"
            className="mt-2 flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-black transition-all hover:brightness-110"
          >
            Deploy Mission <ArrowRight size={14} />
          </Link>
        </div>
      )}

      {/* views */}
      {view === "grid" && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l, i) => (
            <LaunchCard key={l.record.id} l={l} index={i} />
          ))}
        </div>
      )}

      {view === "table" && filtered.length > 0 && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left">
            <thead>
              <tr className="border-b border-line">
                {["Mission", "Theatre", "Status", "Curve Progress", "Price", "Fee", "Deployed"].map((h) => (
                  <th key={h} className="microlabel whitespace-nowrap px-4 py-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((l) => {
                const stats = l.live && l.live !== "error" ? l.live : null;
                return (
                  <tr key={l.record.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel2">
                    <td className="px-4 py-3">
                      <Link href={`/live/${l.record.address}`} className="flex items-center gap-3">
                        <Insignia image={l.record.image} ticker={l.record.ticker} size={30} />
                        <div>
                          <p className="text-[13px] font-medium text-white">{l.record.name}</p>
                          <p className="mono text-[10px] text-faint">
                            ${l.record.ticker} · {shortHash(l.record.address)}
                          </p>
                        </div>
                      </Link>
                    </td>
                    <td className="px-4 py-3"><ChainBadge chain={l.record.chain} /></td>
                    <td className="px-4 py-3">
                      {stats ? <StatusBadge status={stats.graduated ? "COMPLETE" : "ACTIVE"} /> : <span className="mono text-[10px] text-faint">…</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-16 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${stats?.progressPct ?? 0}%`,
                              background: stats?.graduated ? "var(--accent)" : "var(--primary)",
                            }}
                          />
                        </div>
                        <span className="mono tnum text-[11px] text-muted">
                          {stats ? `${stats.progressPct.toFixed(1)}%` : "—"}
                        </span>
                      </div>
                    </td>
                    <td className="mono tnum px-4 py-3 text-[11px] text-white">{stats?.priceLabel ?? "—"}</td>
                    <td className="mono tnum px-4 py-3 text-[11px] text-muted">{(l.record.tradingFeeBps / 100).toFixed(2)}%</td>
                    <td className="mono tnum px-4 py-3 text-[11px] text-muted">
                      {new Date(l.record.createdAt).toISOString().slice(0, 10)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

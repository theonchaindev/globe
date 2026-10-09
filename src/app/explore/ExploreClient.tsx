"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Compass, LayoutGrid, Table2, ArrowRight, RefreshCw } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion";
import { Bar, EmptyState, SearchField, Segmented, SkeletonCard } from "@/components/ui";
import type { Chain } from "@/lib/types";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import LaunchCard from "@/components/LaunchCard";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";
import { shortHash } from "@/lib/format";

type View = "grid" | "table";

const CHAIN_FILTERS: Array<{ label: string; value: Chain | "ALL" }> = [
  { label: "All", value: "ALL" },
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
    <div>
      <PageHeader
        code="FILE 02 — MISSION DATABASE"
        title="Explore"
        description={
          <>
            Every token launched through GLOBAL, with live state read straight from chain.{" "}
            <span className="mono text-[11px] tracking-[0.1em] text-faint">
              {loaded ? `${filtered.length} ON RECORD` : "LOADING…"}
            </span>
          </>
        }
        actions={
          <>
            <button onClick={() => void refresh()} className="btn btn-ghost btn-sm" aria-label="Refresh">
              <RefreshCw size={13} /> Refresh
            </button>
            <Link href="/launch" className="btn btn-primary btn-sm">
              Launch a token <ArrowRight size={14} />
            </Link>
          </>
        }
      />

      {/* controls */}
      <Reveal immediate delay={0.2} className="mb-8 flex flex-wrap items-center gap-3">
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Search name, ticker or address…"
          className="min-w-[220px] flex-1 sm:max-w-sm"
        />
        <Segmented id="chain" options={CHAIN_FILTERS} value={chain} onChange={setChain} />
        <div className="ml-auto">
          <Segmented
            id="view"
            value={view}
            onChange={setView}
            options={[
              { value: "grid", label: <LayoutGrid size={14} />, aria: "Grid view" },
              { value: "table", label: <Table2 size={14} />, aria: "Table view" },
            ]}
          />
        </div>
      </Reveal>

      {!loaded && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map((i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {loaded && filtered.length === 0 && (
        <EmptyState
          icon={<Compass size={22} strokeWidth={1.5} />}
          title={query || chain !== "ALL" ? "No matches" : "No missions on record"}
          body={
            query || chain !== "ALL"
              ? "Nothing matches those filters. Try a different search or theatre."
              : "Every mission listed here is a real on-chain launch. Deploy one and it appears immediately with live curve state."
          }
          cta={query || chain !== "ALL" ? null : undefined}
        />
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
        <Reveal className="panel overflow-x-auto">
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
                        <Bar pct={stats?.progressPct ?? 0} done={stats?.graduated} className="w-16" />
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
        </Reveal>
      )}
    </div>
  );
}

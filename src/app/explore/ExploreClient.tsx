"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowRight, LayoutGrid, List, RefreshCw } from "lucide-react";
import type { Chain } from "@/lib/types";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import LaunchCard from "@/components/LaunchCard";
import MissionRow, { MissionRowHead } from "@/components/MissionRow";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion";
import { EmptyState, SearchField, Segmented, SkeletonRow } from "@/components/ui";

type View = "list" | "grid";

const CHAIN_FILTERS: Array<{ label: string; value: Chain | "ALL" }> = [
  { label: "All", value: "ALL" },
  { label: "Solana", value: "SOLANA" },
  { label: "Robinhood", value: "ROBINHOOD" },
];

export default function ExploreClient() {
  const params = useSearchParams();
  const { launches, loaded, refresh } = useLiveLaunches();
  const [view, setView] = useState<View>("list");
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<Chain | "ALL">((params.get("chain") as Chain) || "ALL");

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

  const filtering = !!query || chain !== "ALL";

  return (
    <div>
      <PageHeader
        code="FILE 02 — MISSION DATABASE"
        title="Explore"
        description={
          <>
            Every token launched through GLOBAL, with live state read straight from chain.{" "}
            <span className="mono text-[11px] tracking-[0.14em] text-white">
              {loaded ? `${filtered.length} ON FILE` : "LOADING…"}
            </span>
          </>
        }
        actions={
          <>
            <button onClick={() => void refresh()} className="btn btn-ghost btn-sm" aria-label="Refresh">
              <RefreshCw size={12} /> Refresh
            </button>
            <Link href="/launch" className="btn btn-primary btn-sm">
              Launch a token <ArrowRight size={13} />
            </Link>
          </>
        }
      />

      <div className="wrap">
        <Reveal immediate delay={0.5} className="mb-10 flex flex-wrap items-end gap-x-8 gap-y-4">
          <SearchField
            value={query}
            onChange={setQuery}
            placeholder="Search name, ticker or address…"
            className="min-w-[240px] flex-1 sm:max-w-md"
          />
          <Segmented id="chain" options={CHAIN_FILTERS} value={chain} onChange={setChain} />
          <div className="ml-auto">
            <Segmented
              id="view"
              value={view}
              onChange={setView}
              options={[
                { value: "list", label: <List size={14} />, aria: "List view" },
                { value: "grid", label: <LayoutGrid size={14} />, aria: "Grid view" },
              ]}
            />
          </div>
        </Reveal>

        {!loaded && [0, 1, 2].map((i) => <SkeletonRow key={i} />)}

        {loaded && filtered.length === 0 && (
          <EmptyState
            title={filtering ? "No matches" : "No missions yet"}
            body={
              filtering
                ? "Nothing matches those filters. Try a different search or theatre."
                : "Every mission listed here is a real on-chain launch. Deploy one and it appears immediately with live curve state."
            }
            cta={filtering ? null : undefined}
          />
        )}

        {view === "list" && filtered.length > 0 && (
          <>
            <MissionRowHead />
            <ul>
              {filtered.map((l, i) => (
                <MissionRow key={l.record.id} l={l} index={i} />
              ))}
            </ul>
          </>
        )}

        {view === "grid" && filtered.length > 0 && (
          <div className="grid gap-px border border-line bg-line sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((l, i) => (
              <LaunchCard key={l.record.id} l={l} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

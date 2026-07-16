"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Search, LayoutGrid, Table2, BarChart3 } from "lucide-react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { MISSIONS, type Mission, type Chain } from "@/lib/data";
import { fmtUsd, fmtNum, fmtPct, timeSince } from "@/lib/format";
import MissionCard from "@/components/MissionCard";
import { ChainBadge, StatusBadge, VerifiedBadge } from "@/components/Badges";
import TokenSigil from "@/components/TokenSigil";

type View = "grid" | "table" | "analytics";
type SortKey = "trending" | "marketCap" | "volume24h" | "liquidity" | "ageMinutes" | "holders";

const CHAIN_FILTERS: Array<{ label: string; value: Chain | "ALL" }> = [
  { label: "All Theatres", value: "ALL" },
  { label: "Solana", value: "SOLANA" },
  { label: "Robinhood", value: "ROBINHOOD" },
];

const QUICK = ["Trending", "Graduated", "Verified", "New"] as const;

const col = createColumnHelper<Mission>();

const columns = [
  col.accessor("name", {
    header: "Mission",
    cell: (info) => {
      const m = info.row.original;
      return (
        <Link href={`/missions/${m.slug}`} className="flex items-center gap-3">
          <TokenSigil ticker={m.ticker} hue={m.hue} size={30} />
          <div>
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-white">
              {m.name} {m.verified && <VerifiedBadge />}
            </p>
            <p className="mono text-[10px] text-faint">
              {m.id} · ${m.ticker}
            </p>
          </div>
        </Link>
      );
    },
  }),
  col.accessor("chain", {
    header: "Theatre",
    cell: (info) => <ChainBadge chain={info.getValue()} />,
  }),
  col.accessor("status", {
    header: "Status",
    cell: (info) => <StatusBadge status={info.getValue()} />,
  }),
  col.accessor("marketCap", {
    header: "Market Cap",
    cell: (info) => <span className="mono tnum text-[12px]">{fmtUsd(info.getValue())}</span>,
  }),
  col.accessor("volume24h", {
    header: "Vol 24H",
    cell: (info) => <span className="mono tnum text-[12px]">{fmtUsd(info.getValue())}</span>,
  }),
  col.accessor("liquidity", {
    header: "Liquidity",
    cell: (info) => <span className="mono tnum text-[12px]">{fmtUsd(info.getValue())}</span>,
  }),
  col.accessor("change24h", {
    header: "24H",
    cell: (info) => (
      <span
        className="mono tnum text-[12px]"
        style={{ color: info.getValue() >= 0 ? "var(--primary)" : "var(--danger)" }}
      >
        {fmtPct(info.getValue())}
      </span>
    ),
  }),
  col.accessor("holders", {
    header: "Holders",
    cell: (info) => <span className="mono tnum text-[12px]">{fmtNum(info.getValue())}</span>,
  }),
  col.accessor("ageMinutes", {
    header: "Age",
    cell: (info) => <span className="mono tnum text-[12px] text-muted">{timeSince(info.getValue())}</span>,
  }),
  col.accessor("fundingPct", {
    header: "Funding",
    cell: (info) => (
      <div className="flex items-center gap-2">
        <div className="h-1 w-14 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
          <div
            className="h-full rounded-full"
            style={{
              width: `${info.getValue()}%`,
              background: info.getValue() >= 100 ? "var(--accent)" : "var(--primary)",
            }}
          />
        </div>
        <span className="mono tnum text-[11px] text-muted">{info.getValue()}%</span>
      </div>
    ),
  }),
];

export default function ExploreClient() {
  const params = useSearchParams();
  const [view, setView] = useState<View>("grid");
  const [query, setQuery] = useState("");
  const [chain, setChain] = useState<Chain | "ALL">(
    (params.get("chain") as Chain) || "ALL",
  );
  const [quick, setQuick] = useState<string | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("trending");
  const [sorting, setSorting] = useState<SortingState>([]);

  const filtered = useMemo(() => {
    let out = [...MISSIONS];
    if (chain !== "ALL") out = out.filter((m) => m.chain === chain);
    if (quick === "Graduated") out = out.filter((m) => m.graduated);
    if (quick === "Verified") out = out.filter((m) => m.verified);
    if (quick === "New") out = out.filter((m) => m.ageMinutes < 60 * 24 * 3);
    if (quick === "Trending") out = out.filter((m) => m.change24h > 0);
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.ticker.toLowerCase().includes(q) ||
          m.id.toLowerCase().includes(q) ||
          m.agent.toLowerCase().includes(q),
      );
    }
    if (sortKey === "trending") out.sort((a, b) => b.volume24h / (b.marketCap || 1) - a.volume24h / (a.marketCap || 1));
    else if (sortKey === "ageMinutes") out.sort((a, b) => a.ageMinutes - b.ageMinutes);
    else out.sort((a, b) => (b[sortKey] as number) - (a[sortKey] as number));
    return out;
  }, [chain, quick, query, sortKey]);

  const table = useReactTable({
    data: filtered,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  // analytics view aggregates
  const byCat = useMemo(() => {
    const map = new Map<string, { cat: string; count: number; mcap: number; vol: number }>();
    for (const m of filtered) {
      const e = map.get(m.category) ?? { cat: m.category, count: 0, mcap: 0, vol: 0 };
      e.count += 1;
      e.mcap += m.marketCap;
      e.vol += m.volume24h;
      map.set(m.category, e);
    }
    return [...map.values()].sort((a, b) => b.mcap - a.mcap);
  }, [filtered]);
  const maxMcap = Math.max(...byCat.map((c) => c.mcap), 1);

  return (
    <div className="py-10">
      <div className="mb-8">
        <p className="microlabel mb-2">MISSION DATABASE</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Explore</h1>
        <p className="mono mt-2 text-[11px] tracking-[0.1em] text-faint">
          {filtered.length} MISSIONS ON RECORD // QUERY EXECUTED IN 4MS
        </p>
      </div>

      {/* controls */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search missions, tickers, agents…"
            className="h-9 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-[13px] text-white placeholder:text-faint focus:border-[rgba(168,255,53,0.4)] focus:outline-none"
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

        <select
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}
          className="h-9 rounded-md border border-line bg-panel px-3 text-[12px] text-muted focus:outline-none"
        >
          <option value="trending">Sort: Trending</option>
          <option value="marketCap">Sort: Market Cap</option>
          <option value="volume24h">Sort: Volume</option>
          <option value="liquidity">Sort: Liquidity</option>
          <option value="holders">Sort: Holders</option>
          <option value="ageMinutes">Sort: Newest</option>
        </select>

        <div className="ml-auto flex overflow-hidden rounded-md border border-line">
          {(
            [
              { v: "grid", icon: LayoutGrid },
              { v: "table", icon: Table2 },
              { v: "analytics", icon: BarChart3 },
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

      {/* quick filters */}
      <div className="mb-8 flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q}
            onClick={() => setQuick(quick === q ? null : q)}
            className={`mono h-7 rounded-full border px-3.5 text-[10px] tracking-[0.14em] transition-colors ${
              quick === q
                ? "border-[rgba(168,255,53,0.5)] bg-[rgba(168,255,53,0.08)] text-primary"
                : "border-line text-muted hover:text-white"
            }`}
          >
            {q.toUpperCase()}
          </button>
        ))}
      </div>

      {/* views */}
      {view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((m, i) => (
            <MissionCard key={m.id} m={m} index={i} />
          ))}
        </div>
      )}

      {view === "table" && (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-[980px] border-collapse text-left">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="border-b border-line">
                  {hg.headers.map((h) => (
                    <th
                      key={h.id}
                      onClick={h.column.getToggleSortingHandler()}
                      className="microlabel cursor-pointer select-none whitespace-nowrap px-4 py-3 hover:text-white"
                    >
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {{ asc: " ↑", desc: " ↓" }[h.column.getIsSorted() as string] ?? ""}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel2">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === "analytics" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="panel p-6">
            <p className="microlabel mb-5">MARKET CAP BY SECTOR</p>
            <div className="space-y-4">
              {byCat.map((c) => (
                <div key={c.cat}>
                  <div className="mb-1.5 flex justify-between text-[12px]">
                    <span className="text-white">{c.cat}</span>
                    <span className="mono tnum text-muted">{fmtUsd(c.mcap)}</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-700"
                      style={{ width: `${(c.mcap / maxMcap) * 100}%`, opacity: 0.8 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="panel p-6">
            <p className="microlabel mb-5">SECTOR BREAKDOWN</p>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-line">
                  <th className="microlabel pb-3">Sector</th>
                  <th className="microlabel pb-3 text-right">Missions</th>
                  <th className="microlabel pb-3 text-right">Vol 24H</th>
                </tr>
              </thead>
              <tbody>
                {byCat.map((c) => (
                  <tr key={c.cat} className="border-b border-line last:border-0">
                    <td className="py-3 text-[13px] text-white">{c.cat}</td>
                    <td className="mono tnum py-3 text-right text-[12px] text-muted">{c.count}</td>
                    <td className="mono tnum py-3 text-right text-[12px] text-muted">{fmtUsd(c.vol)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

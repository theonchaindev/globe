"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { OPERATIVES } from "@/lib/data";
import { fmtUsd } from "@/lib/format";
import { ChainBadge, VerifiedBadge } from "@/components/Badges";
import TokenSigil from "@/components/TokenSigil";

type SortKey = "score" | "capitalRaised" | "marketCap" | "volume" | "graduation";

const COLS: Array<{ key: SortKey; label: string }> = [
  { key: "capitalRaised", label: "Capital Raised" },
  { key: "marketCap", label: "Market Cap" },
  { key: "volume", label: "Volume" },
  { key: "graduation", label: "Graduation" },
  { key: "score", label: "Operative Score" },
];

export default function LeaderboardPage() {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("score");

  const rows = useMemo(() => {
    let out = [...OPERATIVES];
    if (query) {
      const q = query.toLowerCase();
      out = out.filter(
        (o) =>
          o.mission.name.toLowerCase().includes(q) ||
          o.mission.ticker.toLowerCase().includes(q) ||
          o.mission.agent.toLowerCase().includes(q),
      );
    }
    out.sort((a, b) => (b[sort] as number) - (a[sort] as number));
    return out;
  }, [query, sort]);

  const podium = rows.slice(0, 3);

  return (
    <div className="py-10">
      <div className="mb-8">
        <p className="microlabel mb-2">NETWORK RANKINGS — CYCLE 2026-Q3</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Top Operatives</h1>
      </div>

      {/* podium */}
      <div className="mb-8 grid gap-3 sm:grid-cols-3">
        {podium.map((o, i) => (
          <Link
            key={o.mission.id}
            href={`/missions/${o.mission.slug}`}
            className={`panel-elevated relative overflow-hidden p-5 transition-all hover:-translate-y-0.5 ${
              i === 0 ? "sm:order-2 border-[rgba(168,255,53,0.3)]" : i === 1 ? "sm:order-1" : "sm:order-3"
            }`}
          >
            <span className="mono absolute right-4 top-4 text-[22px] font-bold text-[rgba(255,255,255,0.08)]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <TokenSigil ticker={o.mission.ticker} hue={o.mission.hue} size={40} />
            <p className="mt-3 flex items-center gap-1.5 text-[14px] font-semibold text-white">
              {o.mission.name} {o.mission.verified && <VerifiedBadge />}
            </p>
            <p className="mono text-[10px] text-faint">AGENT {o.mission.agent}</p>
            <div className="mt-4 flex items-end justify-between">
              <div>
                <p className="microlabel">SCORE</p>
                <p className="mono tnum text-xl font-medium text-primary">{o.score}</p>
              </div>
              <ChainBadge chain={o.mission.chain} />
            </div>
          </Link>
        ))}
      </div>

      {/* controls */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search operatives…"
            className="h-9 w-full rounded-md border border-line bg-panel pl-9 pr-3 text-[13px] text-white placeholder:text-faint focus:border-[rgba(168,255,53,0.4)] focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          className="h-9 rounded-md border border-line bg-panel px-3 text-[12px] text-muted focus:outline-none"
        >
          {COLS.map((c) => (
            <option key={c.key} value={c.key}>
              Sort: {c.label}
            </option>
          ))}
        </select>
      </div>

      {/* table */}
      <div className="panel overflow-x-auto">
        <table className="w-full min-w-[880px] text-left">
          <thead>
            <tr className="border-b border-line">
              <th className="microlabel px-5 py-3.5">#</th>
              <th className="microlabel px-4 py-3.5">Mission</th>
              {COLS.map((c) => (
                <th
                  key={c.key}
                  onClick={() => setSort(c.key)}
                  className={`microlabel cursor-pointer whitespace-nowrap px-4 py-3.5 text-right hover:text-white ${
                    sort === c.key ? "!text-primary" : ""
                  }`}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((o, i) => (
              <tr key={o.mission.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel2">
                <td className="mono tnum px-5 py-3.5 text-[12px] text-faint">{String(i + 1).padStart(2, "0")}</td>
                <td className="px-4 py-3.5">
                  <Link href={`/missions/${o.mission.slug}`} className="flex items-center gap-3">
                    <TokenSigil ticker={o.mission.ticker} hue={o.mission.hue} size={28} />
                    <div>
                      <p className="flex items-center gap-1.5 text-[13px] font-medium text-white">
                        {o.mission.name}
                        {o.mission.verified && <VerifiedBadge />}
                      </p>
                      <p className="mono text-[9px] text-faint">
                        ${o.mission.ticker} · AGENT {o.mission.agent}
                      </p>
                    </div>
                  </Link>
                </td>
                <td className="mono tnum px-4 py-3.5 text-right text-[12px] text-white">{fmtUsd(o.capitalRaised)}</td>
                <td className="mono tnum px-4 py-3.5 text-right text-[12px] text-muted">{fmtUsd(o.marketCap)}</td>
                <td className="mono tnum px-4 py-3.5 text-right text-[12px] text-muted">{fmtUsd(o.volume)}</td>
                <td className="px-4 py-3.5">
                  <div className="ml-auto flex w-24 items-center gap-2">
                    <div className="h-1 flex-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)]">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${o.graduation}%`,
                          background: o.graduation >= 100 ? "var(--accent)" : "var(--primary)",
                        }}
                      />
                    </div>
                    <span className="mono tnum text-[10px] text-muted">{o.graduation}%</span>
                  </div>
                </td>
                <td className="mono tnum px-4 py-3.5 text-right text-[13px] font-medium text-primary">{o.score}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

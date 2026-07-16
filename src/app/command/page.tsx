"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import WorldMap from "@/components/WorldMap";
import Counter from "@/components/Counter";
import { MISSIONS, GLOBAL_STATS, FEED, priceSeries } from "@/lib/data";
import { fmtUsd, timeSince } from "@/lib/format";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import TokenSigil from "@/components/TokenSigil";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const METRICS = [
  { label: "GLOBAL CAPITAL RAISED", value: GLOBAL_STATS.capitalRaised, fmt: fmtUsd, accent: true },
  { label: "TODAY'S DEPLOYMENTS", value: GLOBAL_STATS.deploymentsToday, fmt: (n: number) => Math.round(n).toString() },
  { label: "LIVE MISSIONS", value: GLOBAL_STATS.liveMissions, fmt: (n: number) => Math.round(n).toLocaleString() },
  { label: "GRADUATED", value: GLOBAL_STATS.graduated, fmt: (n: number) => Math.round(n).toLocaleString() },
  { label: "LIQUIDITY CREATED", value: GLOBAL_STATS.liquidityCreated, fmt: fmtUsd },
  { label: "DAILY VOLUME", value: GLOBAL_STATS.dailyVolume, fmt: fmtUsd },
  { label: "MISSION SUCCESS RATE", value: GLOBAL_STATS.successRate, fmt: (n: number) => `${n.toFixed(1)}%` },
];

const REGIONS = ["AMERICAS", "EMEA", "APAC", "LATAM"];
const volume = priceSeries(42, 48).map((d, i) => ({ t: i, v: d.p * 40 + d.v / 30 }));

// deterministic pseudo-random heat values
function heat(r: number, c: number) {
  const x = Math.abs(Math.sin(r * 12.9898 + c * 78.233) * 43758.5453) % 1;
  return x;
}

export default function CommandPage() {
  const newest = [...MISSIONS].sort((a, b) => a.ageMinutes - b.ageMinutes).slice(0, 6);

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="microlabel mb-2">ANALYTICS — RESTRICTED ACCESS</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Command Centre</h1>
        </div>
        <p className="mono text-[10px] tracking-[0.16em] text-faint">
          RELAY MESH 14/14 NOMINAL // TREASURY ATTESTATION #8,412 VERIFIED
        </p>
      </div>

      {/* metrics */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-7">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            className="panel p-4"
          >
            <p className="microlabel min-h-[24px]">{m.label}</p>
            <p className={`mono tnum mt-1 text-lg font-medium ${m.accent ? "text-primary" : "text-white"}`}>
              <Counter value={m.value} format={m.fmt} />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* world map */}
        <div className="panel-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">GLOBAL DEPLOYMENT MAP</span>
            <span className="mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-faint">
              <span className="pulse-dot h-1 w-1 rounded-full bg-primary" /> LIVE
            </span>
          </div>
          <div className="p-4">
            <WorldMap />
          </div>
        </div>

        {/* activity feed */}
        <div className="panel-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">ACTIVITY FEED</span>
            <span className="mono text-[9px] tracking-[0.16em] text-faint">CH-7 SECURE</span>
          </div>
          <ul className="flex-1 divide-y divide-[rgba(255,255,255,0.05)] overflow-y-auto">
            {[...FEED, ...FEED.slice(0, 4)].map((f, i) => (
              <li key={i} className="flex items-start gap-3 px-5 py-3">
                <span className="mono mt-0.5 text-[9px] text-faint">{f.time}</span>
                <span
                  className="mono mt-0.5 w-[64px] shrink-0 text-[9px] tracking-[0.12em]"
                  style={{
                    color:
                      f.type === "GRADUATE" || f.type === "BUY"
                        ? "var(--primary)"
                        : f.type === "SELL"
                          ? "var(--danger)"
                          : "var(--accent)",
                  }}
                >
                  {f.type}
                </span>
                <span className="text-[11.5px] leading-relaxed text-muted">{f.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_1.5fr]">
        {/* heatmap */}
        <div className="panel p-6">
          <p className="microlabel mb-5">DEPLOYMENT HEATMAP — REGION × 6H WINDOW</p>
          <div className="space-y-2">
            {REGIONS.map((region, r) => (
              <div key={region} className="flex items-center gap-2">
                <span className="mono w-[72px] shrink-0 text-[9px] tracking-[0.1em] text-faint">{region}</span>
                <div className="grid flex-1 grid-cols-12 gap-1">
                  {Array.from({ length: 12 }, (_, c) => {
                    const h = heat(r, c);
                    return (
                      <div
                        key={c}
                        className="aspect-square rounded-[3px]"
                        style={{
                          background:
                            h > 0.75
                              ? "rgba(168,255,53,0.65)"
                              : h > 0.5
                                ? "rgba(168,255,53,0.32)"
                                : h > 0.25
                                  ? "rgba(168,255,53,0.14)"
                                  : "rgba(255,255,255,0.05)",
                        }}
                        title={`${region} — window ${c}`}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <div className="mono mt-4 flex items-center gap-2 text-[9px] tracking-[0.12em] text-faint">
            LOW
            {[0.05, 0.14, 0.32, 0.65].map((o) => (
              <span key={o} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: `rgba(168,255,53,${o})` }} />
            ))}
            HIGH
          </div>

          {/* volume chart */}
          <p className="microlabel mb-3 mt-8">NETWORK VOLUME — 48H</p>
          <div className="h-32">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={volume} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="vfill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4de3ff" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#4de3ff" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="t" hide />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--panel-2)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: 8, fontSize: 11,
                    fontFamily: "var(--font-geist-mono)",
                  }}
                  labelFormatter={() => ""}
                  formatter={(v) => [`$${(Number(v) * 21000).toLocaleString()}`, "VOL"]}
                />
                <Area type="monotone" dataKey="v" stroke="#4de3ff" strokeWidth={1.4} fill="url(#vfill)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* newest deployments */}
        <div className="panel overflow-hidden">
          <p className="microlabel border-b border-line px-6 py-4">NEWEST DEPLOYMENTS</p>
          <ul className="divide-y divide-[rgba(255,255,255,0.05)]">
            {newest.map((m) => (
              <li key={m.id}>
                <Link href={`/missions/${m.slug}`} className="flex items-center gap-4 px-6 py-3.5 transition-colors hover:bg-panel2">
                  <TokenSigil ticker={m.ticker} hue={m.hue} size={32} />
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-white">{m.name}</p>
                    <p className="mono text-[10px] text-faint">{m.id} · ${m.ticker}</p>
                  </div>
                  <ChainBadge chain={m.chain} className="ml-auto" />
                  <StatusBadge status={m.status} />
                  <span className="mono tnum hidden w-16 text-right text-[11px] text-muted sm:block">
                    T+{timeSince(m.ageMinutes)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

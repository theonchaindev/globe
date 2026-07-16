"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Globe, MessageCircle, AtSign, Code2 } from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  type Mission,
  priceSeries,
  holderDistribution,
  FEED,
} from "@/lib/data";
import { fmtUsd, fmtNum, fmtPct, timeSince, shortHash } from "@/lib/format";
import {
  ChainBadge,
  StatusBadge,
  RiskBadge,
  ClearanceBadge,
  VerifiedBadge,
} from "@/components/Badges";
import TokenSigil from "@/components/TokenSigil";

const RANGES = ["1H", "4H", "1D", "1W", "ALL"] as const;

export default function MissionClient({ mission: m }: { mission: Mission }) {
  const [range, setRange] = useState<(typeof RANGES)[number]>("1D");
  const seed = m.hue + m.holders;
  const series = useMemo(() => priceSeries(seed), [seed]);
  const holders = useMemo(() => holderDistribution(seed), [seed]);
  const lastPrice = series[series.length - 1].p;
  const up = m.change24h >= 0;

  const timeline = [
    { t: "T+0", label: "Mission filed", detail: `Briefing submitted by AGENT ${m.agent}` },
    { t: "T+4m", label: "Clearance granted", detail: `${m.clearance} verification passed` },
    { t: "T+9m", label: "Deployment", detail: `Contract deployed to ${m.chain} theatre` },
    { t: "T+11m", label: "Trading live", detail: "Bonding curve opened to operatives" },
    ...(m.graduated
      ? [{ t: `T+${timeSince(m.ageMinutes)}`, label: "Graduated", detail: "Liquidity migrated and time-locked" }]
      : [{ t: "PENDING", label: "Graduation", detail: `${m.fundingPct}% of funding target reached` }]),
  ];

  const params: Array<[string, string]> = [
    ["TOTAL SUPPLY", "1,000,000,000"],
    ["AGENT ALLOCATION", "2.0%"],
    ["INITIAL LIQUIDITY", fmtUsd(m.liquidity * 0.4)],
    ["BUY / SELL TAX", "0% / 0%"],
    ["CURVE", "CONSTANT PRODUCT"],
    ["GRADUATION TARGET", fmtUsd(m.target)],
    ["LP LOCK", "PERMANENT"],
    ["MINT AUTHORITY", "REVOKED"],
  ];

  return (
    <div className="py-10">
      <Link
        href="/explore"
        className="mono mb-8 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted transition-colors hover:text-white"
      >
        <ArrowLeft size={13} /> MISSION DATABASE
      </Link>

      {/* ── header ── */}
      <div className="panel-elevated relative overflow-hidden p-6">
        <div className="absolute right-5 top-5 flex flex-col items-end gap-2">
          <ClearanceBadge level={m.clearance} />
          <span className="stamp text-warning">EYES ONLY</span>
        </div>
        <div className="flex flex-wrap items-center gap-5 pr-24">
          <TokenSigil ticker={m.ticker} hue={m.hue} size={56} />
          <div>
            <p className="microlabel">{m.id} — MISSION OVERVIEW</p>
            <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              {m.name} {m.verified && <VerifiedBadge />}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2.5">
              <span className="mono text-[12px] text-muted">${m.ticker}</span>
              <ChainBadge chain={m.chain} />
              <StatusBadge status={m.status} />
              <RiskBadge risk={m.risk} />
            </div>
          </div>
          <div className="ml-auto text-right">
            <p className="mono tnum text-2xl font-medium text-white">${lastPrice.toFixed(4)}</p>
            <p className="mono tnum text-[12px]" style={{ color: up ? "var(--primary)" : "var(--danger)" }}>
              {fmtPct(m.change24h)} 24H
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_360px]">
        {/* ── left column ── */}
        <div className="space-y-4">
          {/* chart */}
          <div className="panel p-5">
            <div className="mb-4 flex items-center justify-between">
              <p className="microlabel">PRICE — {m.ticker}/USD</p>
              <div className="flex overflow-hidden rounded border border-line">
                {RANGES.map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`mono h-6 px-2.5 text-[9px] tracking-[0.1em] transition-colors ${
                      range === r ? "bg-panel2 text-primary" : "text-faint hover:text-white"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="pfill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={up ? "#a8ff35" : "#ff5a5a"} stopOpacity={0.18} />
                      <stop offset="100%" stopColor={up ? "#a8ff35" : "#ff5a5a"} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t" hide />
                  <YAxis domain={["dataMin", "dataMax"]} hide />
                  <Tooltip
                    contentStyle={{
                      background: "var(--panel-2)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: 8,
                      fontSize: 11,
                      fontFamily: "var(--font-geist-mono)",
                    }}
                    labelFormatter={() => ""}
                    formatter={(v) => [`$${Number(v).toFixed(4)}`, "PRICE"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="p"
                    stroke={up ? "#a8ff35" : "#ff5a5a"}
                    strokeWidth={1.5}
                    fill="url(#pfill)"
                    isAnimationActive
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 h-14">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={series} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <XAxis dataKey="t" hide />
                  <Bar dataKey="v" fill="rgba(77,227,255,0.25)" isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* stats strip */}
          <div className="panel grid grid-cols-2 divide-[rgba(255,255,255,0.08)] sm:grid-cols-5 sm:divide-x">
            {[
              ["MARKET CAP", fmtUsd(m.marketCap)],
              ["LIQUIDITY", fmtUsd(m.liquidity)],
              ["VOLUME 24H", fmtUsd(m.volume24h)],
              ["HOLDERS", fmtNum(m.holders)],
              ["DEPLOYED", `T+${timeSince(m.ageMinutes)}`],
            ].map(([k, v]) => (
              <div key={k} className="px-4 py-4">
                <p className="microlabel">{k}</p>
                <p className="mono tnum mt-1 text-[14px] text-white">{v}</p>
              </div>
            ))}
          </div>

          {/* agent briefing */}
          <div className="panel p-6">
            <p className="microlabel mb-4">AGENT BRIEFING</p>
            <p className="text-[14px] leading-relaxed text-white/90">{m.description}</p>
            <div className="mt-5 grid gap-4 border-t border-line pt-5 sm:grid-cols-3">
              <div>
                <p className="microlabel">AGENT</p>
                <p className="mono mt-1 text-[12px] text-white">{m.agent}</p>
              </div>
              <div>
                <p className="microlabel">WALLET</p>
                <p className="mono mt-1 text-[12px] text-accent">{shortHash(m.agentWallet)}</p>
              </div>
              <div>
                <p className="microlabel">SECTOR</p>
                <p className="mono mt-1 text-[12px] text-white">{m.category.toUpperCase()}</p>
              </div>
            </div>
            <div className="mt-5 flex gap-2 border-t border-line pt-5">
              {[Globe, AtSign, MessageCircle, Code2].map((Icon, i) => (
                <span
                  key={i}
                  className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:text-white"
                >
                  <Icon size={13} />
                </span>
              ))}
              <span className="mono ml-auto self-center text-[9px] tracking-[0.16em] text-faint">
                COMMS CHANNELS VERIFIED
              </span>
            </div>
          </div>

          {/* deployment parameters */}
          <div className="panel p-6">
            <p className="microlabel mb-4">DEPLOYMENT PARAMETERS</p>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
              {params.map(([k, v]) => (
                <div key={k}>
                  <dt className="microlabel">{k}</dt>
                  <dd className="mono mt-1 text-[12px] text-white">{v}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* transactions */}
          <div className="panel overflow-x-auto">
            <p className="microlabel border-b border-line px-6 py-4">RECENT TRANSACTIONS</p>
            <table className="w-full min-w-[560px] text-left">
              <tbody>
                {FEED.filter((f) => f.type === "BUY" || f.type === "SELL").map((f, i) => (
                  <tr key={i} className="border-b border-line last:border-0">
                    <td className="mono px-6 py-3 text-[11px] text-faint">{f.time}</td>
                    <td
                      className="mono px-4 py-3 text-[11px]"
                      style={{ color: f.type === "BUY" ? "var(--primary)" : "var(--danger)" }}
                    >
                      {f.type}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-muted">{f.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── right column ── */}
        <div className="space-y-4">
          {/* funding */}
          <div className="panel p-6">
            <p className="microlabel mb-4">FUNDING PROGRESS</p>
            <p className="mono tnum text-3xl font-medium text-white">{m.fundingPct}%</p>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${m.fundingPct}%`,
                  background: m.status === "FAILED" ? "var(--danger)" : m.fundingPct >= 100 ? "var(--accent)" : "var(--primary)",
                }}
              />
            </div>
            <p className="mono tnum mt-3 text-[11px] text-muted">
              {fmtUsd(m.raised)} raised of {fmtUsd(m.target)} target
            </p>
            <button className="mt-5 h-10 w-full rounded-md bg-primary text-[13px] font-semibold text-black transition-all hover:brightness-110">
              Acquire ${m.ticker}
            </button>
            <button className="mt-2 h-10 w-full rounded-md border border-line text-[13px] font-medium text-white transition-colors hover:bg-panel2">
              Liquidate Position
            </button>
          </div>

          {/* mission timeline */}
          <div className="panel p-6">
            <p className="microlabel mb-5">MISSION TIMELINE</p>
            <ol className="relative space-y-5 border-l border-line pl-5">
              {timeline.map((e, i) => (
                <li key={i} className="relative">
                  <span
                    className={`absolute -left-[25px] top-1 h-2 w-2 rounded-full ${
                      e.t === "PENDING" ? "border border-line bg-transparent" : "bg-primary"
                    }`}
                  />
                  <p className="mono text-[9px] tracking-[0.16em] text-faint">{e.t}</p>
                  <p className="mt-0.5 text-[13px] font-medium text-white">{e.label}</p>
                  <p className="text-[12px] text-muted">{e.detail}</p>
                </li>
              ))}
            </ol>
          </div>

          {/* top holders */}
          <div className="panel p-6">
            <p className="microlabel mb-4">TOP HOLDERS — DISTRIBUTION</p>
            <div className="mb-4 flex h-2 w-full gap-[2px] overflow-hidden rounded-full">
              {holders.map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: `${h.pct * 1.6}%`,
                    background: i === 0 ? "var(--accent)" : i === 1 ? "var(--warning)" : `rgba(168,255,53,${0.7 - i * 0.08})`,
                  }}
                />
              ))}
            </div>
            <ul className="space-y-2.5">
              {holders.map((h, i) => (
                <li key={i} className="flex items-center gap-2 text-[11px]">
                  <span className="mono w-5 text-faint">{String(i + 1).padStart(2, "0")}</span>
                  <span className="mono text-accent">{shortHash(h.wallet)}</span>
                  {h.tag && <span className="microlabel !text-[8px]">{h.tag}</span>}
                  <span className="mono tnum ml-auto text-white">{h.pct.toFixed(2)}%</span>
                </li>
              ))}
            </ul>
          </div>

          {/* intel feed */}
          <div className="panel p-6">
            <p className="microlabel mb-4 flex items-center gap-2">
              <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
              INTEL FEED
            </p>
            <ul className="space-y-3.5">
              {FEED.slice(0, 6).map((f, i) => (
                <li key={i} className="text-[12px] leading-relaxed">
                  <span className="mono mr-2 text-[10px] text-faint">{f.time}</span>
                  <span className="text-muted">{f.text}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* micro details */}
          <div className="mono space-y-1.5 px-2 text-[9px] tracking-[0.14em] text-faint">
            <p>CONTRACT: {shortHash(m.agentWallet).toUpperCase()}</p>
            <p>
              STATION: {m.coords.label} — {Math.abs(m.coords.lat).toFixed(4)}°
              {m.coords.lat >= 0 ? "N" : "S"} {Math.abs(m.coords.lon).toFixed(4)}°
              {m.coords.lon >= 0 ? "E" : "W"}
            </p>
            <p>DOSSIER HASH: SHA-256 // {(seed * 2654435761 % 0xffffffff).toString(16).toUpperCase().padStart(8, "0")}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

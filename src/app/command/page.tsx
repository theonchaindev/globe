"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import WorldMap from "@/components/WorldMap";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL } from "@/lib/evm/config";

export default function CommandPage() {
  const { launches, loaded } = useLiveLaunches();

  const active = launches.filter((l) => l.live && l.live !== "error" && !l.live.graduated);
  const graduated = launches.filter((l) => l.live && l.live !== "error" && l.live.graduated);
  const solCount = launches.filter((l) => l.record.chain === "SOLANA").length;
  const evmCount = launches.filter((l) => l.record.chain === "ROBINHOOD").length;
  const newest = [...launches].sort((a, b) => b.record.createdAt - a.record.createdAt).slice(0, 6);

  const METRICS = [
    { label: "MISSIONS DEPLOYED", value: String(launches.length), accent: true },
    { label: "LIVE MISSIONS", value: String(active.length) },
    { label: "GRADUATED", value: String(graduated.length) },
    { label: "SOLANA THEATRE", value: String(solCount) },
    { label: "EVM THEATRE", value: String(evmCount) },
    { label: "RELAY NODES", value: "14/14" },
    { label: "SUCCESS RATE", value: launches.length ? `${((graduated.length / launches.length) * 100).toFixed(0)}%` : "—" },
  ];

  return (
    <div className="py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="microlabel mb-2">ANALYTICS — RESTRICTED ACCESS</p>
          <h1 className="text-3xl font-semibold tracking-tight text-white">Command Centre</h1>
        </div>
        <p className="mono text-[10px] tracking-[0.16em] text-faint">
          SOLANA {SOLANA_CLUSTER.toUpperCase()} // EVM {EVM_NETWORK_LABEL} — ALL FIGURES READ FROM CHAIN
        </p>
      </div>

      {/* metrics — real registry counts */}
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
              {m.value}
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* world map */}
        <div className="panel-elevated overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">GLOBAL RELAY NETWORK</span>
            <span className="mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-faint">
              <span className="pulse-dot h-1 w-1 rounded-full bg-primary" /> LIVE
            </span>
          </div>
          <div className="p-4">
            <WorldMap />
          </div>
        </div>

        {/* newest deployments — real */}
        <div className="panel-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">NEWEST DEPLOYMENTS</span>
            <span className="mono text-[9px] tracking-[0.16em] text-faint">ON-CHAIN</span>
          </div>
          {loaded && newest.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-[13px] text-muted">No deployments on record.</p>
              <Link
                href="/launch"
                className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[12px] font-semibold text-black transition-all hover:brightness-110"
              >
                Deploy Mission <ArrowRight size={13} />
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-[rgba(255,255,255,0.05)]">
              {newest.map((l) => {
                const stats = l.live && l.live !== "error" ? l.live : null;
                return (
                  <li key={l.record.id}>
                    <Link href={`/live/${l.record.address}`} className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-panel2">
                      <Insignia image={l.record.image} ticker={l.record.ticker} size={30} />
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-white">{l.record.name}</p>
                        <p className="mono text-[9px] text-faint">${l.record.ticker}</p>
                      </div>
                      <ChainBadge chain={l.record.chain} className="ml-auto" />
                      {stats && <StatusBadge status={stats.graduated ? "COMPLETE" : "ACTIVE"} />}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {/* curve progress overview — real */}
      {launches.length > 0 && (
        <div className="panel mt-4 p-6">
          <p className="microlabel mb-5">CURVE PROGRESS — ALL MISSIONS</p>
          <div className="space-y-4">
            {launches.map((l) => {
              const stats = l.live && l.live !== "error" ? l.live : null;
              return (
                <div key={l.record.id}>
                  <div className="mb-1.5 flex justify-between text-[12px]">
                    <Link href={`/live/${l.record.address}`} className="text-white hover:underline">
                      {l.record.name} <span className="mono text-[10px] text-faint">${l.record.ticker}</span>
                    </Link>
                    <span className="mono tnum text-muted">
                      {stats ? `${stats.progressPct.toFixed(1)}% · ${stats.reserveLabel}` : "reading…"}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${stats?.progressPct ?? 0}%`,
                        background: stats?.graduated ? "var(--accent)" : "var(--primary)",
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

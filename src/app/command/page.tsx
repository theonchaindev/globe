"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import SpinningGlobe from "@/components/SpinningGlobe";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";
import Counter from "@/components/Counter";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion";
import { Bar } from "@/components/ui";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL } from "@/lib/evm/config";

export default function CommandPage() {
  const { launches, loaded } = useLiveLaunches();

  const active = launches.filter((l) => l.live && l.live !== "error" && !l.live.graduated);
  const graduated = launches.filter((l) => l.live && l.live !== "error" && l.live.graduated);
  const solCount = launches.filter((l) => l.record.chain === "SOLANA").length;
  const evmCount = launches.filter((l) => l.record.chain === "ROBINHOOD").length;
  const newest = [...launches].sort((a, b) => b.record.createdAt - a.record.createdAt).slice(0, 6);

  const gradRate = launches.length ? (graduated.length / launches.length) * 100 : 0;
  const METRICS = [
    { label: "Missions deployed", value: launches.length, accent: true },
    { label: "Live on curve", value: active.length },
    { label: "Graduated", value: graduated.length },
    { label: "Solana theatre", value: solCount },
    { label: "Robinhood theatre", value: evmCount },
    { label: "Graduation rate", value: gradRate, pct: true },
  ];

  return (
    <div>
      <PageHeader
        code="FILE 04 — COMMAND CENTRE"
        title="Analytics"
        description={
          <>
            The whole network at a glance.{" "}
            <span className="mono text-[11px] tracking-[0.1em] text-faint">
              SOLANA {SOLANA_CLUSTER.toUpperCase()} · EVM {EVM_NETWORK_LABEL}
            </span>
          </>
        }
      />

      {/* metrics — real registry counts */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {METRICS.map((m, i) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{ duration: 0.7, delay: 0.15 + i * 0.06, ease: [0.16, 1, 0.3, 1] }}
            className="card card-hover p-5"
          >
            <p className="microlabel">{m.label}</p>
            <p className={`mono mt-2 text-2xl font-medium ${m.accent ? "text-primary" : "text-white"}`}>
              <Counter value={m.value} format={m.pct ? (n) => `${n.toFixed(0)}%` : undefined} />
            </p>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* world map */}
        <Reveal delay={0.1} className="panel-elevated brackets overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">THEATRE MAP — LIVE ORBIT</span>
            <span className="mono flex items-center gap-1.5 text-[9px] tracking-[0.16em] text-faint">
              <span className="pulse-dot h-1 w-1 rounded-full bg-primary" /> LIVE
            </span>
          </div>
          <div className="p-4">
            <SpinningGlobe />
          </div>
        </Reveal>

        {/* newest deployments — real */}
        <Reveal delay={0.18} className="panel-elevated flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-line px-5 py-3">
            <span className="microlabel !text-muted">NEWEST DEPLOYMENTS</span>
            <span className="mono text-[9px] tracking-[0.16em] text-faint">ON-CHAIN</span>
          </div>
          {loaded && newest.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 py-16 text-center">
              <p className="text-[13px] text-muted">No deployments on record.</p>
              <Link href="/launch" className="btn btn-primary btn-sm">
                Launch a token <ArrowRight size={13} />
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
        </Reveal>
      </div>

      {/* curve progress overview — real */}
      {launches.length > 0 && (
        <Reveal className="panel mt-4 p-6">
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
                  <Bar pct={stats?.progressPct ?? 0} done={stats?.graduated} className="!h-1.5" />
                </div>
              );
            })}
          </div>
        </Reveal>
      )}
    </div>
  );
}

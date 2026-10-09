"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import SpinningGlobe from "@/components/SpinningGlobe";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import Insignia from "@/components/Insignia";
import Counter from "@/components/Counter";
import PageHeader from "@/components/PageHeader";
import { EASE, Reveal } from "@/components/motion";
import { EmptyState, Stat } from "@/components/ui";
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
  const solShare = launches.length ? (solCount / launches.length) * 100 : 0;

  return (
    <div>
      <PageHeader
        code="FILE 04 — COMMAND CENTRE"
        title="Analytics"
        description={
          <>
            The whole network at a glance.{" "}
            <span className="mono text-[11px] tracking-[0.14em] text-white">
              SOLANA {SOLANA_CLUSTER.toUpperCase()} · EVM {EVM_NETWORK_LABEL}
            </span>
          </>
        }
      />

      <div className="wrap">
        {/* headline figures */}
        <div className="grid grid-cols-2 gap-y-12 lg:grid-cols-4">
          <Stat label="Missions deployed" delay={0.5}><Counter value={launches.length} /></Stat>
          <Stat label="Live on curve" delay={0.58}><Counter value={active.length} /></Stat>
          <Stat label="Graduated" delay={0.66}><Counter value={graduated.length} /></Stat>
          <Stat label="Graduation rate" delay={0.74}>
            <Counter value={gradRate} format={(n) => `${n.toFixed(0)}%`} />
          </Stat>
        </div>

        {/* theatre split */}
        <Reveal className="mt-20">
          <div className="mb-3 flex items-baseline justify-between">
            <span className="display-md text-[28px] text-white">Solana <span className="mono text-[13px] text-muted">{solCount}</span></span>
            <span className="microlabel">Theatre split</span>
            <span className="display-md text-[28px] text-white"><span className="mono text-[13px] text-muted">{evmCount}</span> Robinhood</span>
          </div>
          <div className="flex h-3 overflow-hidden bg-[rgba(244,242,238,0.1)]">
            <motion.div
              className="h-full bg-red"
              initial={{ width: "0%" }}
              whileInView={{ width: `${solShare}%` }}
              viewport={{ once: true }}
              transition={{ duration: 1.4, ease: EASE }}
            />
            <div className={`h-full flex-1 ${launches.length ? "bg-primary/80" : ""}`} />
          </div>
        </Reveal>

        <div className="mt-20 grid gap-px border border-line bg-line lg:grid-cols-[1.4fr_1fr]">
          {/* theatre map */}
          <Reveal className="relative bg-bg">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <span className="microlabel !text-muted">Theatre map — live orbit</span>
              <span className="mono flex items-center gap-2 text-[10px] tracking-[0.16em] text-faint">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-red" /> LIVE
              </span>
            </div>
            <div className="p-6">
              <SpinningGlobe />
            </div>
          </Reveal>

          {/* newest deployments */}
          <Reveal delay={0.1} className="flex flex-col bg-bg">
            <div className="flex items-center justify-between border-b border-line px-6 py-4">
              <span className="microlabel !text-muted">Newest deployments</span>
              <span className="mono text-[10px] tracking-[0.16em] text-faint">ON-CHAIN</span>
            </div>
            {loaded && newest.length === 0 ? (
              <div className="flex flex-1 flex-col justify-center p-6">
                <EmptyState title="No deployments" body="The feed fills as missions launch." />
              </div>
            ) : (
              <ul>
                {newest.map((l) => {
                  const stats = l.live && l.live !== "error" ? l.live : null;
                  return (
                    <li key={l.record.id} className="border-b border-line last:border-0">
                      <Link href={`/live/${l.record.address}`} className="row-wipe group flex items-center gap-4 px-6 py-4">
                        <Insignia image={l.record.image} ticker={l.record.ticker} size={34} />
                        <div className="min-w-0">
                          <p className="display-md truncate text-[22px] text-white">{l.record.name}</p>
                          <p className="row-dim mono text-[10px] text-faint">${l.record.ticker} · {l.record.chain}</p>
                        </div>
                        <span className="mono ml-auto text-[12px] text-white">
                          {stats ? `${stats.progressPct.toFixed(0)}%` : "…"}
                        </span>
                        <ArrowUpRight size={16} className="text-faint transition-transform duration-500 group-hover:rotate-45 group-hover:text-white" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Reveal>
        </div>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Globe2, ShieldCheck, Radar, Landmark, Network, FileSearch } from "lucide-react";
import HeroDashboard from "@/components/HeroDashboard";
import LaunchCard from "@/components/LaunchCard";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL } from "@/lib/evm/config";

const ease = [0.16, 1, 0.3, 1] as const;

function Fade({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay, ease }}
    >
      {children}
    </motion.div>
  );
}

const CAPABILITIES = [
  {
    icon: Globe2,
    title: "Multi-theatre deployment",
    body: "One briefing, two theatres. Deploy to Solana or Robinhood Chain from a single mission file with identical parameters and audit trail.",
  },
  {
    icon: ShieldCheck,
    title: "Clearance-graded verification",
    body: "Every agent, contract and allocation passes a five-level clearance pipeline before capital is accepted. Nothing ships unvetted.",
  },
  {
    icon: Radar,
    title: "Live risk intelligence",
    body: "Continuous surveillance of holder concentration, liquidity depth and deployment anomalies, published as a real-time risk rating.",
  },
  {
    icon: Landmark,
    title: "Locked graduation treasury",
    body: "Graduated missions route liquidity into time-locked treasury contracts. No agent access, no exceptions, cryptographic proof throughout.",
  },
  {
    icon: Network,
    title: "Global relay network",
    body: "Fourteen relay nodes across six continents co-sign every deployment for sub-second global settlement confirmation.",
  },
  {
    icon: FileSearch,
    title: "Full mission dossiers",
    body: "Complete deployment parameters, holder distribution and transaction history on permanent record for every mission ever launched.",
  },
];

export default function Home() {
  const { launches } = useLiveLaunches();
  const featured = launches.slice(0, 6);

  return (
    <div className="pb-8">
      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="grid min-h-[calc(100vh-5rem)] items-center gap-12 py-12 lg:grid-cols-[1.05fr_1fr] lg:gap-16">
        <div>
          <Fade>
            <div className="mono inline-flex items-center gap-2 rounded border border-line bg-panel px-2.5 py-1 text-[10px] tracking-[0.22em] text-muted">
              <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
              CLASSIFIED NETWORK
            </div>
          </Fade>

          <Fade delay={0.08}>
            <h1 className="mt-6 text-[64px] font-bold leading-[0.95] tracking-[0.06em] text-white sm:text-[88px] lg:text-[96px]">
              GLOBAL
            </h1>
          </Fade>

          <Fade delay={0.16}>
            <p className="mt-6 max-w-lg text-[19px] font-medium leading-snug text-white sm:text-[22px]">
              Launch tokens across multiple blockchains through a secure global
              deployment network.
            </p>
          </Fade>

          <Fade delay={0.24}>
            <p className="mt-4 max-w-lg text-[14px] leading-relaxed text-muted">
              Deploy your project to Solana or Robinhood Chain using an
              intelligence-grade launch system trusted by thousands of builders
              worldwide.
            </p>
          </Fade>

          <Fade delay={0.32}>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/launch"
                className="flex h-11 items-center gap-2 rounded-md bg-primary px-6 text-[13px] font-semibold text-black transition-all hover:brightness-110"
              >
                Deploy Mission
                <ArrowRight size={15} />
              </Link>
              <Link
                href="/explore"
                className="flex h-11 items-center rounded-md border border-line bg-panel px-6 text-[13px] font-medium text-white transition-colors hover:bg-panel2"
              >
                Browse Intelligence
              </Link>
            </div>
          </Fade>

          <Fade delay={0.42}>
            <div className="mt-12">
              <p className="microlabel mb-4">SUPPORTED NETWORKS</p>
              <div className="flex items-center gap-0">
                <div className="flex items-center gap-2.5 rounded-md border border-line bg-panel px-4 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  <span className="mono text-[11px] tracking-[0.18em] text-white">SOLANA</span>
                </div>
                {/* animated link between networks */}
                <svg width="72" height="12" className="mx-1">
                  <line x1="0" y1="6" x2="72" y2="6" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                  <line x1="0" y1="6" x2="72" y2="6" stroke="var(--primary)" strokeWidth="1" className="dash-flow" opacity="0.7" />
                </svg>
                <div className="flex items-center gap-2.5 rounded-md border border-line bg-panel px-4 py-2.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-warning" />
                  <span className="mono text-[11px] tracking-[0.18em] text-white">ROBINHOOD</span>
                </div>
              </div>
            </div>
          </Fade>
        </div>

        <HeroDashboard />
      </section>

      {/* ── STATS BAND ───────────────────────────────────── */}
      <section className="panel grid grid-cols-2 divide-[rgba(255,255,255,0.08)] sm:grid-cols-4 sm:divide-x">
        {[
          { label: "MISSIONS DEPLOYED", value: String(launches.length) },
          { label: "THEATRES ONLINE", value: "2" },
          { label: "SOLANA NETWORK", value: SOLANA_CLUSTER.toUpperCase() },
          { label: "EVM NETWORK", value: EVM_NETWORK_LABEL },
        ].map((s) => (
          <div key={s.label} className="px-6 py-7">
            <p className="microlabel">{s.label}</p>
            <p className="mono mt-2 text-xl font-medium text-white sm:text-[22px]">{s.value}</p>
          </div>
        ))}
      </section>

      {/* ── LIVE MISSIONS ────────────────────────────────── */}
      <section className="mt-24">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="microlabel mb-2">LIVE INTELLIGENCE</p>
            <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
              Active Missions
            </h2>
          </div>
          <Link href="/explore" className="mono flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-muted transition-colors hover:text-white">
            VIEW ALL <ArrowRight size={12} />
          </Link>
        </div>
        {featured.length === 0 ? (
          <div className="panel flex flex-col items-center gap-3 border-dashed px-6 py-16 text-center">
            <p className="text-[14px] text-muted">No missions deployed yet. The board is clear.</p>
            <Link
              href="/launch"
              className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-black transition-all hover:brightness-110"
            >
              Deploy the First Mission <ArrowRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((l, i) => (
              <LaunchCard key={l.record.id} l={l} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── CAPABILITIES ─────────────────────────────────── */}
      <section className="mt-28">
        <div className="mb-10 max-w-xl">
          <p className="microlabel mb-2">INFRASTRUCTURE</p>
          <h2 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
            Built like national infrastructure. Run like a trading desk.
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.5, delay: (i % 3) * 0.07, ease }}
              className="panel p-6 transition-colors hover:bg-panel2"
            >
              <c.icon size={18} className="text-primary" strokeWidth={1.6} />
              <h3 className="mt-4 text-[15px] font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-[13px] leading-relaxed text-muted">{c.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="panel-elevated relative mt-28 overflow-hidden px-8 py-16 text-center sm:py-20">
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 300px at 50% 120%, rgba(168,255,53,0.07), transparent 70%)",
          }}
        />
        <p className="microlabel">AUTHORISATION OPEN</p>
        <h2 className="mx-auto mt-4 max-w-2xl text-3xl font-semibold tracking-tight text-white sm:text-4xl">
          Every launch starts here.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-muted">
          File your mission briefing, choose a theatre, and deploy worldwide in
          under three minutes.
        </p>
        <Link
          href="/launch"
          className="mt-8 inline-flex h-11 items-center gap-2 rounded-md bg-primary px-7 text-[13px] font-semibold text-black transition-all hover:brightness-110"
        >
          Deploy Mission <ArrowRight size={15} />
        </Link>
        <p className="mono mt-8 text-[9px] tracking-[0.2em] text-faint">
          51.5074° N // 0.1278° W — RELAY LDN-04
        </p>
      </section>
    </div>
  );
}

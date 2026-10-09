"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Coins,
  FileText,
  Globe2,
  LineChart,
  Rocket,
  ShieldCheck,
  Split,
} from "lucide-react";
import HeroDashboard from "@/components/HeroDashboard";
import LaunchCard from "@/components/LaunchCard";
import Counter from "@/components/Counter";
import { Decrypt, DrawLine, EASE, Redact, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL } from "@/lib/evm/config";

const STEPS = [
  {
    n: "01",
    icon: FileText,
    title: "File the briefing",
    body: "Name, ticker, image and socials. One form — it takes about a minute.",
  },
  {
    n: "02",
    icon: Split,
    title: "Choose a theatre",
    body: "Solana via the official pump.fun program, Robinhood Chain via Pons — or both at once.",
  },
  {
    n: "03",
    icon: Rocket,
    title: "Authorise & deploy",
    body: "Sign with your wallet. The token goes live on-chain and is listed here instantly.",
  },
];

const CAPABILITIES = [
  {
    icon: Globe2,
    title: "Two theatres, one briefing",
    body: "Write your token's identity once and deploy it to Solana, Robinhood Chain, or both in a single flow.",
  },
  {
    icon: BadgeCheck,
    title: "Official pump.fun program",
    body: "Solana launches use pump.fun's own SDK, so your token appears on pump.fun itself and graduates to PumpSwap.",
  },
  {
    icon: ShieldCheck,
    title: "Verified listings only",
    body: "Every token in the registry is checked on-chain before it's listed. Creators are read from the chain, never typed in.",
  },
  {
    icon: Coins,
    title: "Creator fees, claimable",
    body: "Your share of trading fees accrues to your wallet's creator vault. Claim it from your profile in one click.",
  },
  {
    icon: LineChart,
    title: "Live trade desk",
    body: "Every mission gets a page with live curve progress, price and market cap, read straight from chain.",
  },
  {
    icon: Rocket,
    title: "Optional dev buy",
    body: "Buy your own supply in the same transaction as the launch — no one can snipe in between.",
  },
];

export default function Home() {
  const { launches } = useLiveLaunches();
  const featured = launches.slice(0, 6);
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const towerY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const towerScale = useTransform(scrollYProgress, [0, 1], [1.04, 1.12]);
  const heroFade = useTransform(scrollYProgress, [0, 0.8], [1, 0]);

  return (
    <div className="pb-8">
      {/* ── HERO ─────────────────────────────────────────── */}
      <div ref={heroRef} className="relative">
        {/* the tower — full-bleed, parallax, swallowed by shadow at the edges */}
        <div
          className="pointer-events-none absolute -top-20 left-1/2 -z-10 h-[115vh] w-screen -translate-x-1/2 overflow-hidden"
          aria-hidden
        >
          <motion.div
            className="absolute inset-0 bg-cover bg-top opacity-[0.34]"
            style={{
              y: towerY,
              scale: towerScale,
              backgroundImage: "url(/graphics/tower.jpg)",
              maskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black 30%, transparent 78%)",
              WebkitMaskImage: "radial-gradient(ellipse 90% 80% at 50% 30%, black 30%, transparent 78%)",
            }}
          />
          <div className="scanline" />
          <div className="absolute inset-x-0 bottom-0 h-72 bg-gradient-to-b from-transparent to-bg" />
        </div>

        <motion.section
          style={{ opacity: heroFade }}
          className="relative grid min-h-[calc(100svh-4rem)] items-center gap-14 py-14 lg:grid-cols-[1.05fr_1fr] lg:gap-16"
        >
          <div>
            <Reveal immediate>
              <div className="mono inline-flex items-center gap-2 rounded border border-line bg-[rgba(16,14,11,0.7)] px-2.5 py-1 text-[10px] tracking-[0.22em] text-muted backdrop-blur">
                <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
                <Decrypt text="CLASSIFIED NETWORK — ACCESS GRANTED" trigger="mount" delay={0.3} />
              </div>
            </Reveal>

            <h1 className="mt-7 text-[68px] font-bold leading-[0.92] tracking-[0.05em] text-white sm:text-[96px] lg:text-[112px]">
              <Decrypt text="GLOBAL" trigger="mount" delay={0.15} speed={55} />
            </h1>

            <Reveal immediate delay={0.25}>
              <p className="mt-7 max-w-xl text-[21px] font-medium leading-snug tracking-[-0.01em] text-white sm:text-[26px]">
                Launch a token on Solana and Robinhood Chain —{" "}
                <span className="text-muted">from one briefing.</span>
              </p>
            </Reveal>

            <Reveal immediate delay={0.35}>
              <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-muted">
                Deploy through the official pump.fun program or hand off to Pons
                on Robinhood Chain. Every listing is verified on-chain; every
                creator fee is yours to claim.
              </p>
            </Reveal>

            <Reveal immediate delay={0.45}>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/launch" className="btn btn-primary">
                  Launch a token <ArrowRight size={15} />
                </Link>
                <Link href="/explore" className="btn btn-ghost">
                  Explore tokens
                </Link>
              </div>
            </Reveal>

            <Reveal immediate delay={0.55}>
              <ul className="mono mt-10 flex flex-wrap gap-x-6 gap-y-2 text-[10px] tracking-[0.16em] text-faint">
                {["OFFICIAL PUMP.FUN PROGRAM", "ON-CHAIN VERIFIED", "~0.03 SOL TO DEPLOY"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="h-px w-3 bg-[var(--line-strong)]" />
                    {t}
                  </li>
                ))}
              </ul>
            </Reveal>
          </div>

          <HeroDashboard />
        </motion.section>
      </div>

      {/* ── LIVE TICKER ──────────────────────────────────── */}
      <Ticker launches={launches.map((l) => l.record)} />

      {/* ── STATS BAND ───────────────────────────────────── */}
      <Stagger className="panel mt-6 grid grid-cols-2 sm:grid-cols-4">
        {[
          { label: "Missions deployed", node: <Counter value={launches.length} /> },
          { label: "Theatres online", node: <Counter value={2} /> },
          { label: "Solana network", node: SOLANA_CLUSTER.toUpperCase() },
          { label: "EVM network", node: EVM_NETWORK_LABEL },
        ].map((s, i) => (
          <StaggerItem
            key={s.label}
            className={`px-6 py-7 ${i % 2 ? "border-l border-line" : ""} ${i > 1 ? "border-t border-line sm:border-t-0" : ""} ${i === 2 ? "sm:border-l" : ""}`}
          >
            <p className="microlabel">{s.label}</p>
            <p className="mono mt-2 text-xl font-medium text-white sm:text-[22px]">{s.node}</p>
          </StaggerItem>
        ))}
      </Stagger>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="mt-32">
        <SectionHead
          code="PROTOCOL — THREE STAGES"
          title={
            <>
              From idea to <Redact>live token</Redact> in three steps.
            </>
          }
        />
        <div className="relative grid gap-4 md:grid-cols-3">
          {/* connector line that draws across behind the steps */}
          <div className="pointer-events-none absolute left-0 right-0 top-[38px] hidden md:block">
            <DrawLine delay={0.3} />
          </div>
          {STEPS.map((s, i) => (
            <Reveal key={s.n} delay={0.12 * i} className="relative">
              <div className="card card-hover brackets h-full p-6">
                <div className="flex items-center gap-3">
                  <span className="mono flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-bg text-[11px] text-primary">
                    {s.n}
                  </span>
                  <s.icon size={16} className="text-muted" strokeWidth={1.6} />
                </div>
                <h3 className="mt-6 text-[17px] font-semibold text-white">{s.title}</h3>
                <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{s.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
        <Reveal delay={0.3} className="mt-8 flex justify-center">
          <Link href="/launch" className="btn btn-ghost">
            Start the briefing <ArrowRight size={14} />
          </Link>
        </Reveal>
      </section>

      {/* ── LIVE MISSIONS ────────────────────────────────── */}
      <section className="mt-32">
        <SectionHead
          code="LIVE INTELLIGENCE"
          title="Active missions"
          action={
            <Link
              href="/explore"
              className="mono group flex items-center gap-1.5 text-[11px] tracking-[0.12em] text-muted transition-colors hover:text-white"
            >
              VIEW ALL <ArrowRight size={12} className="transition-transform group-hover:translate-x-0.5" />
            </Link>
          }
        />
        {featured.length === 0 ? (
          <Reveal>
            <div className="card brackets flex flex-col items-center gap-4 px-6 py-20 text-center">
              <Rocket size={20} className="text-faint" strokeWidth={1.5} />
              <p className="text-[15px] text-muted">No missions on record yet. The board is clear.</p>
              <Link href="/launch" className="btn btn-primary btn-sm">
                Launch the first token <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {featured.map((l, i) => (
              <LaunchCard key={l.record.id} l={l} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* ── CAPABILITIES ─────────────────────────────────── */}
      <section className="mt-32">
        <SectionHead
          code="INFRASTRUCTURE"
          title={
            <>
              Built like infrastructure. <span className="text-muted">Run like a trading desk.</span>
            </>
          }
        />
        <Stagger className="grid gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-2 lg:grid-cols-3">
          {CAPABILITIES.map((c) => (
            <StaggerItem key={c.title} className="group bg-panel p-7 transition-colors duration-500 hover:bg-panel2">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-line transition-colors duration-500 group-hover:border-line-strong">
                <c.icon size={17} className="text-primary transition-transform duration-500 group-hover:scale-110" strokeWidth={1.6} />
              </div>
              <h3 className="mt-5 text-[15px] font-semibold text-white">{c.title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-muted">{c.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <Reveal className="mt-32">
        <section className="panel-elevated brackets relative overflow-hidden px-8 py-20 text-center sm:py-28">
          <motion.div
            className="pointer-events-none absolute inset-0 bg-cover bg-[50%_35%]"
            style={{ backgroundImage: "url(/graphics/monolith.jpg)" }}
            initial={{ scale: 1.15, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 0.42 }}
            viewport={{ once: true }}
            transition={{ duration: 2.2, ease: EASE }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(to bottom, rgba(7,6,5,0.72), rgba(7,6,5,0.28) 40%, rgba(7,6,5,0.85))",
            }}
            aria-hidden
          />
          <div className="relative">
            <p className="microlabel">
              <Decrypt text="AUTHORISATION OPEN" />
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-[34px] font-semibold tracking-[-0.02em] text-white sm:text-[48px]">
              Every launch starts here.
            </h2>
            <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-muted">
              File your briefing, choose a theatre and deploy in under three minutes.
            </p>
            <Link href="/launch" className="btn btn-primary mt-9">
              Launch a token <ArrowRight size={15} />
            </Link>
            <p className="mono mt-10 text-[9px] tracking-[0.2em] text-faint">
              51.5074° N // 0.1278° W — RELAY LDN-04
            </p>
          </div>
        </section>
      </Reveal>
    </div>
  );
}

function SectionHead({
  code,
  title,
  action,
}: {
  code: string;
  title: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-10 flex items-end justify-between gap-6">
      <div className="max-w-2xl">
        <p className="microlabel mb-3 flex items-center gap-2">
          <span className="h-px w-4 bg-[var(--line-strong)]" />
          <Decrypt text={code} />
        </p>
        <Reveal>
          <h2 className="text-[28px] font-semibold leading-tight tracking-[-0.02em] text-white sm:text-[36px]">
            {title}
          </h2>
        </Reveal>
      </div>
      {action}
    </div>
  );
}

/** Marquee of real launches; falls back to theatre status lines when empty. */
function Ticker({ launches }: { launches: { id: string; name: string; ticker: string; chain: string; address: string }[] }) {
  const items =
    launches.length > 0
      ? launches.slice(0, 12).map((l) => ({ key: l.id, href: `/live/${l.address}`, text: `${l.name} · $${l.ticker}`, tag: l.chain }))
      : [
          `SOLANA THEATRE ONLINE — ${SOLANA_CLUSTER.toUpperCase()}`,
          `EVM THEATRE ONLINE — ${EVM_NETWORK_LABEL}`,
          "PUMP.FUN PROGRAM REACHABLE",
          "PONS HANDOFF READY",
          "DUAL DEPLOYMENT PROTOCOL READY",
          "AWAITING AUTHORISED LAUNCH ORDERS",
        ].map((t) => ({ key: t, href: "/launch", text: t, tag: "" }));
  const loop = [...items, ...items, ...items, ...items];
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 overflow-hidden border-y border-line bg-[rgba(16,14,11,0.6)] py-3">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-bg to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-bg to-transparent" />
      <div className="marquee mono flex w-max gap-10 whitespace-nowrap text-[10px] tracking-[0.16em] text-faint">
        {loop.map((it, i) => (
          <Link key={`${it.key}-${i}`} href={it.href} className="flex items-center gap-2.5 transition-colors hover:text-white">
            <span className="h-1 w-1 rounded-full bg-[rgba(232,224,208,0.5)]" />
            {it.text.toUpperCase()}
            {it.tag && <span className="text-[9px] text-[var(--accent)]">{it.tag}</span>}
          </Link>
        ))}
      </div>
    </div>
  );
}

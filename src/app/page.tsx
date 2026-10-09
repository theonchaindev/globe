"use client";

import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { ArrowDown, ArrowRight } from "lucide-react";
import MissionRow, { MissionRowHead } from "@/components/MissionRow";
import Counter from "@/components/Counter";
import { Cinematic, Decrypt, DrawLine, Lines, Redact, Reveal } from "@/components/motion";
import { useLiveLaunches } from "@/lib/useLiveLaunches";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";

const OPERATION = [
  {
    n: "01",
    title: "File the briefing",
    body: "Name, ticker, image and socials. One short form — about a minute.",
  },
  {
    n: "02",
    title: "Choose the theatre",
    body: "Solana through the official pump.fun program, Robinhood Chain through Pons — or both at once.",
  },
  {
    n: "03",
    title: "Authorise & deploy",
    body: "Sign once with your wallet. The token goes live on-chain and is listed here instantly.",
  },
];

const ARSENAL = [
  {
    title: "Two theatres, one briefing",
    body: "Write your token's identity once and deploy it to Solana, Robinhood Chain, or both in a single flow.",
  },
  {
    title: "The official pump.fun program",
    body: "Solana launches use pump.fun's own SDK — your token lives on pump.fun itself and graduates to PumpSwap.",
  },
  {
    title: "Verified listings only",
    body: "Every token is checked on-chain before it's listed. Creators are read from the chain, never typed in.",
  },
  {
    title: "Creator fees, claimable",
    body: "Your share of trading fees accrues to your wallet's creator vault. Claim it from your profile in one click.",
  },
  {
    title: "A live trade desk",
    body: "Every mission gets its own page with live curve progress, price and market cap, straight from chain.",
  },
  {
    title: "Snipe-proof dev buy",
    body: "Buy your own supply in the same transaction as the launch, so no one can get in between.",
  },
];

export default function Home() {
  const { launches, loaded } = useLiveLaunches();
  const featured = launches.slice(0, 6);

  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const titleY = useTransform(scrollYProgress, [0, 1], ["0%", "-30%"]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <div>
      {/* ── HERO: full-bleed title sequence ─────────────────── */}
      <section ref={heroRef} className="relative flex min-h-[100svh] flex-col overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: imgY }}>
          <Cinematic src="/graphics/tower.jpg" position="50% 20%" className="opacity-60" />
        </motion.div>
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(8,8,8,0.55),rgba(8,8,8,0.15)_35%,rgba(8,8,8,0.7)_75%,#080808)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,8,8,0.7))]" />

        <motion.div style={{ opacity: fade }} className="wrap relative flex flex-1 flex-col justify-end pb-10 pt-28">
          <Reveal immediate delay={0.2}>
            <p className="microlabel flex items-center gap-3 !text-muted">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-red" />
              <Decrypt text="CASE FILE 001 — LAUNCH OPERATIONS" trigger="mount" delay={0.4} />
            </p>
          </Reveal>

          <motion.h1 style={{ y: titleY }} className="display mt-6 text-[21vw] text-white sm:text-[17vw] lg:text-[15vw] 2xl:text-[230px]">
            <Lines immediate delay={0.25} lines={["Launch", <>Anywhere<span className="text-red">.</span></>]} />
          </motion.h1>

          <div className="mt-10 grid items-end gap-8 border-t border-line-strong pt-8 md:grid-cols-[1fr_auto]">
            <Reveal immediate delay={0.7}>
              <p className="max-w-xl text-[17px] leading-relaxed text-muted sm:text-[19px]">
                <span className="text-white">One briefing. Two chains.</span> Deploy a token on Solana
                through the official pump.fun program, or on Robinhood Chain through Pons —
                verified on-chain, creator fees yours to claim.
              </p>
            </Reveal>
            <Reveal immediate delay={0.85} className="flex flex-wrap gap-3">
              <Link href="/launch" className="btn btn-primary">
                Launch a token <ArrowRight size={14} />
              </Link>
              <Link href="/explore" className="btn btn-ghost">
                Explore missions
              </Link>
            </Reveal>
          </div>

          <Reveal immediate delay={1} className="mono mt-10 flex items-center justify-between text-[10px] tracking-[0.2em] text-faint">
            <span className="hidden sm:inline">51.5074° N — 0.1278° W</span>
            <span className="flex items-center gap-2">
              <motion.span animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity }}>
                <ArrowDown size={12} />
              </motion.span>
              SCROLL TO BRIEF
            </span>
            <span className="hidden sm:inline">SOLANA {SOLANA_CLUSTER.toUpperCase()} // ONLINE</span>
          </Reveal>
        </motion.div>
      </section>

      {/* ── RED BAND ─────────────────────────────────────────── */}
      <div className="overflow-hidden py-6" aria-hidden>
      <section className="relative -mx-4 -rotate-1 overflow-hidden bg-red py-5 sm:py-6">
        <div className="marquee flex w-max gap-10 whitespace-nowrap">
          {Array.from({ length: 2 }).flatMap((_, k) =>
            ["Solana", "Robinhood Chain", "One briefing", "Two theatres", "Verified on-chain"].map((t, i) => (
              <span key={`${k}-${i}`} className="display flex items-center gap-10 text-[48px] text-white sm:text-[72px]">
                {t}
                <span className="h-3 w-3 rotate-45 bg-black" />
              </span>
            )),
          )}
        </div>
      </section>
      </div>

      {/* ── THE OPERATION ────────────────────────────────────── */}
      <section className="wrap mt-28 grid gap-14 lg:grid-cols-[1fr_1.4fr]">
        <div className="lg:sticky lg:top-28 lg:self-start">
          <p className="microlabel"><Decrypt text="SECTION 02 — PROTOCOL" /></p>
          <h2 className="display mt-5 text-[64px] text-white sm:text-[96px]">
            <Lines lines={["The", "Operation"]} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-6 max-w-sm text-[16px] leading-relaxed text-muted">
              From idea to <Redact>live token</Redact> in three steps. Nothing touches the chain
              until you sign.
            </p>
          </Reveal>
          <Reveal delay={0.3}>
            <Link href="/launch" className="btn btn-ghost mt-8">
              Start the briefing <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>

        <ol>
          {OPERATION.map((s, i) => (
            <li key={s.n} className="group relative">
              <DrawLine delay={i * 0.1} />
              <Reveal delay={0.1 + i * 0.1} className="grid grid-cols-[auto_1fr] gap-6 py-10 sm:gap-10">
                <span
                  className="display text-[88px] text-transparent transition-colors duration-700 group-hover:text-red sm:text-[128px]"
                  style={{ WebkitTextStroke: "1px rgba(244,242,238,0.35)" }}
                >
                  {s.n}
                </span>
                <div className="pt-3 sm:pt-6">
                  <h3 className="display-md text-[34px] text-white sm:text-[44px]">{s.title}</h3>
                  <p className="mt-3 max-w-md text-[15px] leading-relaxed text-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
          <DrawLine delay={0.3} />
        </ol>
      </section>

      {/* ── ACTIVE MISSIONS ──────────────────────────────────── */}
      <section className="wrap mt-40">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="microlabel"><Decrypt text="SECTION 03 — LIVE INTELLIGENCE" /></p>
            <h2 className="display mt-5 text-[64px] text-white sm:text-[96px]">
              <Lines lines={["Active missions"]} />
            </h2>
          </div>
          <Link href="/explore" className="btn btn-ghost btn-sm">
            View all <ArrowRight size={13} />
          </Link>
        </div>

        {loaded && featured.length === 0 ? (
          <Reveal>
            <Link href="/launch" className="row-wipe group flex items-center justify-between border-y border-line-strong px-2 py-10">
              <span>
                <span className="row-dim mono block text-[10px] tracking-[0.2em] text-faint">NO MISSIONS ON FILE</span>
                <span className="display-md mt-2 block text-[36px] text-white sm:text-[52px]">Be the first to launch</span>
              </span>
              <ArrowRight size={32} className="text-red transition-all duration-500 group-hover:translate-x-2 group-hover:text-white" />
            </Link>
          </Reveal>
        ) : (
          <>
            <MissionRowHead />
            <ul>
              {featured.map((l, i) => (
                <MissionRow key={l.record.id} l={l} index={i} />
              ))}
            </ul>
          </>
        )}
      </section>

      {/* ── FULL-BLEED STATS BAND ────────────────────────────── */}
      <section className="relative mt-40 overflow-hidden border-y border-line">
        <Cinematic src="/graphics/monolith.jpg" position="50% 35%" className="opacity-45" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#080808,rgba(8,8,8,0.6)_50%,rgba(8,8,8,0.85))]" />
        <div className="wrap relative grid grid-cols-2 gap-y-14 py-24 sm:py-32 lg:grid-cols-4">
          {[
            { label: "Missions on file", node: <Counter value={launches.length} /> },
            { label: "Theatres online", node: <Counter value={2} /> },
            { label: "SOL to deploy on Solana", node: "~0.03" },
            { label: "Platform fee", node: <><Counter value={0} />%</> },
          ].map((s, i) => (
            <Reveal key={s.label} delay={i * 0.1} className="border-l border-line-strong pl-5">
              <p className="display text-[64px] text-white sm:text-[88px]">{s.node}</p>
              <p className="microlabel mt-3 !text-muted">{s.label}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── ARSENAL ──────────────────────────────────────────── */}
      <section className="wrap mt-40">
        <p className="microlabel"><Decrypt text="SECTION 04 — CAPABILITIES" /></p>
        <h2 className="display mt-5 max-w-4xl text-[64px] text-white sm:text-[96px]">
          <Lines lines={["Built like", <span key="b" className="text-muted">infrastructure.</span>]} />
        </h2>
        <div className="mt-16 grid gap-x-16 md:grid-cols-2">
          {ARSENAL.map((c, i) => (
            <Reveal key={c.title} delay={(i % 2) * 0.1} className="group grid grid-cols-[auto_1fr] gap-6 border-t border-line py-9">
              <span className="mono pt-2 text-[11px] text-red">{String(i + 1).padStart(2, "0")}</span>
              <div>
                <h3 className="display-md text-[30px] text-white transition-transform duration-500 group-hover:translate-x-1.5">
                  {c.title}
                </h3>
                <p className="mt-2.5 max-w-md text-[15px] leading-relaxed text-muted">{c.body}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ── FINAL CALL ───────────────────────────────────────── */}
      <section className="relative mt-40 overflow-hidden">
        <Cinematic src="/graphics/hall.jpg" position="50% 50%" className="opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,#080808,rgba(8,8,8,0.4)_40%,#080808)]" />
        <div className="wrap relative py-36 text-center sm:py-48">
          <p className="microlabel !text-muted"><Decrypt text="AUTHORISATION OPEN" /></p>
          <h2 className="display mx-auto mt-6 text-[17vw] text-white sm:text-[12vw] 2xl:text-[180px]">
            <Lines lines={["The briefing", <>is open<span className="text-red">.</span></>]} />
          </h2>
          <Reveal delay={0.3}>
            <p className="mx-auto mt-8 max-w-md text-[16px] leading-relaxed text-muted">
              Choose a theatre, file the briefing and deploy in under three minutes.
            </p>
            <Link href="/launch" className="btn btn-primary mt-10">
              Launch a token <ArrowRight size={14} />
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
}


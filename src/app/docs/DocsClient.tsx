"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { Reveal } from "@/components/motion";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode[] }> = [
  {
    id: "protocol",
    title: "How a launch works",
    body: [
      "The launch flow has five stages: choose a theatre, set your token's identity (name, ticker, image, description), add its socials, set launch parameters such as an optional dev buy, then review the final briefing and sign.",
      "Nothing is sent to chain until you sign that last step. Once the transaction confirms, the token is recorded in the GLOBAL registry and gets its own live page.",
    ],
  },
  {
    id: "theatres",
    title: "Theatres",
    body: [
      "Solana launches go through pump.fun's official program and SDK. Your token is a standard pump.fun coin: it trades on pump.fun's bonding curve, shows up on pump.fun itself, and graduates to PumpSwap when the curve completes.",
      "Robinhood Chain launches are handed off to Pons, the Robinhood Chain launchpad. GLOBAL opens the Pons launcher with your briefing; once your token exists you can import its address from your profile so it's tracked here.",
      "Dual deployment runs the Solana leg first, then hands you to Pons for the Robinhood leg with the same identity.",
    ],
  },
  {
    id: "fees",
    title: "Fees",
    body: [
      "Deploying on Solana costs roughly 0.03 SOL in rent and network fees, plus whatever you choose to spend on a dev buy. GLOBAL adds no platform fee on top.",
      "Trades on the pump.fun curve pay pump.fun's standard fee schedule. The creator share accrues to your wallet's creator vault on pump.fun — claim it any time from your profile. Robinhood Chain fees are set by Pons.",
    ],
  },
  {
    id: "graduation",
    title: "Graduation",
    body: [
      "A pump.fun token graduates when its bonding curve sells out. Liquidity then migrates to PumpSwap automatically and trading continues there. The curve progress shown across GLOBAL is read live from the token's bonding-curve account.",
    ],
  },
  {
    id: "registry",
    title: "The registry",
    body: [
      "Every token listed on GLOBAL is checked on-chain before it's accepted: the mint and its bonding curve (or the contract, on EVM) must exist. For pump.fun tokens the creator is read from the bonding curve itself, so nobody can list someone else's coin as their own.",
      "Listings are first-come and can't be renamed or re-attributed afterwards. Test-network launches are kept separate from mainnet ones.",
    ],
  },
  {
    id: "risk",
    title: "Risk",
    body: [
      "Launching or buying a token is high risk. Prices can go to zero, and on-chain transactions can't be reversed. Nothing on GLOBAL is financial advice — act on your own judgement.",
    ],
  },
];

export default function DocsClient() {
  const [active, setActive] = useState(SECTIONS[0].id);

  // scroll-spy: highlight the section currently in the reading band
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (hit) setActive(hit.target.id);
      },
      { rootMargin: "-20% 0px -65% 0px" },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) io.observe(el);
    });
    return () => io.disconnect();
  }, []);

  return (
    <div>
      <PageHeader
        code="FILE 05 — FIELD MANUAL"
        title="Docs"
        description="How GLOBAL launches work, what they cost and what happens after. Five minutes to read."
      />

      <div className="wrap grid gap-16 lg:grid-cols-[240px_1fr]">
        <nav className="hidden lg:sticky lg:top-28 lg:block lg:self-start">
          <p className="microlabel mb-5">Contents</p>
          <ul className="relative border-l border-line">
            {SECTIONS.map((s, i) => (
              <li key={s.id} className="relative">
                {active === s.id && (
                  <motion.span
                    layoutId="docs-spy"
                    className="absolute -left-px top-0 h-full w-[2px] bg-red"
                    transition={{ duration: 0.45, ease: [0.7, 0, 0.2, 1] }}
                  />
                )}
                <a
                  href={`#${s.id}`}
                  className={`block py-2 pl-5 text-[14px] transition-colors ${
                    active === s.id ? "text-white" : "text-muted hover:text-white"
                  }`}
                >
                  <span className="mono mr-3 text-[10px] text-faint">0{i + 1}</span>
                  {s.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="max-w-3xl">
          {SECTIONS.map((s, i) => (
            <section key={s.id} id={s.id} className="scroll-mt-28 border-t border-line pb-16 pt-10">
              <Reveal className="grid gap-6 sm:grid-cols-[110px_1fr]">
                <span
                  className="display text-[80px] leading-[0.8] text-transparent"
                  style={{ WebkitTextStroke: "1px rgba(244,242,238,0.3)" }}
                >
                  0{i + 1}
                </span>
                <div>
                  <h2 className="display-md text-[40px] text-white sm:text-[48px]">{s.title}</h2>
                  {s.body.map((p, j) => (
                    <p key={j} className="mt-5 text-[16px] leading-[1.8] text-muted">
                      {p}
                    </p>
                  ))}
                </div>
              </Reveal>
            </section>
          ))}

          <Reveal>
            <Link href="/launch" className="row-wipe group flex items-center justify-between gap-6 border-y border-line-strong px-2 py-10">
              <span>
                <span className="row-dim mono block text-[10px] tracking-[0.2em] text-faint">READY?</span>
                <span className="display-md mt-2 block text-[40px] text-white">Launch a token</span>
              </span>
              <ArrowRight size={30} className="text-red transition-all duration-500 group-hover:translate-x-2 group-hover:text-white" />
            </Link>
          </Reveal>
        </div>
      </div>
    </div>
  );
}

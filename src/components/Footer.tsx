import Link from "next/link";
import Logo from "./Logo";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL } from "@/lib/evm/config";

const COLS = [
  {
    title: "Platform",
    links: [
      { label: "Launch a token", href: "/launch" },
      { label: "Explore", href: "/explore" },
      { label: "Leaderboard", href: "/leaderboard" },
      { label: "Analytics", href: "/command" },
    ],
  },
  {
    title: "Theatres",
    links: [
      { label: "Solana · pump.fun", href: "/explore?chain=SOLANA" },
      { label: "Robinhood · Pons", href: "/explore?chain=ROBINHOOD" },
      { label: "Creator fees", href: "/profile" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "How launches work", href: "/docs#protocol" },
      { label: "Fees", href: "/docs#fees" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-32 border-t border-line">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-16 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 text-white">
            <Logo />
            <span className="text-sm font-semibold tracking-[0.32em]">GLOBAL</span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
            Launch a token on Solana or Robinhood Chain from one briefing. Every
            listing is verified on-chain.
          </p>
          <p className="microlabel mt-6">LAUNCH GLOBAL.</p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="microlabel mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="group inline-flex items-center gap-0 text-[13px] text-muted transition-all duration-300 hover:gap-1.5 hover:text-white"
                  >
                    <span className="h-px w-0 bg-primary transition-all duration-300 group-hover:w-2.5" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line">
        <div className="mono mx-auto flex w-full max-w-[1440px] flex-wrap items-center gap-x-6 gap-y-2 px-5 py-4 text-[10px] tracking-[0.14em] text-faint sm:px-8 lg:px-12">
          <span>© 2026 GLOBAL NETWORK</span>
          <span>SOLANA {SOLANA_CLUSTER.toUpperCase()}</span>
          <span>EVM {EVM_NETWORK_LABEL}</span>
          <span className="ml-auto hidden sm:inline">NOT FINANCIAL ADVICE — TOKENS ARE HIGH RISK</span>
        </div>
      </div>
    </footer>
  );
}

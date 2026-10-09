import Link from "next/link";
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
    <footer className="relative z-10 mt-40 overflow-hidden border-t border-line">
      <div className="wrap grid gap-12 py-16 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <p className="microlabel flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-red" /> GLOBAL // END OF FILE
          </p>
          <p className="display-md mt-5 max-w-sm text-[32px] text-white">
            Launch anywhere. <span className="text-faint">One briefing, two chains.</span>
          </p>
          <Link href="/launch" className="btn btn-primary btn-sm mt-8">
            Launch a token →
          </Link>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="microlabel mb-5">{col.title}</p>
            <ul className="space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="link-wipe text-[14px] text-muted">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* the wordmark — spans the full width */}
      <div className="wrap select-none" aria-hidden>
        <p className="display -mb-[0.12em] text-center text-[33vw] leading-[0.8] text-[rgba(244,242,238,0.06)] 2xl:text-[470px]">
          GLOBAL
        </p>
      </div>

      <div className="border-t border-line">
        <div className="wrap mono flex flex-wrap items-center gap-x-6 gap-y-2 py-4 text-[10px] tracking-[0.16em] text-faint">
          <span>© 2026 GLOBAL NETWORK</span>
          <span>SOLANA {SOLANA_CLUSTER.toUpperCase()}</span>
          <span>EVM {EVM_NETWORK_LABEL}</span>
          <span className="ml-auto hidden sm:inline">NOT FINANCIAL ADVICE — TOKENS ARE HIGH RISK</span>
        </div>
      </div>
    </footer>
  );
}

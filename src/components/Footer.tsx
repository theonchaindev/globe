import Link from "next/link";
import Logo from "./Logo";

const COLS = [
  {
    title: "Platform",
    links: [
      { label: "Launch", href: "/launch" },
      { label: "Explore", href: "/explore" },
      { label: "Command Centre", href: "/command" },
      { label: "Leaderboard", href: "/leaderboard" },
    ],
  },
  {
    title: "Network",
    links: [
      { label: "Solana Theatre", href: "/explore?chain=SOLANA" },
      { label: "Robinhood Theatre", href: "/explore?chain=ROBINHOOD" },
      { label: "Treasury", href: "/command" },
      { label: "Status", href: "/command" },
    ],
  },
  {
    title: "Intelligence",
    links: [
      { label: "Documentation", href: "/docs" },
      { label: "Deployment Protocol", href: "/docs" },
      { label: "Risk Framework", href: "/docs" },
      { label: "Graduation Criteria", href: "/docs" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-28 border-t border-line">
      <div className="mx-auto grid w-full max-w-[1440px] gap-10 px-5 py-14 sm:grid-cols-2 sm:px-8 lg:grid-cols-5 lg:px-12">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5 text-white">
            <Logo />
            <span className="text-sm font-semibold tracking-[0.32em]">GLOBAL</span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted">
            Intelligence-grade launch infrastructure. Deploy tokens worldwide
            through a secure global network.
          </p>
          <p className="microlabel mt-6">LAUNCH GLOBAL.</p>
        </div>
        {COLS.map((col) => (
          <div key={col.title}>
            <p className="microlabel mb-4">{col.title}</p>
            <ul className="space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className="text-[13px] text-muted transition-colors hover:text-white">
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
          <span>NODE: LDN-04</span>
          <span>UPTIME 99.98%</span>
          <span className="hidden sm:inline">SHA-256 // E3B0C44298FC1C14</span>
          <span className="ml-auto flex items-center gap-1.5">
            <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
            ALL SYSTEMS NOMINAL
          </span>
        </div>
      </div>
    </footer>
  );
}

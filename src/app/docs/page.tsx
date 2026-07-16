import Link from "next/link";
import { ArrowRight } from "lucide-react";

export const metadata = { title: "Documentation — GLOBAL" };

const SECTIONS = [
  {
    id: "protocol",
    title: "Deployment Protocol",
    body: [
      "Every launch on GLOBAL follows the same five-stage protocol: theatre selection, mission identity, communications verification, parameter configuration and final authorisation. A mission dossier is generated at filing and permanently anchored on-chain at deployment.",
      "Deployments are co-signed by the global relay mesh — fourteen nodes across six continents — before the contract is considered live. Median relay confirmation is under 800 milliseconds.",
    ],
  },
  {
    id: "clearance",
    title: "Clearance Grades",
    body: [
      "Missions receive a clearance grade from LEVEL I to LEVEL V based on verified communications channels, agent history, allocation structure and contract audit posture. Higher clearance unlocks placement on curated intelligence surfaces.",
      "Clearance is re-evaluated continuously. A mission that adds a transfer tax, concentrates supply or loses channel verification is downgraded automatically and flagged in the intel feed.",
    ],
  },
  {
    id: "risk",
    title: "Risk Framework",
    body: [
      "Each mission carries a live risk rating — LOW, MODERATE, ELEVATED or SEVERE — computed from holder concentration, liquidity depth relative to market cap, agent allocation vesting status and anomaly detection across the deployment's transaction graph.",
      "Ratings are advisory intelligence, not investment advice. Operatives act on their own authority.",
    ],
  },
  {
    id: "graduation",
    title: "Graduation Criteria",
    body: [
      "A mission graduates when its bonding curve reaches the funding target. At graduation, curve liquidity migrates to a public venue and the LP position is permanently locked. Mint authority is revoked at deployment for all missions, without exception.",
      "Missions that fail to graduate within the operational window are marked FAILED and operative capital is returned minus network fees.",
    ],
  },
  {
    id: "theatres",
    title: "Theatres",
    body: [
      "GLOBAL currently operates two deployment theatres: Solana, the high-throughput theatre with sub-second finality, and Robinhood Chain, the regulated-adjacent theatre with direct retail distribution surface. A single mission file deploys to either theatre with identical parameters and audit trail.",
    ],
  },
];

export default function DocsPage() {
  return (
    <div className="grid gap-12 py-10 lg:grid-cols-[220px_1fr]">
      <nav className="lg:sticky lg:top-24 lg:self-start">
        <p className="microlabel mb-4">FIELD MANUAL</p>
        <ul className="space-y-2">
          {SECTIONS.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-[13px] text-muted transition-colors hover:text-white">
                {s.title}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <div className="max-w-2xl">
        <p className="microlabel mb-2">DOCUMENTATION — REV 7.2</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Field Manual</h1>
        <p className="mt-3 text-[14px] leading-relaxed text-muted">
          Operating procedures for the GLOBAL deployment network. Read before
          filing your first mission.
        </p>

        {SECTIONS.map((s) => (
          <section key={s.id} id={s.id} className="mt-12 scroll-mt-24">
            <h2 className="text-lg font-semibold text-white">{s.title}</h2>
            {s.body.map((p, i) => (
              <p key={i} className="mt-3 text-[14px] leading-relaxed text-muted">
                {p}
              </p>
            ))}
          </section>
        ))}

        <div className="panel-elevated mt-14 flex flex-wrap items-center justify-between gap-4 p-6">
          <div>
            <p className="text-[15px] font-semibold text-white">Ready to deploy?</p>
            <p className="mt-1 text-[13px] text-muted">File a mission briefing in under three minutes.</p>
          </div>
          <Link
            href="/launch"
            className="flex h-10 items-center gap-2 rounded-md bg-primary px-5 text-[13px] font-semibold text-black transition-all hover:brightness-110"
          >
            Deploy Mission <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </div>
  );
}

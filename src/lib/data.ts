export type Chain = "SOLANA" | "ROBINHOOD";
export type MissionStatus = "ACTIVE" | "COMPLETE" | "CLASSIFIED" | "FAILED";
export type Risk = "LOW" | "MODERATE" | "ELEVATED" | "SEVERE";

export interface Mission {
  id: string; // MISSION-04271
  slug: string;
  name: string;
  ticker: string;
  chain: Chain;
  agent: string; // creator codename
  agentWallet: string;
  description: string;
  category: string;
  status: MissionStatus;
  clearance: "LEVEL I" | "LEVEL II" | "LEVEL III" | "LEVEL IV" | "LEVEL V";
  risk: Risk;
  fundingPct: number; // 0-100
  raised: number; // USD
  target: number; // USD
  liquidity: number;
  marketCap: number;
  volume24h: number;
  holders: number;
  ageMinutes: number;
  change24h: number;
  verified: boolean;
  graduated: boolean;
  coords: { lat: number; lon: number; label: string };
  hue: number; // token sigil color
  operativeScore: number;
}

const AGENTS = [
  "CIPHER", "MERIDIAN", "VANTAGE", "OBSIDIAN", "HALCYON", "PARALLAX",
  "SENTINEL", "AURELIUS", "KESTREL", "NOCTURNE", "ZENITH", "ARBITER",
  "LODESTAR", "TESSERACT", "VERTIGO", "PALADIN", "ECHELON", "SOLSTICE",
];

const CITIES: Array<{ lat: number; lon: number; label: string }> = [
  { lat: 51.5, lon: -0.12, label: "LONDON" },
  { lat: 40.71, lon: -74.0, label: "NEW YORK" },
  { lat: 35.68, lon: 139.69, label: "TOKYO" },
  { lat: 1.35, lon: 103.82, label: "SINGAPORE" },
  { lat: 25.2, lon: 55.27, label: "DUBAI" },
  { lat: 47.37, lon: 8.54, label: "ZURICH" },
  { lat: 22.28, lon: 114.16, label: "HONG KONG" },
  { lat: -33.86, lon: 151.2, label: "SYDNEY" },
  { lat: 52.52, lon: 13.4, label: "BERLIN" },
  { lat: 37.77, lon: -122.42, label: "SAN FRANCISCO" },
  { lat: 43.65, lon: -79.38, label: "TORONTO" },
  { lat: 59.33, lon: 18.07, label: "STOCKHOLM" },
  { lat: -23.55, lon: -46.63, label: "SAO PAULO" },
  { lat: 19.08, lon: 72.88, label: "MUMBAI" },
  { lat: 37.57, lon: 126.98, label: "SEOUL" },
  { lat: 48.86, lon: 2.35, label: "PARIS" },
];

interface Seed {
  name: string;
  ticker: string;
  chain: Chain;
  category: string;
  status: MissionStatus;
  desc: string;
}

const SEEDS: Seed[] = [
  { name: "Meridian Protocol", ticker: "MRDN", chain: "SOLANA", category: "Infrastructure", status: "ACTIVE", desc: "Cross-border settlement layer routing stable liquidity through verified custody corridors across fourteen jurisdictions." },
  { name: "Blacksite Capital", ticker: "BLKS", chain: "ROBINHOOD", category: "Finance", status: "ACTIVE", desc: "Permissioned yield desk aggregating institutional flow with on-chain attestation of every position." },
  { name: "Ionosphere", ticker: "IONO", chain: "SOLANA", category: "DePIN", status: "COMPLETE", desc: "Decentralised atmospheric sensor grid streaming verified telemetry to weather and aviation markets." },
  { name: "Silent Accord", ticker: "ACRD", chain: "SOLANA", category: "Privacy", status: "CLASSIFIED", desc: "Zero-knowledge coordination layer for multi-party treasury operations. Details restricted to cleared holders." },
  { name: "Northgrid Energy", ticker: "NGRD", chain: "ROBINHOOD", category: "Energy", status: "ACTIVE", desc: "Tokenised baseload capacity contracts settled hourly against Nordic grid oracles." },
  { name: "Vantage Array", ticker: "VNTG", chain: "SOLANA", category: "AI", status: "ACTIVE", desc: "Distributed inference network leasing idle datacentre capacity to model operators under SLA-backed escrow." },
  { name: "Courier Nine", ticker: "CRNR", chain: "SOLANA", category: "Logistics", status: "COMPLETE", desc: "Freight-forwarding settlement rail with customs-event oracles across nine trade lanes." },
  { name: "Deep Harbor", ticker: "HRBR", chain: "ROBINHOOD", category: "RWA", status: "ACTIVE", desc: "Fractionalised port-infrastructure revenue streams with quarterly audited distributions." },
  { name: "Polar Vector", ticker: "PLRV", chain: "SOLANA", category: "DePIN", status: "FAILED", desc: "Arctic fibre-route capacity market. Mission aborted at 41% funding after route survey shortfall." },
  { name: "Aurelian Reserve", ticker: "AURL", chain: "SOLANA", category: "Finance", status: "ACTIVE", desc: "Gold-basket reserve instrument with continuous proof-of-custody attestations from three vaults." },
  { name: "Signal Garden", ticker: "SGNL", chain: "ROBINHOOD", category: "Social", status: "ACTIVE", desc: "Reputation-weighted intelligence marketplace where verified analysts stake on their own calls." },
  { name: "Kessler Watch", ticker: "KSLR", chain: "SOLANA", category: "Space", status: "ACTIVE", desc: "Orbital-debris tracking bounty network feeding conjunction data to satellite operators." },
  { name: "Quiet Meridian", ticker: "QMRD", chain: "SOLANA", category: "Privacy", status: "CLASSIFIED", desc: "Confidential transfer corridor for institutional counterparties. Access on a need-to-know basis." },
  { name: "Ledger of Nations", ticker: "LGDN", chain: "ROBINHOOD", category: "RWA", status: "COMPLETE", desc: "Sovereign-bond basket tokenisation with T+0 settlement and continuous NAV publication." },
  { name: "Halcyon Fleet", ticker: "HLCN", chain: "SOLANA", category: "Logistics", status: "ACTIVE", desc: "Maritime charter-rate index instrument settled against verified AIS movement data." },
  { name: "Ember Cartel", ticker: "EMBR", chain: "SOLANA", category: "Gaming", status: "FAILED", desc: "Extraction-shooter economy token. Deployment terminated after studio failed final verification." },
  { name: "Sable Exchange", ticker: "SBLE", chain: "ROBINHOOD", category: "Finance", status: "ACTIVE", desc: "Dark-pool style batch auction venue with MEV-resistant sealed order flow." },
  { name: "Terra Cipher", ticker: "TCPH", chain: "SOLANA", category: "Infrastructure", status: "ACTIVE", desc: "Geospatial data availability layer anchoring survey-grade positioning proofs on-chain." },
];

function prng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1103515245 + 12345) % 2147483648;
    return s / 2147483648;
  };
}

const rand = prng(90210);

function pick<T>(arr: T[], r: number): T {
  return arr[Math.floor(r * arr.length) % arr.length];
}

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function wallet(r: () => number): string {
  let out = "";
  for (let i = 0; i < 44; i++) out += B58[Math.floor(r() * B58.length)];
  return out;
}

export const MISSIONS: Mission[] = SEEDS.map((s, i) => {
  const r = prng(1000 + i * 77);
  const graduated = s.status === "COMPLETE";
  const failed = s.status === "FAILED";
  const fundingPct = graduated
    ? 100
    : failed
      ? Math.round(20 + r() * 40)
      : Math.round(18 + r() * 78);
  const target = Math.round((80 + r() * 400)) * 1000;
  const raised = Math.round((target * fundingPct) / 100);
  const marketCap = Math.round(raised * (2.2 + r() * (graduated ? 26 : 6)));
  const clearances = ["LEVEL I", "LEVEL II", "LEVEL III", "LEVEL IV", "LEVEL V"] as const;
  const risks: Risk[] = failed
    ? ["SEVERE"]
    : s.status === "CLASSIFIED"
      ? ["ELEVATED"]
      : ["LOW", "LOW", "MODERATE", "MODERATE", "ELEVATED"];
  return {
    id: `MISSION-${String(4200 + i * 37 + Math.floor(r() * 9)).padStart(5, "0")}`,
    slug: s.ticker.toLowerCase(),
    name: s.name,
    ticker: s.ticker,
    chain: s.chain,
    agent: AGENTS[i % AGENTS.length],
    agentWallet: wallet(r),
    description: s.desc,
    category: s.category,
    status: s.status,
    clearance: clearances[Math.floor(r() * 5)],
    risk: pick(risks, r()),
    fundingPct,
    raised,
    target,
    liquidity: Math.round(raised * (0.6 + r() * 0.8)),
    marketCap,
    volume24h: Math.round(marketCap * (0.05 + r() * 0.6)),
    holders: Math.round(120 + r() * 18000),
    ageMinutes: Math.round(12 + r() * 60 * 24 * 21),
    change24h: failed ? -(5 + r() * 60) : (r() - 0.35) * 40,
    verified: r() > 0.35,
    graduated,
    coords: CITIES[i % CITIES.length],
    hue: Math.floor(r() * 360),
    operativeScore: Math.round(400 + r() * 600),
  };
});

export const GLOBAL_STATS = {
  capitalRaised: MISSIONS.reduce((a, m) => a + m.raised, 0) * 9.7,
  deploymentsToday: 147,
  liveMissions: MISSIONS.filter((m) => m.status === "ACTIVE").length * 61,
  graduated: 12408,
  liquidityCreated: 918_400_000,
  dailyVolume: 74_210_000,
  successRate: 68.4,
  operatives: 41_209,
  uptimeDays: 412,
};

export interface FeedEvent {
  time: string;
  type: "DEPLOY" | "BUY" | "SELL" | "GRADUATE" | "INTEL";
  text: string;
  chain: Chain;
}

export const FEED: FeedEvent[] = [
  { time: "14:32:07", type: "DEPLOY", text: "MISSION-04863 deployed — theatre SOLANA, sector INFRASTRUCTURE", chain: "SOLANA" },
  { time: "14:31:52", type: "BUY", text: "Operative 7Hx…kQ2f acquired 4.2 SOL of $VNTG", chain: "SOLANA" },
  { time: "14:31:40", type: "GRADUATE", text: "MISSION-04422 ($IONO) graduated — liquidity locked, clearance lifted", chain: "SOLANA" },
  { time: "14:31:18", type: "BUY", text: "Operative 0x9c…44aE acquired $18.4K of $HRBR", chain: "ROBINHOOD" },
  { time: "14:30:55", type: "INTEL", text: "Risk rating for $SGNL revised LOW → MODERATE by network consensus", chain: "ROBINHOOD" },
  { time: "14:30:31", type: "SELL", text: "Operative Fq2…9xLm liquidated $6.1K of $MRDN", chain: "SOLANA" },
  { time: "14:30:04", type: "DEPLOY", text: "MISSION-04862 deployed — theatre ROBINHOOD, sector FINANCE", chain: "ROBINHOOD" },
  { time: "14:29:47", type: "BUY", text: "Operative 3nT…Wd8p acquired 12.0 SOL of $AURL", chain: "SOLANA" },
  { time: "14:29:22", type: "INTEL", text: "Custody attestation #2,204 verified for $AURL — three vaults nominal", chain: "SOLANA" },
  { time: "14:28:58", type: "BUY", text: "Operative 0x4f…b21C acquired $9.8K of $LGDN", chain: "ROBINHOOD" },
];

// Deterministic price series per mission
export function priceSeries(seed: number, points = 96): Array<{ t: number; p: number; v: number }> {
  const r = prng(seed * 999 + 7);
  let p = 0.4 + r() * 2;
  const out = [];
  for (let i = 0; i < points; i++) {
    const drift = (r() - 0.46) * 0.09;
    p = Math.max(0.01, p * (1 + drift));
    out.push({ t: i, p: +p.toFixed(5), v: Math.round(r() * 900 + 60) });
  }
  return out;
}

export function holderDistribution(seed: number) {
  const r = prng(seed * 31 + 3);
  const rows = [];
  let remaining = 42 + r() * 18;
  for (let i = 0; i < 8; i++) {
    const share = i === 7 ? remaining : +(remaining * (0.18 + r() * 0.22)).toFixed(2);
    remaining = +(remaining - share).toFixed(2);
    rows.push({ wallet: wallet(r), pct: share, tag: i === 0 ? "LIQUIDITY POOL" : i === 1 ? "AGENT" : "" });
  }
  return rows;
}

export const OPERATIVES = MISSIONS.map((m, i) => ({
  rank: i + 1,
  mission: m,
  capitalRaised: m.raised,
  marketCap: m.marketCap,
  volume: m.volume24h,
  graduation: m.graduated ? 100 : m.fundingPct,
  score: m.operativeScore,
})).sort((a, b) => b.score - a.score).map((o, i) => ({ ...o, rank: i + 1 }));

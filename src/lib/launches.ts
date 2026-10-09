"use client";

/**
 * Mission registry. The shared source of truth is Postgres behind
 * /api/launches; localStorage is this browser's cache and outbox — a launch
 * is saved locally first, then published (with retries, since a fresh mint
 * can lag behind the RPC). Any local record the server doesn't know yet is
 * re-published on the next read, which also migrates pre-registry launches.
 */

export interface LaunchRecord {
  id: string; // pool address (SOL) or contract address (ETH)
  chain: "SOLANA" | "ROBINHOOD";
  name: string;
  ticker: string;
  /** SOL: pool address. ETH: token contract address. */
  address: string;
  /** SOL only: token mint. */
  mint?: string;
  /** SOL only: curve config account. */
  config?: string;
  /** EVM venue: legacy bonding-curve contract or Uniswap V2 pool. Old records = curve. */
  venue?: "curve" | "uniswap" | "pumpfun" | "pons";
  /** Uniswap only: the V2 pair address. */
  pair?: string;
  txSignature: string;
  creator: string; // wallet that launched it
  /** Small square PNG data URL uploaded at launch. */
  image?: string;
  tradingFeeBps: number;
  creatorFeeShare: number;
  gradMcap: number; // SOL or ETH
  createdAt: number;
}

const KEY = "globe.launches.v1";

export function loadLaunches(): LaunchRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as LaunchRecord[];
  } catch {
    return [];
  }
}

function saveLocal(rec: LaunchRecord) {
  const all = loadLaunches().filter((l) => l.id !== rec.id);
  localStorage.setItem(KEY, JSON.stringify([rec, ...all]));
}

const inflight = new Set<string>();

/** POST to the shared registry, retrying while the chain catches up. */
async function publish(rec: LaunchRecord, attempts = 5): Promise<void> {
  if (inflight.has(rec.id)) return;
  inflight.add(rec.id);
  try {
    for (let i = 0; i < attempts; i++) {
      try {
        const res = await fetch("/api/launches", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(rec),
        });
        if (res.ok) return;
      } catch {
        // network blip — retry
      }
      await new Promise((r) => setTimeout(r, 3000 * (i + 1)));
    }
  } finally {
    inflight.delete(rec.id);
  }
}

export function recordLaunch(r: Omit<LaunchRecord, "id" | "createdAt">): LaunchRecord {
  const rec: LaunchRecord = { ...r, id: r.address, createdAt: Date.now() };
  saveLocal(rec);
  void publish(rec);
  return rec;
}

/**
 * Every mission on the platform: the shared registry merged with this
 * browser's records. Falls back to local-only if the registry is down.
 */
export async function fetchAllLaunches(): Promise<LaunchRecord[]> {
  const local = loadLaunches();
  let remote: LaunchRecord[];
  try {
    const res = await fetch("/api/launches", { cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    remote = ((await res.json()) as { launches: LaunchRecord[] }).launches;
  } catch {
    return local;
  }
  const known = new Set(remote.map((l) => l.id));
  const unsynced = local.filter((l) => !known.has(l.id));
  unsynced.forEach((l) => void publish(l, 1));
  return [...unsynced, ...remote].sort((a, b) => b.createdAt - a.createdAt);
}

/** One mission — this browser's copy first, then the shared registry. */
export async function fetchLaunch(id: string): Promise<LaunchRecord | null> {
  const local = loadLaunches().find((l) => l.id === id);
  if (local) return local;
  try {
    const res = await fetch(`/api/launches?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    if (!res.ok) return null;
    return ((await res.json()) as { launch: LaunchRecord | null }).launch;
  } catch {
    return null;
  }
}

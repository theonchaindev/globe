"use client";

/**
 * Local registry of missions launched from this browser — the creator's
 * record of real deployments on both theatres. A shared backend indexer
 * replaces this at mainnet; for now discovery is per-device.
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
  txSignature: string;
  creator: string; // wallet that launched it
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

export function recordLaunch(r: Omit<LaunchRecord, "id" | "createdAt">): LaunchRecord {
  const rec: LaunchRecord = { ...r, id: r.address, createdAt: Date.now() };
  const all = loadLaunches().filter((l) => l.id !== rec.id);
  localStorage.setItem(KEY, JSON.stringify([rec, ...all]));
  return rec;
}

export function getLaunch(id: string): LaunchRecord | null {
  return loadLaunches().find((l) => l.id === id) ?? null;
}

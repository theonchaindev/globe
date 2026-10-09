import { neon } from "@neondatabase/serverless";
import { Connection, PublicKey } from "@solana/web3.js";
import { JsonRpcProvider } from "ethers";
import { PumpSdk, bondingCurvePda } from "@pump-fun/pump-sdk";
import { SOLANA_RPC, SOLANA_CLUSTER } from "@/lib/meteora/config";
import { EVM_RPC, EVM_NETWORK_LABEL } from "@/lib/evm/config";
import { ROBINHOOD_RPC } from "@/lib/evm/robinhood";
import type { LaunchRecord } from "@/lib/launches";

/**
 * Shared mission registry — every launch from every device, in Postgres.
 * Records are partitioned by network so devnet / Sepolia test launches never
 * leak into a mainnet listing once the RPCs are pointed at production.
 */

const sql = neon(process.env.DATABASE_URL!);
const TOKEN_PROGRAMS = new Set([
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
]);

const MAX_IMAGE_BYTES = 200_000;

export function networkFor(r: Pick<LaunchRecord, "chain" | "venue">): string {
  if (r.chain === "SOLANA") return `solana:${SOLANA_CLUSTER}`;
  if (r.venue === "pons") return "evm:robinhood";
  return `evm:${EVM_NETWORK_LABEL.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
}

/** Networks the current deployment lists — one per theatre. */
function activeNetworks(): string[] {
  return [
    networkFor({ chain: "SOLANA" }),
    networkFor({ chain: "ROBINHOOD" }),
    networkFor({ chain: "ROBINHOOD", venue: "pons" }),
  ];
}

let ready: Promise<unknown> | null = null;
function ensureTable() {
  ready ??= sql`
    CREATE TABLE IF NOT EXISTS launches (
      network    text   NOT NULL,
      id         text   NOT NULL,
      record     jsonb  NOT NULL,
      created_at bigint NOT NULL,
      PRIMARY KEY (network, id)
    )`.catch((e) => {
    ready = null;
    throw e;
  });
  return ready;
}

export async function listLaunches(): Promise<LaunchRecord[]> {
  await ensureTable();
  const rows = await sql`
    SELECT record FROM launches
    WHERE network = ANY(${activeNetworks()})
    ORDER BY created_at DESC
    LIMIT 500`;
  return rows.map((r) => r.record as LaunchRecord);
}

export async function findLaunch(id: string): Promise<LaunchRecord | null> {
  await ensureTable();
  const rows = await sql`
    SELECT record FROM launches
    WHERE id = ${id} AND network = ANY(${activeNetworks()})
    LIMIT 1`;
  return (rows[0]?.record as LaunchRecord) ?? null;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

/** Whitelist + clamp the client payload into a clean record. */
export function sanitize(body: unknown): LaunchRecord {
  const b = (body ?? {}) as Record<string, unknown>;
  const chain = b.chain === "ROBINHOOD" ? "ROBINHOOD" : b.chain === "SOLANA" ? "SOLANA" : null;
  if (!chain) throw new Error("chain must be SOLANA or ROBINHOOD");
  const venues = ["curve", "uniswap", "pumpfun", "pons"] as const;
  const venue = venues.find((v) => v === b.venue);
  const address = str(b.address, 64);
  if (!address) throw new Error("address required");
  const name = str(b.name, 32);
  const ticker = str(b.ticker, 10).toUpperCase();
  if (!name || !ticker) throw new Error("name and ticker required");

  let image = typeof b.image === "string" ? b.image : undefined;
  if (image && (!image.startsWith("data:image/") || image.length > MAX_IMAGE_BYTES)) image = undefined;

  return {
    id: address,
    chain,
    venue,
    name,
    ticker,
    address,
    mint: str(b.mint, 64) || undefined,
    config: str(b.config, 64) || undefined,
    pair: str(b.pair, 64) || undefined,
    txSignature: str(b.txSignature, 128),
    creator: str(b.creator, 64),
    image,
    tradingFeeBps: num(b.tradingFeeBps),
    creatorFeeShare: num(b.creatorFeeShare),
    gradMcap: num(b.gradMcap),
    createdAt: Math.min(num(b.createdAt) || Date.now(), Date.now()),
  };
}

/**
 * Reject records whose token doesn't actually exist on its chain. For pump.fun
 * the creator is overwritten with the one in the bonding curve, so nobody can
 * squat someone else's coin under their own wallet.
 */
export async function verifyOnChain(r: LaunchRecord): Promise<LaunchRecord> {
  if (r.chain === "SOLANA") {
    let key: PublicKey;
    try {
      key = new PublicKey(r.address);
    } catch {
      throw new Error("invalid Solana address");
    }
    const connection = new Connection(SOLANA_RPC, "confirmed");
    const info = await connection.getAccountInfo(key);
    if (!info) throw new Error(`no account at that address on ${SOLANA_CLUSTER}`);
    if (r.venue !== "pumpfun") return r;
    if (!TOKEN_PROGRAMS.has(info.owner.toBase58())) throw new Error("address is not a token mint");
    const curveInfo = await connection.getAccountInfo(bondingCurvePda(key));
    if (!curveInfo) throw new Error("no pump.fun bonding curve for that mint");
    const curve = new PumpSdk().decodeBondingCurve(curveInfo);
    return { ...r, mint: r.address, creator: curve.creator.toBase58() };
  }
  if (!/^0x[0-9a-fA-F]{40}$/.test(r.address)) throw new Error("invalid EVM address");
  // Pons tokens live on Robinhood Chain itself, not the EVM stand-in network
  const rpc = r.venue === "pons" ? ROBINHOOD_RPC : EVM_RPC;
  const code = await new JsonRpcProvider(rpc).getCode(r.address);
  if (code === "0x") throw new Error("no contract at that address");
  return r;
}

/**
 * Insert-only: the first record for an address wins, so a later caller can
 * never rename or re-attribute someone else's mission. Returns the stored row.
 */
export async function insertLaunch(r: LaunchRecord): Promise<LaunchRecord> {
  await ensureTable();
  const network = networkFor(r);
  await sql`
    INSERT INTO launches (network, id, record, created_at)
    VALUES (${network}, ${r.id}, ${JSON.stringify(r)}::jsonb, ${r.createdAt})
    ON CONFLICT (network, id) DO NOTHING`;
  const rows = await sql`SELECT record FROM launches WHERE network = ${network} AND id = ${r.id}`;
  return rows[0].record as LaunchRecord;
}

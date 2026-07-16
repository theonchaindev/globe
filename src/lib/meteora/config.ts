import { PublicKey } from "@solana/web3.js";

/**
 * Network configuration for the Solana theatre.
 *
 * Defaults to devnet so launches are safe to test end-to-end.
 * Point NEXT_PUBLIC_SOLANA_RPC at a mainnet RPC to go live.
 */
export const SOLANA_RPC =
  process.env.NEXT_PUBLIC_SOLANA_RPC ?? "https://api.devnet.solana.com";

export const SOLANA_CLUSTER: "devnet" | "mainnet-beta" =
  SOLANA_RPC.includes("devnet") ? "devnet" : "mainnet-beta";

/** Native SOL mint — the quote asset for every GLOBAL launch. */
export const SOL_MINT = new PublicKey(
  "So11111111111111111111111111111111111111112",
);

/**
 * Platform treasury — receives the partner share of trading fees and
 * any curve leftover. Override with your own key in production.
 */
export const PLATFORM_TREASURY = process.env.NEXT_PUBLIC_PLATFORM_TREASURY
  ? new PublicKey(process.env.NEXT_PUBLIC_PLATFORM_TREASURY)
  : null; // null → fee claimer falls back to the creator wallet

export function explorerTx(sig: string): string {
  return `https://solscan.io/tx/${sig}${SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
}

export function explorerAddress(addr: string): string {
  return `https://solscan.io/account/${addr}${SOLANA_CLUSTER === "devnet" ? "?cluster=devnet" : ""}`;
}

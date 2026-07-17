/**
 * EVM configuration for the Robinhood theatre.
 *
 * Robinhood Chain (Arbitrum Orbit) — point NEXT_PUBLIC_EVM_RPC at its RPC
 * once you have an endpoint. Until then we default to Ethereum Sepolia as
 * the dev/test EVM network so dev wallets have live balances and faucets.
 */
export const EVM_RPC =
  process.env.NEXT_PUBLIC_EVM_RPC ?? "https://ethereum-sepolia-rpc.publicnode.com";

export const EVM_NETWORK_LABEL =
  process.env.NEXT_PUBLIC_EVM_NETWORK_LABEL ??
  (process.env.NEXT_PUBLIC_EVM_RPC ? "ROBINHOOD" : "SEPOLIA (STAND-IN)");

/** Platform fee address for EVM launches. Falls back to the creator. */
export const EVM_PLATFORM_TREASURY =
  process.env.NEXT_PUBLIC_EVM_PLATFORM_TREASURY ?? null;

const EXPLORER =
  process.env.NEXT_PUBLIC_EVM_EXPLORER ?? "https://sepolia.etherscan.io";

export function evmExplorerAddress(addr: string): string {
  return `${EXPLORER}/address/${addr}`;
}

export function evmExplorerTx(hash: string): string {
  return `${EXPLORER}/tx/${hash}`;
}

"use client";

import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import {
  DynamicBondingCurveClient,
  getCurrentPoint,
  getPriceFromSqrtPrice,
  TokenDecimal,
} from "@meteora-ag/dynamic-bonding-curve-sdk";

/**
 * Trading + state reads for missions launched on the Meteora Dynamic
 * Bonding Curve (Solana theatre). Signed by the connected wallet.
 */

export interface SolMissionState {
  pool: string;
  baseMint: string;
  creator: string;
  priceSol: number;
  quoteReserveSol: number;
  graduationSol: number;
  progressPct: number;
  graduated: boolean;
  creatorUnclaimedSol: number;
}

const LAMPORTS = 1e9;

function client(connection: Connection) {
  return DynamicBondingCurveClient.create(connection, "confirmed");
}

export async function readSolMission(
  connection: Connection,
  poolAddress: string,
): Promise<SolMissionState | null> {
  const c = client(connection);
  const pool = await c.state.getPool(poolAddress);
  if (!pool) return null;
  const ps = pool.poolState;
  const config = await c.state.getPoolConfig(ps.config);
  if (!config) return null;

  const price = getPriceFromSqrtPrice(
    ps.sqrtPrice,
    TokenDecimal.SIX,
    TokenDecimal.NINE,
  );

  const quoteReserveSol = ps.quoteReserve.toNumber() / LAMPORTS;
  const graduationSol = config.migrationQuoteThreshold.toNumber() / LAMPORTS;
  const graduated = ps.isMigrated !== 0;

  let creatorUnclaimedSol = 0;
  try {
    const fees = await c.state.getPoolFeeMetrics(poolAddress);
    creatorUnclaimedSol = fees.current.creatorQuoteFee.toNumber() / LAMPORTS;
  } catch {
    // fee metrics are best-effort
  }

  return {
    pool: poolAddress,
    baseMint: ps.baseMint.toBase58(),
    creator: ps.creator.toBase58(),
    priceSol: Number(price),
    quoteReserveSol,
    graduationSol,
    progressPct: Math.min(100, (quoteReserveSol / graduationSol) * 100),
    graduated,
    creatorUnclaimedSol,
  };
}

export interface SolQuote {
  amountOut: number;
  minimumAmountOut: BN;
  amountIn: BN;
}

/** Quote a swap. buy = SOL → token, sell = token → SOL. */
export async function quoteSolSwap(
  connection: Connection,
  poolAddress: string,
  amountIn: number, // SOL for buys, tokens for sells
  side: "buy" | "sell",
): Promise<SolQuote> {
  const c = client(connection);
  const pool = await c.state.getPool(poolAddress);
  if (!pool) throw new Error("Pool not found");
  const config = await c.state.getPoolConfig(pool.poolState.config);
  if (!config) throw new Error("Config not found");

  const decimalsIn = side === "buy" ? 9 : 6;
  const decimalsOut = side === "buy" ? 6 : 9;
  const amountInBN = new BN(Math.floor(amountIn * 10 ** decimalsIn).toString());
  const currentPoint = await getCurrentPoint(connection, config.activationType);

  const quote = c.pool.swapQuote({
    virtualPool: pool,
    config,
    swapBaseForQuote: side === "sell",
    amountIn: amountInBN,
    slippageBps: 100,
    hasReferral: false,
    eligibleForFirstSwapWithMinFee: false,
    currentPoint,
  });

  return {
    amountOut: quote.outputAmount.toNumber() / 10 ** decimalsOut,
    minimumAmountOut: quote.minimumAmountOut,
    amountIn: amountInBN,
  };
}

export async function solSwap(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>;
  },
  poolAddress: string,
  amountIn: number,
  side: "buy" | "sell",
): Promise<string> {
  const c = client(connection);
  const quote = await quoteSolSwap(connection, poolAddress, amountIn, side);

  const tx = await c.pool.swap({
    owner: wallet.publicKey,
    pool: new PublicKey(poolAddress),
    amountIn: quote.amountIn,
    minimumAmountOut: quote.minimumAmountOut,
    swapBaseForQuote: side === "sell",
    referralTokenAccount: null,
  });

  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;
  return wallet.sendTransaction(tx, connection);
}

/** Claim the creator's accumulated trading fees (quote side, SOL). */
export async function claimSolCreatorFees(
  connection: Connection,
  wallet: {
    publicKey: PublicKey;
    sendTransaction: (tx: Transaction, conn: Connection) => Promise<string>;
  },
  poolAddress: string,
): Promise<string> {
  const c = client(connection);
  const U64_MAX = new BN("18446744073709551615");
  const tx = await c.creator.claimCreatorTradingFee({
    creator: wallet.publicKey,
    payer: wallet.publicKey,
    pool: new PublicKey(poolAddress),
    maxBaseAmount: U64_MAX,
    maxQuoteAmount: U64_MAX,
  });
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;
  return wallet.sendTransaction(tx, connection);
}

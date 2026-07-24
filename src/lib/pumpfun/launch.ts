"use client";

import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import BN from "bn.js";
import {
  PumpSdk,
  OnlinePumpSdk,
  bondingCurvePda,
  newBondingCurve,
  getBuyTokenAmountFromSolAmount,
  getSellSolAmountFromTokenAmount,
  bondingCurveMarketCap,
} from "@pump-fun/pump-sdk";

/**
 * Solana theatre via pump.fun — launches go through the official pump.fun
 * program (same program ID on devnet and mainnet, verified on-chain), so
 * on mainnet the token appears on pump.fun itself and graduates to
 * PumpSwap. Trading rides the same bonding curve the pump.fun UI uses.
 */

const LAMPORTS = 1e9;
const TOKEN_DECIMALS = 1e6; // pump tokens are 6 decimals

const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");
const TOKEN_PROGRAM = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const TOKEN_2022_PROGRAM = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

/** createV2 mints under Token-2022; detect from the mint account owner. */
async function tokenProgramFor(connection: Connection, mint: PublicKey): Promise<PublicKey> {
  const info = await connection.getAccountInfo(mint, "confirmed");
  return info?.owner.equals(TOKEN_2022_PROGRAM) ? TOKEN_2022_PROGRAM : TOKEN_PROGRAM;
}

type WalletLike = {
  publicKey: PublicKey;
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: { signers?: Keypair[] },
  ) => Promise<string>;
};

async function sendAndConfirm(
  connection: Connection,
  wallet: WalletLike,
  tx: Transaction,
  signers: Keypair[],
  onStatus?: (s: string) => void,
): Promise<string> {
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = wallet.publicKey;

  onStatus?.("Awaiting wallet signature…");
  const signature = await wallet.sendTransaction(tx, connection, { signers });

  onStatus?.("Confirming on-chain…");
  const deadline = Date.now() + 120_000;
  let tick = 0;
  while (Date.now() < deadline) {
    try {
      const st = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });
      const s = st.value;
      if (s?.err) throw new Error(`ONCHAIN:${JSON.stringify(s.err)}`);
      if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) {
        return signature;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("ONCHAIN:")) {
        throw new Error(`Transaction failed on-chain: ${e.message.slice(8)} — tx ${signature}`);
      }
      // throttled — keep polling
    }
    if (tick % 4 === 3) {
      try {
        const h = await connection.getBlockHeight("confirmed");
        if (h > lastValidBlockHeight) {
          throw new Error("Transaction expired before confirmation — try again.");
        }
      } catch (e) {
        if (e instanceof Error && e.message.includes("expired")) throw e;
      }
    }
    tick++;
    await new Promise((r) => setTimeout(r, 2500));
  }
  throw new Error(`Confirmation timed out — check tx ${signature} on Solscan.`);
}

export interface PumpLaunchParams {
  name: string;
  symbol: string;
  uri: string;
  /** Optional first buy at launch, in SOL. 0 skips it. */
  devBuySol: number;
}

export interface PumpLaunchResult {
  signature: string;
  mint: string;
  bondingCurve: string;
}

export async function launchOnPumpfun(
  connection: Connection,
  wallet: WalletLike,
  p: PumpLaunchParams,
  onStatus?: (s: string) => void,
  onSignature?: (sig: string) => void,
): Promise<PumpLaunchResult> {
  onStatus?.("Checking balance…");
  const balance = await connection.getBalance(wallet.publicKey, "confirmed");
  const needed = (0.025 + p.devBuySol) * LAMPORTS;
  if (balance < needed) {
    const addr = wallet.publicKey.toBase58();
    throw new Error(
      `Connected wallet ${addr.slice(0, 6)}…${addr.slice(-6)} has ` +
        `${(balance / LAMPORTS).toFixed(4)} SOL — this launch needs ~${(needed / LAMPORTS).toFixed(3)} SOL ` +
        `(rent + fees${p.devBuySol ? ` + ${p.devBuySol} SOL dev buy` : ""}).`,
    );
  }

  onStatus?.("Building pump.fun transaction…");
  const online = new OnlinePumpSdk(connection);
  const sdk = new PumpSdk();
  const global = await online.fetchGlobal();
  const mintKeypair = Keypair.generate();

  const base = {
    mint: mintKeypair.publicKey,
    name: p.name.slice(0, 32),
    symbol: p.symbol.slice(0, 10),
    uri: p.uri,
    creator: wallet.publicKey,
    user: wallet.publicKey,
    mayhemMode: false,
  };

  const tx = new Transaction();
  if (p.devBuySol > 0) {
    const solAmount = new BN(Math.floor(p.devBuySol * LAMPORTS));
    const curve = newBondingCurve(global);
    const feeConfig = await online.fetchFeeConfig().catch(() => null);
    const amount = getBuyTokenAmountFromSolAmount({
      global,
      feeConfig,
      mintSupply: curve.tokenTotalSupply,
      bondingCurve: curve,
      amount: solAmount,
      quoteMint: SOL_MINT,
    });
    tx.add(
      ...(await sdk.createV2AndBuyInstructions({
        global,
        ...base,
        amount,
        solAmount,
      })),
    );
  } else {
    tx.add(await sdk.createV2Instruction(base));
  }

  const signature = await sendAndConfirm(connection, wallet, tx, [mintKeypair], onStatus);
  onSignature?.(signature);

  // wait for the curve account so the trading desk works immediately
  onStatus?.("Indexing bonding curve…");
  const curvePda = bondingCurvePda(mintKeypair.publicKey);
  for (let i = 0; i < 10; i++) {
    const info = await connection.getAccountInfo(curvePda, "confirmed").catch(() => null);
    if (info) break;
    await new Promise((r) => setTimeout(r, 1200));
  }

  return {
    signature,
    mint: mintKeypair.publicKey.toBase58(),
    bondingCurve: curvePda.toBase58(),
  };
}

export interface PumpMissionState {
  mint: string;
  creator: string;
  priceSol: number;
  marketCapSol: number;
  realSolReserves: number;
  progressPct: number;
  graduated: boolean;
  creatorVaultSol: number;
}

export async function readPumpMission(
  connection: Connection,
  mint: string,
): Promise<PumpMissionState | null> {
  const online = new OnlinePumpSdk(connection);
  const sdk = new PumpSdk();
  const mintPk = new PublicKey(mint);

  const info = await connection.getAccountInfo(bondingCurvePda(mintPk), "confirmed");
  if (!info) return null;
  const curve = sdk.decodeBondingCurve(info);
  const global = await online.fetchGlobal();

  const priceSol =
    curve.virtualTokenReserves.isZero()
      ? 0
      : (curve.virtualQuoteReserves.toNumber() / LAMPORTS) /
        (curve.virtualTokenReserves.toNumber() / TOKEN_DECIMALS);

  const mcap = bondingCurveMarketCap({
    mintSupply: curve.tokenTotalSupply,
    virtualQuoteReserves: curve.virtualQuoteReserves,
    virtualTokenReserves: curve.virtualTokenReserves,
  });

  const initialReal = global.initialRealTokenReserves as BN;
  const sold = initialReal.sub(curve.realTokenReserves);
  const progressPct = curve.complete
    ? 100
    : initialReal.isZero()
      ? 0
      : Math.min(100, (sold.toNumber() / initialReal.toNumber()) * 100);

  let creatorVaultSol = 0;
  try {
    creatorVaultSol = (await online.getCreatorVaultBalance(curve.creator)).toNumber() / LAMPORTS;
  } catch {
    // best effort
  }

  return {
    mint,
    creator: curve.creator.toBase58(),
    priceSol,
    marketCapSol: mcap.toNumber() / LAMPORTS,
    realSolReserves: curve.realQuoteReserves.toNumber() / LAMPORTS,
    progressPct,
    graduated: curve.complete,
    creatorVaultSol,
  };
}

export async function quotePumpSwap(
  connection: Connection,
  mint: string,
  amountIn: number, // SOL for buys, tokens for sells
  side: "buy" | "sell",
): Promise<number> {
  const online = new OnlinePumpSdk(connection);
  const sdk = new PumpSdk();
  const mintPk = new PublicKey(mint);
  const info = await connection.getAccountInfo(bondingCurvePda(mintPk), "confirmed");
  if (!info) throw new Error("Bonding curve not found");
  const curve = sdk.decodeBondingCurve(info);
  const global = await online.fetchGlobal();
  const feeConfig = await online.fetchFeeConfig().catch(() => null);

  if (side === "buy") {
    const out = getBuyTokenAmountFromSolAmount({
      global,
      feeConfig,
      mintSupply: curve.tokenTotalSupply,
      bondingCurve: curve,
      amount: new BN(Math.floor(amountIn * LAMPORTS)),
      quoteMint: SOL_MINT,
    });
    return out.toNumber() / TOKEN_DECIMALS;
  }
  const out = getSellSolAmountFromTokenAmount({
    global,
    feeConfig,
    mintSupply: curve.tokenTotalSupply,
    bondingCurve: curve,
    amount: new BN(Math.floor(amountIn * TOKEN_DECIMALS)),
  });
  return out.toNumber() / LAMPORTS;
}

export async function pumpSwap(
  connection: Connection,
  wallet: WalletLike,
  mint: string,
  amountIn: number,
  side: "buy" | "sell",
): Promise<string> {
  const online = new OnlinePumpSdk(connection);
  const sdk = new PumpSdk();
  const mintPk = new PublicKey(mint);
  const global = await online.fetchGlobal();

  const tokenProgram = await tokenProgramFor(connection, mintPk);
  const tx = new Transaction();
  if (side === "buy") {
    const { bondingCurveAccountInfo, bondingCurve, associatedUserAccountInfo } =
      await online.fetchBuyState(mintPk, wallet.publicKey, tokenProgram);
    const feeConfig = await online.fetchFeeConfig().catch(() => null);
    const solAmount = new BN(Math.floor(amountIn * LAMPORTS));
    const amount = getBuyTokenAmountFromSolAmount({
      global,
      feeConfig,
      mintSupply: bondingCurve.tokenTotalSupply,
      bondingCurve,
      amount: solAmount,
      quoteMint: SOL_MINT,
    });
    tx.add(
      ...(await sdk.buyInstructions({
        global,
        bondingCurveAccountInfo,
        bondingCurve,
        associatedUserAccountInfo,
        mint: mintPk,
        user: wallet.publicKey,
        amount,
        solAmount,
        slippage: 1,
        tokenProgram,
      })),
    );
  } else {
    const { bondingCurveAccountInfo, bondingCurve } = await online.fetchSellState(
      mintPk,
      wallet.publicKey,
      tokenProgram,
    );
    const feeConfig = await online.fetchFeeConfig().catch(() => null);
    const amount = new BN(Math.floor(amountIn * TOKEN_DECIMALS));
    const solAmount = getSellSolAmountFromTokenAmount({
      global,
      feeConfig,
      mintSupply: bondingCurve.tokenTotalSupply,
      bondingCurve,
      amount,
    });
    tx.add(
      ...(await sdk.sellInstructions({
        global,
        bondingCurveAccountInfo,
        bondingCurve,
        mint: mintPk,
        user: wallet.publicKey,
        amount,
        solAmount,
        slippage: 1,
        tokenProgram,
        mayhemMode: false,
      })),
    );
  }

  return sendAndConfirm(connection, wallet, tx, []);
}

/** Claim accrued creator fees from the pump.fun creator vault. */
export async function claimPumpCreatorFees(
  connection: Connection,
  wallet: WalletLike,
): Promise<string> {
  const online = new OnlinePumpSdk(connection);
  const ixs = await online.collectCoinCreatorFeeInstructions(wallet.publicKey);
  if (ixs.length === 0) throw new Error("Nothing to claim");
  const tx = new Transaction().add(...ixs);
  return sendAndConfirm(connection, wallet, tx, []);
}

export function pumpfunUrl(mint: string): string {
  return `https://pump.fun/coin/${mint}`;
}

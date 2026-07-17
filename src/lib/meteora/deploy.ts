import { Connection, Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  DynamicBondingCurveClient,
  buildCurveWithMarketCap,
  deriveDbcPoolAddress,
  ActivationType,
  BaseFeeMode,
  CollectFeeMode,
  MigrationFeeOption,
  MigrationOption,
  TokenAuthorityOption,
  TokenDecimal,
  TokenType,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PLATFORM_TREASURY, SOL_MINT } from "./config";

/** User-facing launch parameters collected by the Deploy Mission flow. */
export interface LaunchParams {
  name: string;
  symbol: string;
  /** Off-chain metadata URI (logo, description). */
  uri: string;
  /** Total token supply, whole tokens (e.g. 1_000_000_000). */
  totalSupply: number;
  /** Trading fee ("tax") in basis points, 25–500. Applied to every swap on the curve. */
  tradingFeeBps: number;
  /** Share of trading fees routed to the creator, 0–100 (%). Remainder goes to the platform. */
  creatorFeeShare: number;
  /** Enable Meteora's volatility-based dynamic fee on top of the base fee. */
  dynamicFee: boolean;
  /** Market cap (in SOL) at which the curve starts. */
  initialMarketCapSol: number;
  /** Market cap (in SOL) at which the mission graduates to a DAMM v2 pool. */
  graduationMarketCapSol: number;
  /** Creator allocation vested after graduation, % of supply (0–5). */
  creatorVestedPct: number;
}

export interface DeployResult {
  signature: string;
  baseMint: string;
  pool: string;
  config: string;
}

type WalletLike = {
  publicKey: PublicKey;
  sendTransaction: (
    tx: Transaction,
    connection: Connection,
    options?: { signers?: Keypair[] },
  ) => Promise<string>;
};

const DAY = 86_400;

/** Truncate a string to a UTF-8 byte budget without splitting characters. */
function clampBytes(s: string, maxBytes: number): string {
  const enc = new TextEncoder();
  if (enc.encode(s).length <= maxBytes) return s;
  let out = "";
  for (const ch of s) {
    if (enc.encode(out + ch).length > maxBytes) break;
    out += ch;
  }
  return out;
}

/**
 * Build the Meteora Dynamic Bonding Curve config from launch params and
 * submit a single createConfigAndPool transaction signed by the creator.
 *
 * The curve quotes in native SOL, migrates to DAMM v2 at the graduation
 * market cap, and permanently locks the migrated liquidity.
 */
export async function deployOnMeteora(
  connection: Connection,
  wallet: WalletLike,
  p: LaunchParams,
  onStatus?: (status: string) => void,
  onSignature?: (signature: string) => void,
): Promise<DeployResult> {
  const creator = wallet.publicKey;
  const feeClaimer = PLATFORM_TREASURY ?? creator;

  // the deploy creates several accounts — rent alone is ~0.03-0.05 SOL
  onStatus?.("Checking balance…");
  const balance = await connection.getBalance(creator, "confirmed");
  if (balance < 0.06 * 1e9) {
    throw new Error(
      `Wallet has ${(balance / 1e9).toFixed(4)} SOL — the deployment needs ~0.06 SOL ` +
        `for account rent and fees. Top up at faucet.solana.com and retry.`,
    );
  }

  const vestedTokens = Math.floor((p.totalSupply * p.creatorVestedPct) / 100);

  const curveConfig = buildCurveWithMarketCap({
    token: {
      tokenType: TokenType.SPLToken,
      tokenBaseDecimal: TokenDecimal.SIX,
      tokenQuoteDecimal: TokenDecimal.NINE, // SOL
      tokenAuthorityOption: TokenAuthorityOption.Immutable,
      totalTokenSupply: p.totalSupply,
      leftover: 0,
    },
    fee: {
      baseFeeParams: {
        baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
        feeSchedulerParam: {
          // flat fee: start == end, no decay periods
          startingFeeBps: p.tradingFeeBps,
          endingFeeBps: p.tradingFeeBps,
          numberOfPeriod: 0,
          totalDuration: 0,
        },
      },
      dynamicFeeEnabled: p.dynamicFee,
      collectFeeMode: CollectFeeMode.QuoteToken,
      creatorTradingFeePercentage: p.creatorFeeShare,
      poolCreationFee: 0,
      enableFirstSwapWithMinFee: false,
    },
    migration: {
      migrationOption: MigrationOption.MET_DAMM_V2,
      migrationFeeOption: MigrationFeeOption.FixedBps100, // 1% pool fee after graduation
      migrationFee: {
        feePercentage: 0,
        creatorFeePercentage: 0,
      },
    },
    liquidityDistribution: {
      // graduated liquidity is permanently locked, split platform/creator
      partnerPermanentLockedLiquidityPercentage: 100,
      partnerLiquidityPercentage: 0,
      creatorPermanentLockedLiquidityPercentage: 0,
      creatorLiquidityPercentage: 0,
    },
    lockedVesting:
      vestedTokens > 0
        ? {
            totalLockedVestingAmount: vestedTokens,
            numberOfVestingPeriod: 90,
            cliffUnlockAmount: 0,
            totalVestingDuration: 90 * DAY,
            cliffDurationFromMigrationTime: 0,
          }
        : {
            totalLockedVestingAmount: 0,
            numberOfVestingPeriod: 0,
            cliffUnlockAmount: 0,
            totalVestingDuration: 0,
            cliffDurationFromMigrationTime: 0,
          },
    activationType: ActivationType.Timestamp,
    initialMarketCap: p.initialMarketCapSol,
    migrationMarketCap: p.graduationMarketCapSol,
  });

  const client = DynamicBondingCurveClient.create(connection, "confirmed");

  const configKeypair = Keypair.generate();
  const baseMintKeypair = Keypair.generate();

  const tx = await client.partner.createConfigAndPool({
    ...curveConfig,
    config: configKeypair.publicKey,
    feeClaimer,
    leftoverReceiver: feeClaimer,
    quoteMint: SOL_MINT,
    payer: creator,
    preCreatePoolParam: {
      // Metaplex limits: name 32 bytes, symbol 10 bytes
      name: clampBytes(p.name, 32),
      symbol: clampBytes(p.symbol, 10),
      uri: p.uri,
      poolCreator: creator,
      baseMint: baseMintKeypair.publicKey,
    },
  });

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = creator;

  // Simulate BEFORE the wallet popup — a transaction that would fail
  // on-chain surfaces its program logs here instead of dying silently.
  onStatus?.("Simulating deployment…");
  try {
    const sim = await connection.simulateTransaction(tx, undefined);
    if (sim.value.err) {
      const logs = (sim.value.logs ?? []).slice(-6).join(" | ");
      throw new Error(
        `Deployment would fail on-chain: ${JSON.stringify(sim.value.err)}${logs ? ` — ${logs}` : ""}`,
      );
    }
  } catch (e) {
    if (e instanceof Error && e.message.startsWith("Deployment would fail")) throw e;
    // simulation itself throttled/unavailable — proceed, the wallet simulates too
  }

  onStatus?.("Awaiting wallet signature…");
  const signature = await wallet.sendTransaction(tx, connection, {
    signers: [configKeypair, baseMintKeypair],
  });
  onSignature?.(signature);

  // Confirm over plain HTTP polling. Public devnet RPCs rate-limit browsers
  // hard, so every poll tolerates errors and the pool account appearing
  // on-chain counts as ground-truth success even if signature lookups are
  // being throttled. Hard 2-minute deadline — never an infinite spinner.
  onStatus?.("Confirming on-chain…");
  const pool = deriveDbcPoolAddress(
    SOL_MINT,
    baseMintKeypair.publicKey,
    configKeypair.publicKey,
  );

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  const deadline = Date.now() + 120_000;
  let confirmed = false;
  let expired = false;
  let tick = 0;

  while (Date.now() < deadline) {
    // ground truth: the pool account exists → the deploy landed
    try {
      const info = await connection.getAccountInfo(pool, "confirmed");
      if (info) {
        confirmed = true;
        break;
      }
    } catch {
      // throttled — keep going
    }

    // signature status (also catches definitive on-chain failure)
    try {
      const st = await connection.getSignatureStatus(signature, {
        searchTransactionHistory: true,
      });
      const s = st.value;
      if (s?.err) {
        throw new Error(`ONCHAIN_FAIL:${JSON.stringify(s.err)}`);
      }
      if (
        s &&
        (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")
      ) {
        confirmed = true;
        break;
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("ONCHAIN_FAIL:")) {
        throw new Error(
          `Transaction failed on-chain: ${e.message.slice(13)} — tx ${signature}`,
        );
      }
      // throttled — keep going
    }

    // every ~4th tick, check blockhash expiry; if expired, give the pool
    // check one final say before declaring the transaction dropped
    if (tick % 4 === 3) {
      try {
        const height = await connection.getBlockHeight("confirmed");
        if (height > lastValidBlockHeight) {
          expired = true;
          const info = await connection
            .getAccountInfo(pool, "confirmed")
            .catch(() => null);
          if (info) {
            confirmed = true;
          }
          break;
        }
      } catch {
        // throttled — keep going
      }
    }

    tick++;
    await sleep(2500);
  }

  if (!confirmed) {
    if (expired) {
      throw new Error(
        "Transaction expired before confirmation — the network dropped it. No fees were spent; try again.",
      );
    }
    throw new Error(
      `Confirmation timed out after 2 minutes (devnet RPC is likely rate-limiting). ` +
        `Check tx ${signature} on Solscan — if it succeeded, the mission exists at pool ${pool.toBase58()}.`,
    );
  }

  return {
    signature,
    baseMint: baseMintKeypair.publicKey.toBase58(),
    pool: pool.toBase58(),
    config: configKeypair.publicKey.toBase58(),
  };
}

/**
 * Metadata URI for the token. Metaplex caps the URI field at 200 bytes and
 * it must be ASCII-safe, so this is a short placeholder URL until IPFS
 * hosting lands — the GLOBE UI renders the uploaded insignia from the
 * local registry regardless.
 */
export function buildMetadataUri(name: string, symbol: string): string {
  const slug = symbol.replace(/[^a-zA-Z0-9]/g, "").toLowerCase() || "token";
  return `https://globe-launchpad.local/meta/${slug}.json`;
}

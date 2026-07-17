// Real devnet deploy test — exercises the exact createConfigAndPool flow
// the launch page uses, with a locally-signed keypair instead of Phantom.
// Run: node scripts/test-sol-deploy.mjs
import {
  Connection, Keypair, LAMPORTS_PER_SOL, sendAndConfirmRawTransaction,
} from "@solana/web3.js";
import {
  DynamicBondingCurveClient,
  buildCurveWithMarketCap,
  deriveDbcPoolAddress,
  ActivationType, BaseFeeMode, CollectFeeMode, MigrationFeeOption,
  MigrationOption, TokenAuthorityOption, TokenDecimal, TokenType,
} from "@meteora-ag/dynamic-bonding-curve-sdk";
import { PublicKey } from "@solana/web3.js";
import { readFileSync, writeFileSync, existsSync } from "node:fs";

const RPC = process.env.RPC ?? "https://api.devnet.solana.com";
const connection = new Connection(RPC, "confirmed");
const SOL_MINT = new PublicKey("So11111111111111111111111111111111111111112");

// persistent test key so airdropped SOL survives reruns
const KEYFILE = "/tmp/globe-devnet-test-key.json";
let payer;
if (existsSync(KEYFILE)) {
  payer = Keypair.fromSecretKey(new Uint8Array(JSON.parse(readFileSync(KEYFILE, "utf8"))));
} else {
  payer = Keypair.generate();
  writeFileSync(KEYFILE, JSON.stringify([...payer.secretKey]));
}
console.log("payer:", payer.publicKey.toBase58());

let balance = await connection.getBalance(payer.publicKey);
console.log("balance:", balance / LAMPORTS_PER_SOL, "SOL");

if (balance < 0.1 * LAMPORTS_PER_SOL) {
  console.log("requesting airdrop…");
  try {
    const sig = await connection.requestAirdrop(payer.publicKey, LAMPORTS_PER_SOL);
    for (let i = 0; i < 30; i++) {
      const st = await connection.getSignatureStatus(sig);
      if (st.value?.confirmationStatus === "confirmed" || st.value?.confirmationStatus === "finalized") break;
      await new Promise((r) => setTimeout(r, 2000));
    }
    balance = await connection.getBalance(payer.publicKey);
    console.log("balance after airdrop:", balance / LAMPORTS_PER_SOL, "SOL");
  } catch (e) {
    console.log("airdrop failed:", e.message.slice(0, 200));
    process.exit(1);
  }
}

// ── identical curve config to src/lib/meteora/deploy.ts defaults ──
const curveConfig = buildCurveWithMarketCap({
  token: {
    tokenType: TokenType.SPLToken,
    tokenBaseDecimal: TokenDecimal.SIX,
    tokenQuoteDecimal: TokenDecimal.NINE,
    tokenAuthorityOption: TokenAuthorityOption.Immutable,
    totalTokenSupply: 1_000_000_000,
    leftover: 0,
  },
  fee: {
    baseFeeParams: {
      baseFeeMode: BaseFeeMode.FeeSchedulerLinear,
      feeSchedulerParam: { startingFeeBps: 100, endingFeeBps: 100, numberOfPeriod: 0, totalDuration: 0 },
    },
    dynamicFeeEnabled: true,
    collectFeeMode: CollectFeeMode.QuoteToken,
    creatorTradingFeePercentage: 50,
    poolCreationFee: 0,
    enableFirstSwapWithMinFee: false,
  },
  migration: {
    migrationOption: MigrationOption.MET_DAMM_V2,
    migrationFeeOption: MigrationFeeOption.FixedBps100,
    migrationFee: { feePercentage: 0, creatorFeePercentage: 0 },
  },
  liquidityDistribution: {
    partnerPermanentLockedLiquidityPercentage: 100,
    partnerLiquidityPercentage: 0,
    creatorPermanentLockedLiquidityPercentage: 0,
    creatorLiquidityPercentage: 0,
  },
  lockedVesting: {
    totalLockedVestingAmount: 0, numberOfVestingPeriod: 0, cliffUnlockAmount: 0,
    totalVestingDuration: 0, cliffDurationFromMigrationTime: 0,
  },
  activationType: ActivationType.Timestamp,
  initialMarketCap: 30,
  migrationMarketCap: 400,
});

const client = DynamicBondingCurveClient.create(connection, "confirmed");
const configKeypair = Keypair.generate();
const baseMintKeypair = Keypair.generate();

console.log("building createConfigAndPool tx…");
const tx = await client.partner.createConfigAndPool({
  ...curveConfig,
  config: configKeypair.publicKey,
  feeClaimer: payer.publicKey,
  leftoverReceiver: payer.publicKey,
  quoteMint: SOL_MINT,
  payer: payer.publicKey,
  preCreatePoolParam: {
    name: "Deploy Test",
    symbol: "DTEST",
    uri: "https://globe-launchpad.local/meta/dtest.json",
    poolCreator: payer.publicKey,
    baseMint: baseMintKeypair.publicKey,
  },
});

const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
tx.recentBlockhash = blockhash;
tx.feePayer = payer.publicKey;

// simulate first — surfaces program errors without spending anything
tx.sign(payer, configKeypair, baseMintKeypair);
console.log("tx size:", tx.serialize().length, "bytes");
const sim = await connection.simulateTransaction(tx);
if (sim.value.err) {
  console.log("SIMULATION FAILED:", JSON.stringify(sim.value.err));
  console.log((sim.value.logs ?? []).slice(-15).join("\n"));
  process.exit(1);
}
console.log("simulation OK — units consumed:", sim.value.unitsConsumed);

console.log("sending…");
const sig = await connection.sendRawTransaction(tx.serialize(), { skipPreflight: false });
console.log("sig:", sig);

// same polling confirmation as the app
const pool = deriveDbcPoolAddress(SOL_MINT, baseMintKeypair.publicKey, configKeypair.publicKey);
const deadline = Date.now() + 120_000;
let confirmed = false;
while (Date.now() < deadline) {
  try {
    const info = await connection.getAccountInfo(pool, "confirmed");
    if (info) { confirmed = true; break; }
  } catch {}
  try {
    const st = await connection.getSignatureStatus(sig, { searchTransactionHistory: true });
    if (st.value?.err) { console.log("ONCHAIN FAIL:", JSON.stringify(st.value.err)); process.exit(1); }
    if (st.value && ["confirmed", "finalized"].includes(st.value.confirmationStatus)) { confirmed = true; break; }
  } catch {}
  await new Promise((r) => setTimeout(r, 2500));
}
console.log(confirmed ? "CONFIRMED" : "TIMED OUT");
console.log("pool:", pool.toBase58());
console.log("mint:", baseMintKeypair.publicKey.toBase58());
console.log(`solscan: https://solscan.io/tx/${sig}?cluster=devnet`);

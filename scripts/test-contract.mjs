// In-process EVM test for MissionToken — deploy, buy, sell, fees, graduation.
// Run: node scripts/test-contract.mjs
import { VM } from "@ethereumjs/vm";
import { Common, Chain, Hardfork } from "@ethereumjs/common";
import { LegacyTransaction } from "@ethereumjs/tx";
import { Account, Address, hexToBytes, bytesToHex } from "@ethereumjs/util";
import { Interface, parseEther, formatEther } from "ethers";
import { readFileSync } from "node:fs";

const artifact = JSON.parse(readFileSync(new URL("../src/lib/evm/MissionToken.json", import.meta.url)));
const iface = new Interface(artifact.abi);

const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Cancun });
const vm = await VM.create({ common });

// three funded accounts: deployer/buyer, creator, platform
const keys = [1, 2, 3].map((i) => hexToBytes("0x" + String(i).padStart(64, "0")));
const addrs = keys.map((k) => Address.fromPrivateKey(k));
for (const a of addrs) {
  await vm.stateManager.putAccount(
    a,
    Account.fromAccountData({ nonce: 0n, balance: parseEther("10000") }),
  );
}
const [buyer, creator, platform] = addrs;

async function send(fromIdx, { to, data, value = 0n }) {
  const acc = await vm.stateManager.getAccount(addrs[fromIdx]);
  const tx = LegacyTransaction.fromTxData({
    nonce: acc.nonce,
    gasLimit: 5_000_000n,
    gasPrice: 10n ** 9n,
    to,
    value,
    data,
  }, { common }).sign(keys[fromIdx]);
  const res = await vm.runTx({ tx, skipBalance: false });
  if (res.execResult.exceptionError) {
    const ret = bytesToHex(res.execResult.returnValue);
    throw new Error(`revert: ${res.execResult.exceptionError.error} ${ret}`);
  }
  return res;
}

async function call(to, fn, args = []) {
  const res = await vm.evm.runCall({
    to,
    caller: buyer,
    data: hexToBytes(iface.encodeFunctionData(fn, args)),
  });
  if (res.execResult.exceptionError) throw new Error(`call revert: ${fn}`);
  return iface.decodeFunctionResult(fn, bytesToHex(res.execResult.returnValue));
}

async function balanceOfEth(a) {
  return (await vm.stateManager.getAccount(a))?.balance ?? 0n;
}

// ── deploy: 1B supply, 1% fee, 50% creator share, 30 ETH init mcap, graduate after 5 ETH raised
const SUPPLY = parseEther("1000000000");
const deployData = artifact.bytecode + iface.encodeDeploy([
  "Test Mission", "TEST", SUPPLY, 100, 5000,
  creator.toString(), platform.toString(),
  parseEther("30"), parseEther("5"),
]).slice(2);

const dep = await send(0, { data: hexToBytes(deployData) });
const token = dep.createdAddress;
console.log("deployed at", token.toString());

// ── buy 1 ETH
const q = await call(token, "quoteBuy", [parseEther("1")]);
console.log(`quoteBuy(1 ETH): ${formatEther(q[0])} tokens, fee ${formatEther(q[1])} ETH`);

const creatorBefore = await balanceOfEth(creator);
const platformBefore = await balanceOfEth(platform);
await send(0, { to: token, value: parseEther("1"), data: hexToBytes(iface.encodeFunctionData("buy", [q[0]])) });
const bal = (await call(token, "balanceOf", [buyer.toString()]))[0];
console.log(`buyer token balance: ${formatEther(bal)} (expected ${formatEther(q[0])})`);
if (bal !== q[0]) throw new Error("buy amount mismatch");

const cFee = (await balanceOfEth(creator)) - creatorBefore;
const pFee = (await balanceOfEth(platform)) - platformBefore;
console.log(`fees paid instantly — creator ${formatEther(cFee)} ETH, platform ${formatEther(pFee)} ETH`);
if (cFee !== parseEther("0.005") || pFee !== parseEther("0.005")) throw new Error("fee split wrong");

// ── price/mcap sanity
const mcap = (await call(token, "marketCap", []))[0];
console.log(`market cap after 1 ETH buy: ${formatEther(mcap)} ETH (started at 30)`);

// ── sell half back
const half = bal / 2n;
const sq = await call(token, "quoteSell", [half]);
const buyerEthBefore = await balanceOfEth(buyer);
await send(0, { to: token, data: hexToBytes(iface.encodeFunctionData("sell", [half, sq[0]])) });
const buyerEthAfter = await balanceOfEth(buyer);
console.log(`sold half: received ~${formatEther(sq[0])} ETH (balance delta incl. gas: ${formatEther(buyerEthAfter - buyerEthBefore)})`);

// ── slippage guard must revert
let reverted = false;
try {
  await send(0, { to: token, value: parseEther("0.1"), data: hexToBytes(iface.encodeFunctionData("buy", [SUPPLY])) });
} catch { reverted = true; }
if (!reverted) throw new Error("slippage guard failed");
console.log("slippage guard reverts as expected");

// ── graduation: buy big
await send(0, { to: token, value: parseEther("7"), data: hexToBytes(iface.encodeFunctionData("buy", [0])) });
const st = await call(token, "missionState", []);
console.log(`realEth ${formatEther(st[2])} / graduation ${formatEther(st[3])} — graduated: ${st[4]}`);
if (!st[4]) throw new Error("should have graduated");

// ── round trip invariant: contract ETH >= realEth
const contractEth = await balanceOfEth(token);
console.log(`contract holds ${formatEther(contractEth)} ETH, realEth ${formatEther(st[2])}`);
if (contractEth < st[2]) throw new Error("reserve accounting broken");

console.log("\nALL CONTRACT TESTS PASSED");

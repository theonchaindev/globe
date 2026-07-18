// In-process VM test for MissionERC20 — deploy, transfer, approve/transferFrom.
import { VM } from "@ethereumjs/vm";
import { Common, Chain, Hardfork } from "@ethereumjs/common";
import { LegacyTransaction } from "@ethereumjs/tx";
import { Account, Address, hexToBytes, bytesToHex } from "@ethereumjs/util";
import { Interface, parseEther, formatEther } from "ethers";
import { readFileSync } from "node:fs";

const artifact = JSON.parse(readFileSync(new URL("../src/lib/evm/MissionERC20.json", import.meta.url)));
const iface = new Interface(artifact.abi);
const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Cancun });
const vm = await VM.create({ common });

const keys = [1, 2].map((i) => hexToBytes("0x" + String(i).padStart(64, "0")));
const [alice, bob] = keys.map((k) => Address.fromPrivateKey(k));
for (const a of [alice, bob]) {
  await vm.stateManager.putAccount(a, Account.fromAccountData({ nonce: 0n, balance: parseEther("10") }));
}

async function send(keyIdx, { to, data, value = 0n }) {
  const acc = await vm.stateManager.getAccount([alice, bob][keyIdx]);
  const tx = LegacyTransaction.fromTxData(
    { nonce: acc.nonce, gasLimit: 3_000_000n, gasPrice: 10n ** 9n, to, value, data },
    { common },
  ).sign(keys[keyIdx]);
  const res = await vm.runTx({ tx, skipBalance: false });
  if (res.execResult.exceptionError) throw new Error(`revert: ${res.execResult.exceptionError.error}`);
  return res;
}
async function call(to, fn, args = []) {
  const res = await vm.evm.runCall({ to, caller: alice, data: hexToBytes(iface.encodeFunctionData(fn, args)) });
  if (res.execResult.exceptionError) throw new Error(`call revert: ${fn}`);
  return iface.decodeFunctionResult(fn, bytesToHex(res.execResult.returnValue));
}

const SUPPLY = parseEther("1000000000");
const dep = await send(0, { data: hexToBytes(artifact.bytecode + iface.encodeDeploy(["Uni Test", "UNIT", SUPPLY]).slice(2)) });
const token = dep.createdAddress;

const supply = (await call(token, "totalSupply"))[0];
const aliceBal = (await call(token, "balanceOf", [alice.toString()]))[0];
if (supply !== SUPPLY || aliceBal !== SUPPLY) throw new Error("supply mint wrong");
console.log("deploy + full mint to deployer OK:", formatEther(aliceBal));

await send(0, { to: token, data: hexToBytes(iface.encodeFunctionData("transfer", [bob.toString(), parseEther("1000")])) });
const bobBal = (await call(token, "balanceOf", [bob.toString()]))[0];
if (bobBal !== parseEther("1000")) throw new Error("transfer wrong");
console.log("transfer OK");

await send(0, { to: token, data: hexToBytes(iface.encodeFunctionData("approve", [bob.toString(), parseEther("500")])) });
await send(1, { to: token, data: hexToBytes(iface.encodeFunctionData("transferFrom", [alice.toString(), bob.toString(), parseEther("500")])) });
const bobBal2 = (await call(token, "balanceOf", [bob.toString()]))[0];
if (bobBal2 !== parseEther("1500")) throw new Error("transferFrom wrong");
console.log("approve/transferFrom OK");

// over-allowance must revert
let reverted = false;
try {
  await send(1, { to: token, data: hexToBytes(iface.encodeFunctionData("transferFrom", [alice.toString(), bob.toString(), parseEther("1")])) });
} catch { reverted = true; }
if (!reverted) throw new Error("allowance guard failed");
console.log("allowance guard OK");

console.log("\nMISSIONERC20 TESTS PASSED");

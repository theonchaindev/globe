// End-to-end test of the EVM launch flow through ethers' JsonRpcProvider —
// the exact path the UI uses — against an in-process @ethereumjs/vm chain.
// Run: node scripts/test-evm-e2e.mjs
import { createServer } from "node:http";
import { VM } from "@ethereumjs/vm";
import { Common, Chain, Hardfork } from "@ethereumjs/common";
import { TransactionFactory } from "@ethereumjs/tx";
import { Account, Address, hexToBytes, bytesToHex } from "@ethereumjs/util";
import {
  Contract, ContractFactory, JsonRpcProvider, Wallet,
  parseEther, formatEther,
} from "ethers";
import { readFileSync } from "node:fs";

const artifact = JSON.parse(readFileSync(new URL("../src/lib/evm/MissionToken.json", import.meta.url)));

// ── minimal EVM JSON-RPC node ─────────────────────────────
const common = new Common({ chain: Chain.Mainnet, hardfork: Hardfork.Cancun });
const vm = await VM.create({ common });
const receipts = new Map();
const nonces = new Map(); // shim-tracked nonces — VM cache reads go stale after checkpoint/revert
let blockNumber = 1n;

async function rpc(method, params) {
  switch (method) {
    case "eth_chainId": return "0x1";
    case "eth_blockNumber": return "0x" + blockNumber.toString(16);
    case "eth_gasPrice": return "0x3b9aca00";
    case "eth_maxPriorityFeePerGas": return "0x3b9aca00";
    case "eth_getBlockByNumber":
      return {
        number: "0x" + blockNumber.toString(16),
        hash: "0x" + "11".repeat(32),
        parentHash: "0x" + "22".repeat(32),
        timestamp: "0x" + Math.floor(Date.now() / 1000).toString(16),
        gasLimit: "0x1c9c380", gasUsed: "0x0",
        baseFeePerGas: "0x3b9aca00",
        miner: "0x" + "00".repeat(20), difficulty: "0x0", extraData: "0x",
        logsBloom: "0x" + "00".repeat(256), nonce: "0x0000000000000000",
        transactions: [],
      };
    case "eth_getTransactionCount": {
      const key = params[0].toLowerCase();
      const acc = await vm.stateManager.getAccount(Address.fromString(params[0]));
      const stateNonce = acc?.nonce ?? 0n;
      const tracked = nonces.get(key) ?? 0n;
      return "0x" + (tracked > stateNonce ? tracked : stateNonce).toString(16);
    }
    case "eth_getBalance": {
      const acc = await vm.stateManager.getAccount(Address.fromString(params[0]));
      return "0x" + (acc?.balance ?? 0n).toString(16);
    }
    case "eth_estimateGas": return "0x4c4b40";
    case "eth_call": {
      const t = params[0];
      await vm.stateManager.checkpoint();
      try {
        const res = await vm.evm.runCall({
          to: Address.fromString(t.to),
          caller: t.from ? Address.fromString(t.from) : Address.zero(),
          data: hexToBytes(t.data ?? "0x"),
          value: BigInt(t.value ?? 0),
        });
        if (res.execResult.exceptionError) throw new Error("execution reverted");
        return bytesToHex(res.execResult.returnValue);
      } finally {
        await vm.stateManager.revert();
      }
    }
    case "eth_sendRawTransaction": {
      const tx = TransactionFactory.fromSerializedData(hexToBytes(params[0]), { common });
      const res = await vm.runTx({ tx, skipBalance: false });
      await vm.stateManager.flush();
      nonces.set(tx.getSenderAddress().toString().toLowerCase(), tx.nonce + 1n);
      blockNumber++;
      const hash = bytesToHex(tx.hash());
      receipts.set(hash, {
        transactionHash: hash,
        transactionIndex: "0x0",
        blockNumber: "0x" + blockNumber.toString(16),
        blockHash: "0x" + "11".repeat(32),
        from: tx.getSenderAddress().toString(),
        to: tx.to?.toString() ?? null,
        contractAddress: res.createdAddress?.toString() ?? null,
        cumulativeGasUsed: "0x" + res.totalGasSpent.toString(16),
        gasUsed: "0x" + res.totalGasSpent.toString(16),
        effectiveGasPrice: "0x3b9aca00",
        logs: [], logsBloom: "0x" + "00".repeat(256),
        status: res.execResult.exceptionError ? "0x0" : "0x1",
        type: "0x2",
      });
      if (res.execResult.exceptionError) throw new Error("execution reverted");
      return hash;
    }
    case "eth_getTransactionReceipt": return receipts.get(params[0]) ?? null;
    case "eth_getTransactionByHash": {
      const r = receipts.get(params[0]);
      return r && { ...r, hash: r.transactionHash, input: "0x", value: "0x0", nonce: "0x0", gas: r.gasUsed, gasPrice: r.effectiveGasPrice, maxFeePerGas: r.effectiveGasPrice, maxPriorityFeePerGas: "0x0", chainId: "0x1" };
    }
    case "net_version": return "1";
    default: throw new Error(`unhandled method ${method}`);
  }
}

const server = createServer((req, res) => {
  let body = "";
  req.on("data", (c) => (body += c));
  req.on("end", async () => {
    const reqs = JSON.parse(body);
    const batch = Array.isArray(reqs) ? reqs : [reqs];
    const out = await Promise.all(
      batch.map(async (r) => {
        try {
          return { jsonrpc: "2.0", id: r.id, result: await rpc(r.method, r.params ?? []) };
        } catch (e) {
          return { jsonrpc: "2.0", id: r.id, error: { code: -32000, message: e.message } };
        }
      }),
    );
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify(Array.isArray(reqs) ? out : out[0]));
  });
});
await new Promise((ok) => server.listen(8788, ok));

// ── fund two wallets, then run the UI's exact flow ────────
const creatorPk = "0x" + "01".padStart(64, "0");
const traderPk = "0x" + "02".padStart(64, "0");
for (const pk of [creatorPk, traderPk]) {
  const addr = Address.fromPrivateKey(hexToBytes(pk));
  await vm.stateManager.putAccount(addr, Account.fromAccountData({ nonce: 0n, balance: parseEther("1000") }));
}

const provider = new JsonRpcProvider("http://127.0.0.1:8788", 1, { batchMaxCount: 1 });
const creator = new Wallet(creatorPk, provider);
const trader = new Wallet(traderPk, provider);

// deploy exactly like deployEvmMission
function sqrtBig(v){ if (v<2n) return v; let x=v,y=(x+1n)/2n; while(y<x){x=y;y=(x+v/x)/2n;} return x; }
const vE0 = parseEther("30"), grad = parseEther("400");
const graduationEth = sqrtBig(vE0 * grad) - vE0;

const factory = new ContractFactory(artifact.abi, artifact.bytecode, creator);
const contract = await factory.deploy(
  "E2E Mission", "E2E", parseEther("1000000000"),
  100, 5000, creator.address, creator.address, vE0, graduationEth,
);
await contract.deploymentTransaction().wait();
const address = await contract.getAddress();
console.log("deployed via JsonRpcProvider at", address);

// quote + buy like evmBuy
const c = new Contract(address, artifact.abi, trader);
const [tokensOut] = await c.quoteBuy(parseEther("1"));
const minOut = (tokensOut * 9900n) / 10000n;
const buyTx = await c.buy(minOut, { value: parseEther("1"), nonce: await provider.getTransactionCount(trader.address) });
await buyTx.wait();
const bal = await c.balanceOf(trader.address);
console.log(`bought ${formatEther(bal)} E2E for 1 ETH`);
if (bal < minOut) throw new Error("buy below minOut");

// sell half like evmSell — pause past ethers' ~250ms RPC read cache so the
// nonce is re-fetched (real networks never trade twice inside 250ms)
await new Promise((r) => setTimeout(r, 400));
const half = bal / 2n;
const [ethOut] = await c.quoteSell(half);
const sellTx = await c.sell(half, (ethOut * 9900n) / 10000n, { nonce: await provider.getTransactionCount(trader.address) });
await sellTx.wait();
console.log(`sold half for ~${formatEther(ethOut)} ETH`);

// read state like readEvmMission
const st = await c.missionState();
console.log(`state: realEth=${formatEther(st[2])} graduated=${st[4]} creatorFees=${formatEther(st[6])} platformFees=${formatEther(st[7])}`);

server.close();
console.log("\nEVM E2E VIA JSON-RPC PASSED");

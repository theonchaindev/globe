"use client";

import {
  Contract, ContractFactory, JsonRpcProvider, Wallet,
  parseEther, formatEther,
} from "ethers";
import artifact from "./MissionToken.json";
import { EVM_RPC } from "./config";
import type { DevWallet } from "@/lib/devwallets";

/**
 * Robinhood/EVM theatre — each mission is its own MissionToken contract
 * (ERC20 + constant-product curve). Deploys and trades are signed by a
 * browser dev wallet; no extension wallet needed.
 */

export interface EvmLaunchParams {
  name: string;
  symbol: string;
  totalSupply: number; // whole tokens
  tradingFeeBps: number; // 25..1000
  creatorFeeShare: number; // 0..100 (%)
  platform: string; // platform fee address
  initialMcapEth: number; // virtual ETH reserve at start
  gradMcapEth: number; // market cap at graduation
}

export interface EvmMissionState {
  name: string;
  symbol: string;
  totalSupply: number;
  priceEth: number;
  marketCapEth: number;
  realEth: number;
  graduationEth: number;
  progressPct: number;
  graduated: boolean;
  curveTokens: number;
  feeBps: number;
  creatorFeeShareBps: number;
  creator: string;
  totalCreatorFeesEth: number;
  totalPlatformFeesEth: number;
}

export function provider(): JsonRpcProvider {
  return new JsonRpcProvider(EVM_RPC);
}

export function signerFor(w: DevWallet): Wallet {
  return new Wallet(w.secret, provider());
}

function sqrtBig(v: bigint): bigint {
  if (v < 2n) return v;
  let x = v, y = (x + 1n) / 2n;
  while (y < x) { x = y; y = (x + v / x) / 2n; }
  return x;
}

/**
 * ETH the curve must collect to reach the graduation market cap.
 * With k = vE0 * S and mcap = vE^2 / vE0: vE_grad = sqrt(vE0 * mcapGrad).
 */
export function graduationEthFor(initialMcapEth: number, gradMcapEth: number): bigint {
  const vE0 = parseEther(initialMcapEth.toString());
  const target = parseEther(gradMcapEth.toString());
  return sqrtBig(vE0 * target) - vE0;
}

export async function deployEvmMission(
  dev: DevWallet,
  p: EvmLaunchParams,
): Promise<{ address: string; txHash: string }> {
  const signer = signerFor(dev);
  const factory = new ContractFactory(artifact.abi, artifact.bytecode, signer);

  const contract = await factory.deploy(
    p.name,
    p.symbol,
    parseEther(p.totalSupply.toString()),
    p.tradingFeeBps,
    Math.round(p.creatorFeeShare * 100), // % → bps
    signer.address,
    p.platform,
    parseEther(p.initialMcapEth.toString()),
    graduationEthFor(p.initialMcapEth, p.gradMcapEth),
  );
  const receipt = await contract.deploymentTransaction()!.wait();
  return {
    address: await contract.getAddress(),
    txHash: receipt!.hash,
  };
}

export function missionContract(address: string, runner?: Wallet): Contract {
  return new Contract(address, artifact.abi, runner ?? provider());
}

export async function readEvmMission(address: string): Promise<EvmMissionState> {
  const c = missionContract(address);
  const [name, symbol, supply, price, mcap, state, feeBps, shareBps, creator] =
    await Promise.all([
      c.name(), c.symbol(), c.totalSupply(), c.price(), c.marketCap(),
      c.missionState(), c.feeBps(), c.creatorFeeShareBps(), c.creator(),
    ]);
  const realEth = +formatEther(state[2]);
  const graduationEth = +formatEther(state[3]);
  return {
    name,
    symbol,
    totalSupply: +formatEther(supply),
    priceEth: +formatEther(price),
    marketCapEth: +formatEther(mcap),
    realEth,
    graduationEth,
    progressPct: Math.min(100, (realEth / graduationEth) * 100),
    graduated: state[4],
    curveTokens: +formatEther(state[5]),
    feeBps: Number(feeBps),
    creatorFeeShareBps: Number(shareBps),
    creator,
    totalCreatorFeesEth: +formatEther(state[6]),
    totalPlatformFeesEth: +formatEther(state[7]),
  };
}

export async function quoteEvmBuy(address: string, ethIn: number) {
  const c = missionContract(address);
  const [tokensOut, fee] = await c.quoteBuy(parseEther(ethIn.toString()));
  return { tokensOut: +formatEther(tokensOut), feeEth: +formatEther(fee), raw: tokensOut as bigint };
}

export async function quoteEvmSell(address: string, tokensIn: number) {
  const c = missionContract(address);
  const [ethOut, fee] = await c.quoteSell(parseEther(tokensIn.toString()));
  return { ethOut: +formatEther(ethOut), feeEth: +formatEther(fee), raw: ethOut as bigint };
}

const SLIPPAGE_BPS = 100n; // 1%

export async function evmBuy(dev: DevWallet, address: string, ethIn: number): Promise<string> {
  const c = missionContract(address, signerFor(dev));
  const { raw } = await quoteEvmBuy(address, ethIn);
  const minOut = (raw * (10_000n - SLIPPAGE_BPS)) / 10_000n;
  const tx = await c.buy(minOut, { value: parseEther(ethIn.toString()) });
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function evmSell(dev: DevWallet, address: string, tokensIn: number): Promise<string> {
  const c = missionContract(address, signerFor(dev));
  const { raw } = await quoteEvmSell(address, tokensIn);
  const minOut = (raw * (10_000n - SLIPPAGE_BPS)) / 10_000n;
  const tx = await c.sell(parseEther(tokensIn.toString()), minOut);
  const receipt = await tx.wait();
  return receipt.hash;
}

export async function evmTokenBalance(address: string, holder: string): Promise<number> {
  const c = missionContract(address);
  return +formatEther(await c.balanceOf(holder));
}

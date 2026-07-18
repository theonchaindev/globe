"use client";

import {
  Contract, ContractFactory, Wallet,
  parseEther, formatEther, MaxUint256,
} from "ethers";
import erc20Artifact from "./MissionERC20.json";
import { provider, signerFor } from "./launch";
import type { DevWallet } from "@/lib/devwallets";

/**
 * Robinhood theatre via Uniswap V2 — deploy a fixed-supply ERC20 and seed
 * a real Uniswap pool with it. The creator keeps the LP tokens, so the
 * 0.30% Uniswap fee on every swap accrues to them. Trading goes through
 * the official router, so the token is instantly tradeable on Uniswap's
 * own interface and any aggregator.
 */

// Official Uniswap V2 deployment on Sepolia — verified on-chain.
export const UNISWAP_FACTORY =
  process.env.NEXT_PUBLIC_UNISWAP_FACTORY ?? "0xF62c03E08ada871A0bEb309762E260a7a6a880E6";
export const UNISWAP_ROUTER =
  process.env.NEXT_PUBLIC_UNISWAP_ROUTER ?? "0xeE567Fe1712Faf6149d80dA1E6934E354124CfE3";

const ROUTER_ABI = [
  "function WETH() view returns (address)",
  "function addLiquidityETH(address token, uint amountTokenDesired, uint amountTokenMin, uint amountETHMin, address to, uint deadline) payable returns (uint amountToken, uint amountETH, uint liquidity)",
  "function getAmountsOut(uint amountIn, address[] path) view returns (uint[] amounts)",
  "function swapExactETHForTokens(uint amountOutMin, address[] path, address to, uint deadline) payable returns (uint[] amounts)",
  "function swapExactTokensForETH(uint amountIn, uint amountOutMin, address[] path, address to, uint deadline) returns (uint[] amounts)",
];

const FACTORY_ABI = [
  "function getPair(address, address) view returns (address)",
];

const PAIR_ABI = [
  "function getReserves() view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)",
  "function token0() view returns (address)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
];

const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "function approve(address, uint256) returns (bool)",
  "function allowance(address, address) view returns (uint256)",
];

function deadline(): number {
  return Math.floor(Date.now() / 1000) + 1200;
}

export interface UniswapLaunchParams {
  name: string;
  symbol: string;
  totalSupply: number; // whole tokens
  lpSupplyPct: number; // % of supply into the pool (rest stays with creator)
  lpEth: number; // ETH seeded into the pool
}

export interface UniswapDeployResult {
  token: string;
  pair: string;
  txHash: string;
}

/** Verify the Uniswap contracts exist on the connected network. */
export async function assertUniswapPresent(): Promise<void> {
  const p = provider();
  const [f, r] = await Promise.all([p.getCode(UNISWAP_FACTORY), p.getCode(UNISWAP_ROUTER)]);
  if (f === "0x" || r === "0x") {
    throw new Error(
      "Uniswap V2 is not deployed on the configured EVM network — set NEXT_PUBLIC_UNISWAP_FACTORY / NEXT_PUBLIC_UNISWAP_ROUTER.",
    );
  }
}

export async function deployOnUniswap(
  dev: DevWallet,
  p: UniswapLaunchParams,
  onStatus?: (s: string) => void,
): Promise<UniswapDeployResult> {
  await assertUniswapPresent();
  const signer = signerFor(dev);

  onStatus?.("Deploying ERC20…");
  const factory = new ContractFactory(erc20Artifact.abi, erc20Artifact.bytecode, signer);
  const supply = parseEther(p.totalSupply.toString());
  const token = await factory.deploy(p.name, p.symbol, supply);
  await token.deploymentTransaction()!.wait();
  const tokenAddr = await token.getAddress();

  const lpTokens = (supply * BigInt(Math.round(p.lpSupplyPct * 100))) / 10_000n;

  onStatus?.("Approving router…");
  const erc20 = new Contract(tokenAddr, ERC20_ABI, signer);
  await (await erc20.approve(UNISWAP_ROUTER, MaxUint256)).wait();

  onStatus?.("Seeding Uniswap pool…");
  const router = new Contract(UNISWAP_ROUTER, ROUTER_ABI, signer);
  const tx = await router.addLiquidityETH(
    tokenAddr,
    lpTokens,
    lpTokens, // exact amounts on a fresh pool
    parseEther(p.lpEth.toString()),
    signer.address, // creator keeps the LP tokens → earns the 0.3% fees
    deadline(),
    { value: parseEther(p.lpEth.toString()) },
  );
  const receipt = await tx.wait();

  const uniFactory = new Contract(UNISWAP_FACTORY, FACTORY_ABI, provider());
  const weth: string = await new Contract(UNISWAP_ROUTER, ROUTER_ABI, provider()).WETH();
  const pair: string = await uniFactory.getPair(tokenAddr, weth);

  return { token: tokenAddr, pair, txHash: receipt.hash };
}

export interface UniswapMissionState {
  name: string;
  symbol: string;
  totalSupply: number;
  priceEth: number;
  marketCapEth: number;
  liquidityEth: number; // ETH side of the pool
  poolTokens: number; // token side of the pool
  pair: string;
}

export async function readUniswapMission(tokenAddr: string): Promise<UniswapMissionState> {
  const pvd = provider();
  const erc20 = new Contract(tokenAddr, ERC20_ABI, pvd);
  const router = new Contract(UNISWAP_ROUTER, ROUTER_ABI, pvd);
  const uniFactory = new Contract(UNISWAP_FACTORY, FACTORY_ABI, pvd);

  const [name, symbol, supply, weth] = await Promise.all([
    erc20.name(), erc20.symbol(), erc20.totalSupply(), router.WETH(),
  ]);
  const pair: string = await uniFactory.getPair(tokenAddr, weth);
  if (pair === "0x0000000000000000000000000000000000000000") {
    throw new Error("No Uniswap pool exists for this token");
  }

  const pairC = new Contract(pair, PAIR_ABI, pvd);
  const [reserves, token0] = await Promise.all([pairC.getReserves(), pairC.token0()]);
  const tokenIs0 = token0.toLowerCase() === tokenAddr.toLowerCase();
  const tokenReserve = tokenIs0 ? reserves[0] : reserves[1];
  const ethReserve = tokenIs0 ? reserves[1] : reserves[0];

  const priceEth = tokenReserve > 0n ? Number(ethReserve) / Number(tokenReserve) : 0;
  const totalSupply = +formatEther(supply);

  return {
    name,
    symbol,
    totalSupply,
    priceEth,
    marketCapEth: priceEth * totalSupply,
    liquidityEth: +formatEther(ethReserve),
    poolTokens: +formatEther(tokenReserve),
    pair,
  };
}

async function wethAddr(): Promise<string> {
  return new Contract(UNISWAP_ROUTER, ROUTER_ABI, provider()).WETH();
}

export async function quoteUniswap(
  tokenAddr: string,
  amountIn: number,
  side: "buy" | "sell",
): Promise<{ out: number; raw: bigint }> {
  const router = new Contract(UNISWAP_ROUTER, ROUTER_ABI, provider());
  const weth = await wethAddr();
  const path = side === "buy" ? [weth, tokenAddr] : [tokenAddr, weth];
  const amounts = await router.getAmountsOut(parseEther(amountIn.toString()), path);
  const raw: bigint = amounts[amounts.length - 1];
  return { out: +formatEther(raw), raw };
}

const SLIPPAGE_BPS = 100n; // 1%

export async function uniswapBuy(dev: DevWallet, tokenAddr: string, ethIn: number): Promise<string> {
  const signer = signerFor(dev);
  const router = new Contract(UNISWAP_ROUTER, ROUTER_ABI, signer);
  const weth = await wethAddr();
  const { raw } = await quoteUniswap(tokenAddr, ethIn, "buy");
  const minOut = (raw * (10_000n - SLIPPAGE_BPS)) / 10_000n;
  const tx = await router.swapExactETHForTokens(
    minOut, [weth, tokenAddr], signer.address, deadline(),
    { value: parseEther(ethIn.toString()) },
  );
  return (await tx.wait()).hash;
}

export async function uniswapSell(dev: DevWallet, tokenAddr: string, tokensIn: number): Promise<string> {
  const signer = signerFor(dev);
  const erc20 = new Contract(tokenAddr, ERC20_ABI, signer);
  const amountIn = parseEther(tokensIn.toString());

  const allowance: bigint = await erc20.allowance(signer.address, UNISWAP_ROUTER);
  if (allowance < amountIn) {
    await (await erc20.approve(UNISWAP_ROUTER, MaxUint256)).wait();
  }

  const router = new Contract(UNISWAP_ROUTER, ROUTER_ABI, signer);
  const weth = await wethAddr();
  const { raw } = await quoteUniswap(tokenAddr, tokensIn, "sell");
  const minOut = (raw * (10_000n - SLIPPAGE_BPS)) / 10_000n;
  const tx = await router.swapExactTokensForETH(
    amountIn, minOut, [tokenAddr, weth], signer.address, deadline(),
  );
  return (await tx.wait()).hash;
}

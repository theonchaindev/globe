"use client";

import { Keypair } from "@solana/web3.js";
import { Wallet as EthWallet } from "ethers";
import bs58 from "bs58";

/**
 * Dev wallets — throwaway keypairs generated and stored entirely in the
 * browser (localStorage). Intended for devnet/testnet work: testing
 * launches, seeding curves, QA. Never store meaningful funds in one.
 */

export type DevChain = "SOL" | "ETH";

export interface DevWallet {
  id: string;
  chain: DevChain;
  label: string;
  address: string;
  /** base58-encoded 64-byte secret key (SOL) or 0x hex private key (ETH). */
  secret: string;
  createdAt: number;
}

const KEY = "globe.devwallets.v1";

export function loadWallets(): DevWallet[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "[]") as DevWallet[];
  } catch {
    return [];
  }
}

function save(wallets: DevWallet[]) {
  localStorage.setItem(KEY, JSON.stringify(wallets));
}

export function createDevWallet(chain: DevChain, label: string): DevWallet {
  let address: string;
  let secret: string;

  if (chain === "SOL") {
    const kp = Keypair.generate();
    address = kp.publicKey.toBase58();
    secret = bs58.encode(kp.secretKey);
  } else {
    const w = EthWallet.createRandom();
    address = w.address;
    secret = w.privateKey;
  }

  const wallet: DevWallet = {
    id: crypto.randomUUID(),
    chain,
    label,
    address,
    secret,
    createdAt: Date.now(),
  };
  save([...loadWallets(), wallet]);
  return wallet;
}

export function deleteDevWallet(id: string): DevWallet[] {
  const next = loadWallets().filter((w) => w.id !== id);
  save(next);
  return next;
}

export function renameDevWallet(id: string, label: string): DevWallet[] {
  const next = loadWallets().map((w) => (w.id === id ? { ...w, label } : w));
  save(next);
  return next;
}

/** Keypair for signing with a SOL dev wallet (e.g. future dev deploys). */
export function solKeypair(w: DevWallet): Keypair {
  return Keypair.fromSecretKey(bs58.decode(w.secret));
}

"use client";

import { useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { SOLANA_CLUSTER } from "@/lib/meteora/config";

/** Real Solana wallet connection via wallet-adapter (Phantom, Solflare, …). */
export default function ConnectWallet() {
  const { publicKey, disconnect, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  // avoid SSR/CSR mismatch — wallet state only exists client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const addr = mounted && publicKey ? publicKey.toBase58() : null;

  return (
    <button
      onClick={() => (addr ? disconnect() : setVisible(true))}
      className={`mono flex h-8 items-center gap-2 rounded-md px-3 text-[11px] tracking-[0.08em] transition-all ${
        addr
          ? "border border-line bg-panel text-primary"
          : "bg-primary font-semibold text-black hover:brightness-110"
      }`}
      title={addr ? `Connected on ${SOLANA_CLUSTER} — click to disconnect` : "Connect a Solana wallet"}
    >
      <Wallet size={13} />
      {connecting
        ? "Connecting…"
        : addr
          ? `${addr.slice(0, 4)}…${addr.slice(-4)}`
          : "Connect Wallet"}
    </button>
  );
}

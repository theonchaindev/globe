"use client";

import { useState } from "react";
import { Wallet } from "lucide-react";

/** Mock wallet connection — swaps to a truncated address when "connected". */
export default function ConnectWallet() {
  const [addr, setAddr] = useState<string | null>(null);

  const toggle = () => {
    if (addr) {
      setAddr(null);
    } else {
      const chars = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz";
      let a = "";
      for (let i = 0; i < 44; i++) a += chars[Math.floor(Math.random() * chars.length)];
      setAddr(a);
    }
  };

  return (
    <button
      onClick={toggle}
      className={`mono flex h-8 items-center gap-2 rounded-md px-3 text-[11px] tracking-[0.08em] transition-all ${
        addr
          ? "border border-line bg-panel text-primary"
          : "bg-primary font-semibold text-black hover:brightness-110"
      }`}
    >
      <Wallet size={13} />
      {addr ? `${addr.slice(0, 4)}…${addr.slice(-4)}` : "Connect Wallet"}
    </button>
  );
}

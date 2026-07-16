"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus, Copy, Check, Eye, EyeOff, Trash2, Droplets, RefreshCw,
  ExternalLink, KeyRound, ShieldAlert, Loader2,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { JsonRpcProvider, formatEther } from "ethers";
import {
  type DevWallet, type DevChain,
  loadWallets, createDevWallet, deleteDevWallet,
} from "@/lib/devwallets";
import { SOLANA_CLUSTER, explorerAddress } from "@/lib/meteora/config";
import { EVM_RPC, EVM_NETWORK_LABEL, evmExplorerAddress } from "@/lib/evm/config";

const AGENT_NAMES = ["CIPHER", "KESTREL", "VANTAGE", "OBSIDIAN", "MERIDIAN", "NOCTURNE", "PALADIN", "ECHELON"];

function agentCodename(address: string | null): string {
  if (!address) return "UNREGISTERED";
  let h = 0;
  for (const c of address) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return `${AGENT_NAMES[h % AGENT_NAMES.length]}-${(h % 97) + 1}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1400);
      }}
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line text-faint transition-colors hover:text-white"
      aria-label="Copy"
    >
      {copied ? <Check size={11} className="text-primary" /> : <Copy size={11} />}
    </button>
  );
}

function WalletCard({
  w, balance, onDelete, onAirdrop, onRefresh, airdropping,
}: {
  w: DevWallet;
  balance: string | null;
  onDelete: () => void;
  onAirdrop?: () => void;
  onRefresh: () => void;
  airdropping?: boolean;
}) {
  const [reveal, setReveal] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const isSol = w.chain === "SOL";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="panel p-5"
    >
      <div className="flex items-center gap-3">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-md border border-line"
          style={{ color: isSol ? "var(--accent)" : "var(--warning)" }}
        >
          <KeyRound size={13} />
        </span>
        <div className="min-w-0">
          <p className="text-[13px] font-semibold text-white">{w.label}</p>
          <p className="mono text-[9px] tracking-[0.14em] text-faint">
            {isSol ? `SOLANA ${SOLANA_CLUSTER.toUpperCase()}` : EVM_NETWORK_LABEL} · CREATED{" "}
            {new Date(w.createdAt).toISOString().slice(0, 10)}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="microlabel">BALANCE</p>
          <p className="mono tnum text-[13px] text-white">
            {balance === null ? "—" : `${balance} ${isSol ? "SOL" : "ETH"}`}
          </p>
        </div>
      </div>

      {/* address */}
      <div className="mt-4 flex items-center gap-2 rounded-md border border-line bg-bg2 px-3 py-2">
        <span className="microlabel w-14 shrink-0">ADDR</span>
        <span className="mono truncate text-[11px] text-accent">{w.address}</span>
        <CopyButton text={w.address} />
        <a
          href={isSol ? explorerAddress(w.address) : evmExplorerAddress(w.address)}
          target="_blank" rel="noreferrer"
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line text-faint transition-colors hover:text-white"
          aria-label="View in explorer"
        >
          <ExternalLink size={11} />
        </a>
      </div>

      {/* secret */}
      <div className="mt-2 flex items-center gap-2 rounded-md border border-line bg-bg2 px-3 py-2">
        <span className="microlabel w-14 shrink-0">SECRET</span>
        <span className={`mono truncate text-[11px] ${reveal ? "text-danger" : "text-faint"}`}>
          {reveal ? w.secret : "•".repeat(44)}
        </span>
        <button
          onClick={() => setReveal((v) => !v)}
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded border border-line text-faint transition-colors hover:text-white"
          aria-label={reveal ? "Hide secret" : "Reveal secret"}
        >
          {reveal ? <EyeOff size={11} /> : <Eye size={11} />}
        </button>
        {reveal && <CopyButton text={w.secret} />}
      </div>

      {/* actions */}
      <div className="mt-4 flex items-center gap-2">
        {isSol && SOLANA_CLUSTER === "devnet" && onAirdrop && (
          <button
            onClick={onAirdrop}
            disabled={airdropping}
            className="mono flex h-7 items-center gap-1.5 rounded border border-[rgba(168,255,53,0.3)] bg-[rgba(168,255,53,0.06)] px-2.5 text-[9px] tracking-[0.14em] text-primary transition-all hover:brightness-110 disabled:opacity-40"
          >
            {airdropping ? <Loader2 size={10} className="animate-spin" /> : <Droplets size={10} />}
            AIRDROP 1 SOL
          </button>
        )}
        <button
          onClick={onRefresh}
          className="mono flex h-7 items-center gap-1.5 rounded border border-line px-2.5 text-[9px] tracking-[0.14em] text-muted transition-colors hover:text-white"
        >
          <RefreshCw size={10} /> REFRESH
        </button>
        <button
          onClick={() => (confirming ? onDelete() : setConfirming(true))}
          onBlur={() => setConfirming(false)}
          className={`mono ml-auto flex h-7 items-center gap-1.5 rounded border px-2.5 text-[9px] tracking-[0.14em] transition-colors ${
            confirming
              ? "border-[rgba(255,90,90,0.5)] bg-[rgba(255,90,90,0.1)] text-danger"
              : "border-line text-faint hover:text-danger"
          }`}
        >
          <Trash2 size={10} />
          {confirming ? "CONFIRM BURN" : "BURN"}
        </button>
      </div>
    </motion.div>
  );
}

export default function ProfilePage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const [wallets, setWallets] = useState<DevWallet[]>([]);
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [airdropping, setAirdropping] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [mainBalance, setMainBalance] = useState<string | null>(null);

  useEffect(() => setWallets(loadWallets()), []);

  const refreshBalance = useCallback(
    async (w: DevWallet) => {
      try {
        if (w.chain === "SOL") {
          const lamports = await connection.getBalance(new PublicKey(w.address));
          setBalances((b) => ({ ...b, [w.id]: (lamports / LAMPORTS_PER_SOL).toFixed(4) }));
        } else {
          const provider = new JsonRpcProvider(EVM_RPC);
          const wei = await provider.getBalance(w.address);
          setBalances((b) => ({ ...b, [w.id]: (+formatEther(wei)).toFixed(4) }));
        }
      } catch {
        setBalances((b) => ({ ...b, [w.id]: "?" }));
      }
    },
    [connection],
  );

  useEffect(() => {
    wallets.forEach((w) => {
      if (!(w.id in balances)) void refreshBalance(w);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wallets, refreshBalance]);

  useEffect(() => {
    if (!publicKey) return setMainBalance(null);
    connection
      .getBalance(publicKey)
      .then((l) => setMainBalance((l / LAMPORTS_PER_SOL).toFixed(4)))
      .catch(() => setMainBalance(null));
  }, [publicKey, connection]);

  const create = (chain: DevChain) => {
    const count = wallets.filter((w) => w.chain === chain).length + 1;
    const w = createDevWallet(chain, `${chain === "SOL" ? "SOL" : "ETH"} DEV ${count}`);
    setWallets(loadWallets());
    void refreshBalance(w);
  };

  const airdrop = async (w: DevWallet) => {
    setAirdropping(w.id);
    setNotice(null);
    try {
      const sig = await connection.requestAirdrop(new PublicKey(w.address), LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      await refreshBalance(w);
      setNotice(`1 SOL airdropped to ${w.label}.`);
    } catch (e) {
      setNotice(
        `Airdrop failed — devnet faucet is rate-limited. Try faucet.solana.com. (${e instanceof Error ? e.message.slice(0, 80) : "error"})`,
      );
    } finally {
      setAirdropping(null);
    }
  };

  const sols = wallets.filter((w) => w.chain === "SOL");
  const eths = wallets.filter((w) => w.chain === "ETH");
  const codename = agentCodename(publicKey?.toBase58() ?? null);

  return (
    <div className="py-10">
      <div className="mb-8">
        <p className="microlabel mb-2">OPERATIVE DOSSIER</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Profile</h1>
      </div>

      {/* operative card */}
      <div className="panel-elevated relative overflow-hidden p-6">
        <span className="stamp absolute right-5 top-5 text-warning">EYES ONLY</span>
        <div className="flex flex-wrap items-center gap-6">
          {/* seal */}
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-line bg-panel">
            <svg width="34" height="34" viewBox="0 0 24 24" fill="none" className="text-primary">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1" />
              <ellipse cx="12" cy="12" rx="10" ry="4.2" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
              <ellipse cx="12" cy="12" rx="4.2" ry="10" stroke="currentColor" strokeWidth="0.6" opacity="0.6" />
              <circle cx="12" cy="12" r="2" fill="currentColor" />
            </svg>
          </div>
          <div>
            <p className="microlabel">AGENT CODENAME</p>
            <p className="mono mt-1 text-xl font-medium text-white">{codename}</p>
          </div>
          <div>
            <p className="microlabel">FIELD WALLET</p>
            {publicKey ? (
              <p className="mono mt-1 flex items-center gap-2 text-[13px] text-accent">
                {publicKey.toBase58().slice(0, 6)}…{publicKey.toBase58().slice(-6)}
                <CopyButton text={publicKey.toBase58()} />
              </p>
            ) : (
              <button
                onClick={() => setVisible(true)}
                className="mono mt-1 text-[12px] text-primary hover:underline"
              >
                CONNECT WALLET →
              </button>
            )}
          </div>
          <div>
            <p className="microlabel">BALANCE</p>
            <p className="mono tnum mt-1 text-[13px] text-white">
              {mainBalance === null ? "—" : `${mainBalance} SOL`}
            </p>
          </div>
          <div>
            <p className="microlabel">NETWORK</p>
            <p className="mono mt-1 text-[13px] text-white">{SOLANA_CLUSTER.toUpperCase()}</p>
          </div>
          <div>
            <p className="microlabel">CLEARANCE</p>
            <p className="mono mt-1 text-[13px] text-primary">LEVEL {publicKey ? "III" : "I"}</p>
          </div>
        </div>
      </div>

      {/* warning */}
      <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(255,201,77,0.25)] bg-[rgba(255,201,77,0.05)] p-4">
        <ShieldAlert size={15} className="mt-0.5 shrink-0 text-warning" />
        <p className="text-[12px] leading-relaxed text-muted">
          Dev wallets are generated in your browser and stored in localStorage —
          they never leave this machine. They are for devnet and testnet
          operations only. Do not hold meaningful funds in a dev wallet; anyone
          with access to this browser profile can read the secret keys.
        </p>
      </div>

      {notice && (
        <div className="mono mt-4 rounded-md border border-line bg-panel px-4 py-3 text-[11px] text-muted">
          {notice}
        </div>
      )}

      {/* wallets */}
      <div className="mt-8 grid gap-8 lg:grid-cols-2">
        {(
          [
            { chain: "SOL" as DevChain, title: "Solana Dev Wallets", net: SOLANA_CLUSTER.toUpperCase(), color: "var(--accent)", list: sols },
            { chain: "ETH" as DevChain, title: "Robinhood / EVM Dev Wallets", net: EVM_NETWORK_LABEL, color: "var(--warning)", list: eths },
          ]
        ).map((sec) => (
          <section key={sec.chain}>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="flex items-center gap-2.5 text-lg font-semibold text-white">
                  <span className="h-1.5 w-1.5 rounded-full" style={{ background: sec.color }} />
                  {sec.title}
                </h2>
                <p className="mono mt-1 text-[9px] tracking-[0.16em] text-faint">
                  NETWORK {sec.net} · {sec.list.length} KEY{sec.list.length === 1 ? "" : "S"} ON FILE
                </p>
              </div>
              <button
                onClick={() => create(sec.chain)}
                className="flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-[12px] font-semibold text-black transition-all hover:brightness-110"
              >
                <Plus size={13} /> Create Wallet
              </button>
            </div>

            <div className="space-y-3">
              {sec.list.length === 0 && (
                <div className="panel flex flex-col items-center gap-2 border-dashed px-6 py-10 text-center">
                  <KeyRound size={18} className="text-faint" />
                  <p className="text-[13px] text-muted">No {sec.chain === "SOL" ? "Solana" : "EVM"} dev wallets on file.</p>
                  <p className="mono text-[9px] tracking-[0.14em] text-faint">
                    GENERATE A KEYPAIR TO BEGIN FIELD OPERATIONS
                  </p>
                </div>
              )}
              {sec.list.map((w) => (
                <WalletCard
                  key={w.id}
                  w={w}
                  balance={balances[w.id] ?? null}
                  airdropping={airdropping === w.id}
                  onAirdrop={w.chain === "SOL" ? () => airdrop(w) : undefined}
                  onRefresh={() => refreshBalance(w)}
                  onDelete={() => setWallets(deleteDevWallet(w.id))}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

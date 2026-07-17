"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2, HandCoins, Rocket } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { loadLaunches, type LaunchRecord } from "@/lib/launches";
import { readSolMission, claimSolCreatorFees } from "@/lib/meteora/trade";
import { readEvmMission } from "@/lib/evm/launch";
import { explorerAddress, explorerTx } from "@/lib/meteora/config";
import { evmExplorerAddress } from "@/lib/evm/config";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";

interface LiveStats {
  progressPct: number;
  graduated: boolean;
  detail: string; // price / reserve line
  creatorFees: string; // earned or unclaimed
  claimableSol: number;
}

export default function CreatorDashboard() {
  const [launches, setLaunches] = useState<LaunchRecord[]>([]);
  const [stats, setStats] = useState<Record<string, LiveStats | "error">>({});
  const [claiming, setClaiming] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const { connection } = useConnection();
  const wallet = useWallet();

  const loadStats = useCallback(
    async (l: LaunchRecord) => {
      try {
        if (l.chain === "SOLANA") {
          const s = await readSolMission(connection, l.address);
          if (!s) throw new Error("pool missing");
          setStats((m) => ({
            ...m,
            [l.id]: {
              progressPct: s.progressPct,
              graduated: s.graduated,
              detail: `${s.quoteReserveSol.toFixed(3)} / ${s.graduationSol.toFixed(1)} SOL`,
              creatorFees: `${s.creatorUnclaimedSol.toFixed(4)} SOL unclaimed`,
              claimableSol: s.creatorUnclaimedSol,
            },
          }));
        } else {
          const s = await readEvmMission(l.address);
          setStats((m) => ({
            ...m,
            [l.id]: {
              progressPct: s.progressPct,
              graduated: s.graduated,
              detail: `${s.realEth.toFixed(4)} / ${s.graduationEth.toFixed(3)} ETH`,
              creatorFees: `${s.totalCreatorFeesEth.toFixed(5)} ETH earned (auto-paid)`,
              claimableSol: 0,
            },
          }));
        }
      } catch {
        setStats((m) => ({ ...m, [l.id]: "error" }));
      }
    },
    [connection],
  );

  useEffect(() => {
    const ls = loadLaunches();
    setLaunches(ls);
    ls.forEach((l) => void loadStats(l));
  }, [loadStats]);

  const claim = async (l: LaunchRecord) => {
    if (!wallet.publicKey) return setNotice("Connect the creator wallet to claim fees.");
    setClaiming(l.id);
    setNotice(null);
    try {
      const sig = await claimSolCreatorFees(
        connection,
        { publicKey: wallet.publicKey, sendTransaction: wallet.sendTransaction },
        l.address,
      );
      setNotice(`Creator fees claimed for $${l.ticker} — tx ${sig.slice(0, 10)}…`);
      setTimeout(() => void loadStats(l), 1500);
    } catch (e) {
      setNotice(`Claim failed: ${e instanceof Error ? e.message.slice(0, 120) : e}`);
    } finally {
      setClaiming(null);
    }
  };

  return (
    <section className="mt-10">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-semibold text-white">
            <Rocket size={15} className="text-primary" />
            Creator Dashboard
          </h2>
          <p className="mono mt-1 text-[9px] tracking-[0.16em] text-faint">
            {launches.length} MISSION{launches.length === 1 ? "" : "S"} DEPLOYED FROM THIS STATION
          </p>
        </div>
        <Link
          href="/launch"
          className="flex h-9 items-center gap-2 rounded-md border border-line px-4 text-[12px] font-medium text-white transition-colors hover:bg-panel2"
        >
          Deploy Mission <ArrowRight size={13} />
        </Link>
      </div>

      {notice && (
        <div className="mono mb-4 rounded-md border border-line bg-panel px-4 py-3 text-[11px] text-muted">
          {notice}
        </div>
      )}

      {launches.length === 0 ? (
        <div className="panel flex flex-col items-center gap-2 border-dashed px-6 py-12 text-center">
          <Rocket size={18} className="text-faint" />
          <p className="text-[13px] text-muted">No missions deployed from this browser yet.</p>
          <Link href="/launch" className="mono text-[10px] tracking-[0.14em] text-primary hover:underline">
            FILE YOUR FIRST MISSION →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {launches.map((l) => {
            const s = stats[l.id];
            const live = s && s !== "error" ? s : null;
            return (
              <div key={l.id} className="panel p-5">
                <div className="flex flex-wrap items-center gap-4">
                  <Insignia image={l.image} ticker={l.ticker} size={38} />
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-[14px] font-semibold text-white">
                      {l.name} <span className="mono text-[11px] text-muted">${l.ticker}</span>
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <ChainBadge chain={l.chain} />
                      {live && <StatusBadge status={live.graduated ? "COMPLETE" : "ACTIVE"} />}
                      {s === "error" && (
                        <span className="mono text-[9px] tracking-[0.12em] text-danger">STATE UNAVAILABLE</span>
                      )}
                    </div>
                  </div>

                  <div className="ml-auto flex items-center gap-2">
                    {l.chain === "SOLANA" && live && live.claimableSol > 0.0001 && (
                      <button
                        onClick={() => claim(l)}
                        disabled={claiming === l.id}
                        className="mono flex h-8 items-center gap-1.5 rounded border border-[rgba(168,255,53,0.35)] bg-[rgba(168,255,53,0.07)] px-3 text-[9px] tracking-[0.12em] text-primary transition-all hover:brightness-110 disabled:opacity-40"
                      >
                        {claiming === l.id ? <Loader2 size={10} className="animate-spin" /> : <HandCoins size={10} />}
                        CLAIM FEES
                      </button>
                    )}
                    <a
                      href={l.chain === "SOLANA" ? explorerAddress(l.address) : evmExplorerAddress(l.address)}
                      target="_blank" rel="noreferrer"
                      className="flex h-8 w-8 items-center justify-center rounded border border-line text-faint transition-colors hover:text-white"
                      aria-label="Explorer"
                    >
                      <ExternalLink size={12} />
                    </a>
                    <Link
                      href={`/live/${l.address}`}
                      className="flex h-8 items-center gap-1.5 rounded-md bg-primary px-3.5 text-[11px] font-semibold text-black transition-all hover:brightness-110"
                    >
                      Trade <ArrowRight size={11} />
                    </Link>
                  </div>
                </div>

                {/* live curve strip */}
                <div className="mt-4 grid gap-4 border-t border-line pt-4 sm:grid-cols-[1fr_auto_auto]">
                  <div>
                    <div className="mb-1.5 flex justify-between">
                      <span className="microlabel">CURVE PROGRESS</span>
                      <span className="mono tnum text-[10px] text-muted">
                        {live ? `${live.progressPct.toFixed(1)}% · ${live.detail}` : "…"}
                      </span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${live?.progressPct ?? 0}%`,
                          background: live?.graduated ? "var(--accent)" : "var(--primary)",
                        }}
                      />
                    </div>
                  </div>
                  <div className="sm:pl-6">
                    <p className="microlabel">FEE / SHARE</p>
                    <p className="mono mt-1 text-[11px] text-white">
                      {(l.tradingFeeBps / 100).toFixed(2)}% · {l.creatorFeeShare}% TO YOU
                    </p>
                  </div>
                  <div className="sm:pl-6">
                    <p className="microlabel">CREATOR FEES</p>
                    <p className="mono mt-1 text-[11px] text-primary">{live?.creatorFees ?? "…"}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

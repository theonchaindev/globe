"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, ExternalLink, Loader2, HandCoins, Rocket } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { readRobinhoodToken } from "@/lib/evm/robinhood";
import { EmptyState } from "@/components/ui";
import { fetchAllLaunches, loadLaunches, recordLaunch, type LaunchRecord } from "@/lib/launches";
import { readSolMission, claimSolCreatorFees } from "@/lib/meteora/trade";
import { readEvmMission } from "@/lib/evm/launch";
import { readUniswapMission } from "@/lib/evm/uniswap";
import { readPumpMission, claimPumpCreatorFees } from "@/lib/pumpfun/launch";
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
  const [showImport, setShowImport] = useState(false);
  const [importAddr, setImportAddr] = useState("");
  const [importName, setImportName] = useState("");
  const [importTicker, setImportTicker] = useState("");
  const [importing, setImporting] = useState(false);

  const { connection } = useConnection();
  const wallet = useWallet();

  const loadStats = useCallback(
    async (l: LaunchRecord) => {
      try {
        if (l.venue === "pumpfun") {
          const s = await readPumpMission(connection, l.address);
          if (!s) throw new Error("curve missing");
          setStats((m) => ({
            ...m,
            [l.id]: {
              progressPct: s.progressPct,
              graduated: s.graduated,
              detail: `${s.marketCapSol.toFixed(2)} SOL mcap · ${s.realSolReserves.toFixed(3)} SOL raised`,
              creatorFees: `${s.creatorVaultSol.toFixed(4)} SOL in creator vault`,
              claimableSol: s.creatorVaultSol,
            },
          }));
        } else if (l.venue === "pons") {
          setStats((m) => ({
            ...m,
            [l.id]: {
              progressPct: 0,
              graduated: false,
              detail: "managed on Pons (Robinhood Chain)",
              creatorFees: "tracked on Pons",
              claimableSol: 0,
            },
          }));
        } else if (l.chain === "SOLANA") {
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
        } else if (l.venue === "uniswap") {
          const s = await readUniswapMission(l.address);
          setStats((m) => ({
            ...m,
            [l.id]: {
              progressPct: 100,
              graduated: false,
              detail: `${s.liquidityEth.toFixed(4)} ETH pool depth`,
              creatorFees: "0.30% of every swap accrues to your LP position",
              claimableSol: 0,
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

  /** Missions launched from this browser, plus any the connected wallet created elsewhere. */
  const me = wallet.publicKey?.toBase58();
  const loadMine = useCallback(async () => {
    const localIds = new Set(loadLaunches().map((l) => l.id));
    const ls = (await fetchAllLaunches()).filter(
      (l) => localIds.has(l.id) || (!!me && l.creator === me),
    );
    setLaunches(ls);
    ls.forEach((l) => void loadStats(l));
  }, [loadStats, me]);

  useEffect(() => {
    void loadMine();
  }, [loadMine]);

  const importMission = async () => {
    const addr = importAddr.trim();
    if (!addr) return;
    setImporting(true);
    setNotice(null);
    try {
      if (addr.startsWith("0x")) {
        // EVM — try the legacy curve contract first, then Uniswap venue
        try {
          const s = await readEvmMission(addr);
          recordLaunch({
            chain: "ROBINHOOD",
            name: s.name,
            ticker: s.symbol,
            address: addr,
            venue: "curve",
            txSignature: "",
            creator: s.creator,
            tradingFeeBps: s.feeBps,
            creatorFeeShare: Math.round(s.creatorFeeShareBps / 100),
            gradMcap: 0,
          });
        } catch {
          const s = await readUniswapMission(addr).catch(() => null);
          if (s) {
            recordLaunch({
              chain: "ROBINHOOD",
              name: s.name,
              ticker: s.symbol,
              address: addr,
              venue: "uniswap",
              pair: s.pair,
              txSignature: "",
              creator: "",
              tradingFeeBps: 30,
              creatorFeeShare: 100,
              gradMcap: 0,
            });
          } else {
            // a token launched on Pons — read it from Robinhood Chain itself
            const t = await readRobinhoodToken(addr);
            recordLaunch({
              chain: "ROBINHOOD",
              venue: "pons",
              name: t.name,
              ticker: t.symbol,
              address: addr,
              txSignature: "",
              creator: "",
              tradingFeeBps: 0,
              creatorFeeShare: 0,
              gradMcap: 0,
            });
          }
        }
      } else {
        // Solana — try Meteora pool, then pump.fun mint
        const s = await readSolMission(connection, addr).catch(() => null);
        if (s) {
          recordLaunch({
            chain: "SOLANA",
            name: importName.trim() || "Recovered Mission",
            ticker: (importTicker.trim() || "TOKEN").toUpperCase(),
            address: addr,
            mint: s.baseMint,
            txSignature: "",
            creator: s.creator,
            tradingFeeBps: 0,
            creatorFeeShare: 0,
            gradMcap: s.graduationSol,
          });
        } else {
          const ps = await readPumpMission(connection, addr);
          if (!ps) throw new Error("No DBC pool or pump.fun curve found at that address");
          recordLaunch({
            chain: "SOLANA",
            venue: "pumpfun",
            name: importName.trim() || "Recovered Mission",
            ticker: (importTicker.trim() || "TOKEN").toUpperCase(),
            address: addr,
            mint: addr,
            txSignature: "",
            creator: ps.creator,
            tradingFeeBps: 100,
            creatorFeeShare: 0,
            gradMcap: 0,
          });
        }
      }
      await loadMine();
      setImportAddr("");
      setImportName("");
      setImportTicker("");
      setShowImport(false);
      setNotice("Mission imported — live state loaded from chain.");
    } catch (e) {
      setNotice(`Import failed: ${e instanceof Error ? e.message.slice(0, 140) : e}`);
    } finally {
      setImporting(false);
    }
  };

  const claim = async (l: LaunchRecord) => {
    if (!wallet.publicKey) return setNotice("Connect the creator wallet to claim fees.");
    setClaiming(l.id);
    setNotice(null);
    try {
      const sig =
        l.venue === "pumpfun"
          ? await claimPumpCreatorFees(connection, {
              publicKey: wallet.publicKey,
              sendTransaction: wallet.sendTransaction,
            })
          : await claimSolCreatorFees(
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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="display-md flex items-center gap-2.5 text-[30px] text-white">
            <Rocket size={16} className="text-red" />
            Creator Dashboard
          </h2>
          <p className="mono mt-1 text-[9px] tracking-[0.16em] text-faint">
            {launches.length} MISSION{launches.length === 1 ? "" : "S"} ON FILE
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="btn btn-ghost btn-sm"
          >
            Import token
          </button>
          <Link
            href="/launch"
            className="btn btn-primary btn-sm"
          >
            Launch a token <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {showImport && (
        <div className="panel mb-4 p-5">
          <p className="microlabel mb-1">IMPORT MISSION FROM CHAIN</p>
          <p className="mb-4 text-[12px] leading-relaxed text-muted">
            Recover a launch that isn&apos;t in your records — paste the DBC pool
            address (Solana) or token contract address (EVM). The mission is
            verified on-chain before it&apos;s added.
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              value={importAddr}
              onChange={(e) => setImportAddr(e.target.value)}
              placeholder="Pool address or 0x contract address"
              className="mono h-9 min-w-[280px] flex-1 border border-line bg-bg2 px-3 text-[11px] text-white placeholder:text-faint focus:border-[rgba(232,224,208,0.4)] focus:outline-none"
            />
            {!importAddr.trim().startsWith("0x") && (
              <>
                <input
                  value={importName}
                  onChange={(e) => setImportName(e.target.value)}
                  placeholder="Name"
                  className="h-9 w-36 border border-line bg-bg2 px-3 text-[12px] text-white placeholder:text-faint focus:outline-none"
                />
                <input
                  value={importTicker}
                  onChange={(e) => setImportTicker(e.target.value)}
                  placeholder="Ticker"
                  maxLength={10}
                  className="mono h-9 w-24 border border-line bg-bg2 px-3 text-[12px] uppercase text-white placeholder:text-faint focus:outline-none"
                />
              </>
            )}
            <button
              onClick={importMission}
              disabled={importing || !importAddr.trim()}
              className="btn btn-primary btn-sm"
            >
              {importing && <Loader2 size={12} className="animate-spin" />}
              {importing ? "Verifying…" : "Import"}
            </button>
          </div>
        </div>
      )}

      {notice && (
        <div className="mono mb-4 border border-line bg-panel px-4 py-3 text-[11px] text-muted">
          {notice}
        </div>
      )}

      {launches.length === 0 ? (
        <EmptyState
          title="No missions yet"
          body="Launch one, or connect the wallet that created yours to see its fees here."
        />
      ) : (
        <div className="space-y-3">
          {launches.map((l) => {
            const s = stats[l.id];
            const live = s && s !== "error" ? s : null;
            return (
              <div key={l.id} className="card card-hover p-5">
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
                        className="mono flex h-8 items-center gap-1.5 rounded border border-[rgba(232,224,208,0.35)] bg-[rgba(232,224,208,0.07)] px-3 text-[9px] tracking-[0.12em] text-primary transition-all hover:brightness-110 disabled:opacity-40"
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
                      className="btn btn-primary btn-sm"
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

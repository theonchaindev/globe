"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, KeyRound } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { getLaunch, type LaunchRecord } from "@/lib/launches";
import { loadWallets, type DevWallet } from "@/lib/devwallets";
import {
  readSolMission, quoteSolSwap, solSwap, type SolMissionState,
} from "@/lib/meteora/trade";
import {
  readEvmMission, quoteEvmBuy, quoteEvmSell, evmBuy, evmSell,
  evmTokenBalance, type EvmMissionState,
} from "@/lib/evm/launch";
import { SOLANA_CLUSTER, explorerAddress, explorerTx } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL, evmExplorerAddress, evmExplorerTx } from "@/lib/evm/config";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";

type Side = "buy" | "sell";

export default function LiveMissionClient({ address }: { address: string }) {
  const [record, setRecord] = useState<LaunchRecord | null | undefined>(undefined);
  const [sol, setSol] = useState<SolMissionState | null>(null);
  const [evm, setEvm] = useState<EvmMissionState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  // trading state
  const [side, setSide] = useState<Side>("buy");
  const [amount, setAmount] = useState("0.1");
  const [quote, setQuote] = useState<string | null>(null);
  const [trading, setTrading] = useState(false);
  const [tradeMsg, setTradeMsg] = useState<{ ok: boolean; text: string; href?: string } | null>(null);
  const [holdings, setHoldings] = useState<number | null>(null);

  // EVM signer
  const [devWallets, setDevWallets] = useState<DevWallet[]>([]);
  const [devWalletId, setDevWalletId] = useState<string | null>(null);

  const { connection } = useConnection();
  const wallet = useWallet();
  const { setVisible } = useWalletModal();

  const chain = record?.chain ?? (sol ? "SOLANA" : evm ? "ROBINHOOD" : null);
  const isEvm = chain === "ROBINHOOD";
  const unit = isEvm ? "ETH" : "SOL";
  const ticker = record?.ticker ?? evm?.symbol ?? "TOKEN";

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const rec = getLaunch(address);
    setRecord(rec);
    // retry a few times — fresh deploys can lag behind the RPC's view
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        if (rec?.chain === "ROBINHOOD" || (!rec && address.startsWith("0x"))) {
          const s = await readEvmMission(address);
          setEvm(s);
          break;
        } else {
          const s = await readSolMission(connection, address);
          if (s) {
            setSol(s);
            break;
          }
          if (attempt === 3) setLoadError("Pool account not found yet — it may still be confirming.");
        }
      } catch (e) {
        if (attempt === 3) setLoadError(e instanceof Error ? e.message : String(e));
      }
      if (attempt < 3) await new Promise((r) => setTimeout(r, 2000));
    }
    setLoading(false);
  }, [address, connection]);

  useEffect(() => {
    void refresh();
    const eths = loadWallets().filter((w) => w.chain === "ETH");
    setDevWallets(eths);
    if (eths[0]) setDevWalletId((id) => id ?? eths[0].id);
  }, [refresh]);

  // holdings
  useEffect(() => {
    if (isEvm && devWalletId) {
      const w = devWallets.find((d) => d.id === devWalletId);
      if (w) evmTokenBalance(address, w.address).then(setHoldings).catch(() => setHoldings(null));
    }
  }, [isEvm, devWalletId, devWallets, address, tradeMsg]);

  // live quote
  useEffect(() => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return setQuote(null);
    const t = setTimeout(async () => {
      try {
        if (isEvm) {
          const q = side === "buy" ? await quoteEvmBuy(address, n) : await quoteEvmSell(address, n);
          setQuote(
            side === "buy"
              ? `≈ ${("tokensOut" in q ? q.tokensOut : 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ticker}`
              : `≈ ${("ethOut" in q ? q.ethOut : 0).toFixed(6)} ETH`,
          );
        } else if (sol) {
          const q = await quoteSolSwap(connection, address, n, side);
          setQuote(
            side === "buy"
              ? `≈ ${q.amountOut.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ticker}`
              : `≈ ${q.amountOut.toFixed(6)} SOL`,
          );
        }
      } catch {
        setQuote("quote unavailable");
      }
    }, 350);
    return () => clearTimeout(t);
  }, [amount, side, isEvm, sol, address, connection, ticker]);

  const trade = async () => {
    const n = parseFloat(amount);
    if (!n || n <= 0) return;
    setTrading(true);
    setTradeMsg(null);
    try {
      if (isEvm) {
        const dev = devWallets.find((d) => d.id === devWalletId);
        if (!dev) throw new Error("Select a dev wallet to sign the trade.");
        const hash = side === "buy" ? await evmBuy(dev, address, n) : await evmSell(dev, address, n);
        setTradeMsg({ ok: true, text: `${side.toUpperCase()} confirmed`, href: evmExplorerTx(hash) });
      } else {
        if (!wallet.publicKey) {
          setVisible(true);
          setTrading(false);
          return;
        }
        const sig = await solSwap(
          connection,
          { publicKey: wallet.publicKey, sendTransaction: wallet.sendTransaction },
          address, n, side,
        );
        setTradeMsg({ ok: true, text: `${side.toUpperCase()} submitted`, href: explorerTx(sig) });
      }
      setTimeout(() => void refresh(), 1500);
    } catch (e) {
      setTradeMsg({ ok: false, text: e instanceof Error ? e.message.slice(0, 140) : String(e) });
    } finally {
      setTrading(false);
    }
  };

  const stats = useMemo(() => {
    if (isEvm && evm) {
      return [
        ["PRICE", `${evm.priceEth.toExponential(3)} ETH`],
        ["MARKET CAP", `${evm.marketCapEth.toFixed(2)} ETH`],
        ["CURVE RESERVE", `${evm.realEth.toFixed(4)} ETH`],
        ["CURVE INVENTORY", `${evm.curveTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })}`],
        ["TRADING FEE", `${(evm.feeBps / 100).toFixed(2)}%`],
      ] as Array<[string, string]>;
    }
    if (sol) {
      return [
        ["PRICE", `${sol.priceSol.toExponential(3)} SOL`],
        ["QUOTE RESERVE", `${sol.quoteReserveSol.toFixed(4)} SOL`],
        ["GRADUATION AT", `${sol.graduationSol.toFixed(2)} SOL`],
        ["CREATOR UNCLAIMED", `${sol.creatorUnclaimedSol.toFixed(4)} SOL`],
      ] as Array<[string, string]>;
    }
    return [];
  }, [isEvm, evm, sol]);

  const progress = isEvm ? evm?.progressPct ?? 0 : sol?.progressPct ?? 0;
  const graduated = isEvm ? evm?.graduated ?? false : sol?.graduated ?? false;
  const found = !!(sol || evm);

  return (
    <div className="py-10">
      <Link href="/profile" className="mono mb-8 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted transition-colors hover:text-white">
        <ArrowLeft size={13} /> CREATOR DASHBOARD
      </Link>

      {loading && (
        <div className="panel flex items-center justify-center gap-3 py-24 text-muted">
          <Loader2 size={16} className="animate-spin" />
          <span className="mono text-[11px] tracking-[0.16em]">READING CURVE STATE FROM CHAIN…</span>
        </div>
      )}

      {!loading && !found && (
        <div className="panel px-8 py-16 text-center">
          <p className="text-[15px] font-medium text-white">Mission not found on-chain</p>
          <p className="mono mt-2 text-[11px] text-faint">{address}</p>
          {loadError && <p className="mono mt-3 text-[10px] text-danger">{loadError}</p>}
        </div>
      )}

      {!loading && found && (
        <>
          {/* header */}
          <div className="panel-elevated relative overflow-hidden p-6">
            <div className="flex flex-wrap items-center gap-5">
              <Insignia image={record?.image} ticker={ticker} size={52} />
              <div>
                <p className="microlabel">LIVE MISSION — {isEvm ? EVM_NETWORK_LABEL : SOLANA_CLUSTER.toUpperCase()}</p>
                <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white">
                  {record?.name ?? evm?.name ?? "Mission"}{" "}
                  <span className="mono text-base text-muted">${ticker}</span>
                </h1>
                <div className="mt-2 flex items-center gap-2.5">
                  <ChainBadge chain={isEvm ? "ROBINHOOD" : "SOLANA"} />
                  <StatusBadge status={graduated ? "COMPLETE" : "ACTIVE"} />
                  <a
                    href={isEvm ? evmExplorerAddress(address) : explorerAddress(address)}
                    target="_blank" rel="noreferrer"
                    className="mono flex items-center gap-1 text-[10px] text-accent hover:underline"
                  >
                    {address.slice(0, 8)}…{address.slice(-6)} <ExternalLink size={10} />
                  </a>
                </div>
              </div>
              <button
                onClick={() => void refresh()}
                className="mono ml-auto flex h-8 items-center gap-2 rounded-md border border-line px-3 text-[10px] tracking-[0.14em] text-muted transition-colors hover:text-white"
              >
                <RefreshCw size={11} /> REFRESH
              </button>
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_380px]">
            {/* left: curve state */}
            <div className="space-y-4">
              <div className="panel p-6">
                <div className="mb-2 flex items-baseline justify-between">
                  <p className="microlabel">CURVE PROGRESS TO GRADUATION</p>
                  <p className="mono tnum text-[13px] text-white">{progress.toFixed(1)}%</p>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[rgba(255,255,255,0.06)]">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${progress}%`, background: graduated ? "var(--accent)" : "var(--primary)" }}
                  />
                </div>
                {graduated && (
                  <p className="mono mt-3 text-[10px] tracking-[0.14em] text-accent">
                    MISSION GRADUATED — {isEvm ? "CURVE FLAGGED COMPLETE" : "MIGRATED TO DAMM V2"}
                  </p>
                )}
              </div>

              <div className="panel grid grid-cols-2 divide-[rgba(255,255,255,0.08)] sm:grid-cols-3 lg:grid-cols-5 sm:divide-x">
                {stats.map(([k, v]) => (
                  <div key={k} className="px-4 py-4">
                    <p className="microlabel">{k}</p>
                    <p className="mono tnum mt-1 text-[13px] text-white">{v}</p>
                  </div>
                ))}
              </div>

              {record && (
                <div className="panel p-6">
                  <p className="microlabel mb-4">DEPLOYMENT RECORD</p>
                  <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
                    {(
                      [
                        ["TRADING FEE", `${(record.tradingFeeBps / 100).toFixed(2)}%`],
                        ["CREATOR FEE SHARE", `${record.creatorFeeShare}%`],
                        ["GRAD TARGET", `${record.gradMcap} ${unit} MCAP`],
                        ["CREATOR", `${record.creator.slice(0, 8)}…`],
                        ["DEPLOYED", new Date(record.createdAt).toISOString().slice(0, 16).replace("T", " ")],
                      ] as const
                    ).map(([k, v]) => (
                      <div key={k}>
                        <dt className="microlabel">{k}</dt>
                        <dd className="mono mt-1 text-[12px] text-white">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}
            </div>

            {/* right: trade panel */}
            <div className="panel-elevated h-fit p-6">
              <p className="microlabel mb-4">TRADING DESK</p>

              <div className="flex overflow-hidden rounded-md border border-line">
                {(["buy", "sell"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSide(s); setAmount(s === "buy" ? "0.1" : "1000"); }}
                    className={`h-10 flex-1 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                      side === s
                        ? s === "buy"
                          ? "bg-[rgba(232,224,208,0.12)] text-primary"
                          : "bg-[rgba(168,75,66,0.12)] text-danger"
                        : "text-muted hover:text-white"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>

              <label className="mt-5 block">
                <span className="microlabel mb-2 block">
                  {side === "buy" ? `SPEND (${unit})` : `SELL (${ticker})`}
                </span>
                <input
                  value={amount}
                  onChange={(e) => setAmount(e.target.value.replace(/[^0-9.]/g, ""))}
                  className="mono h-11 w-full rounded-md border border-line bg-bg2 px-3.5 text-[15px] text-white focus:border-[rgba(232,224,208,0.4)] focus:outline-none"
                  inputMode="decimal"
                />
              </label>

              <div className="mono mt-2 flex justify-between text-[10px] text-faint">
                <span>{quote ?? "—"}</span>
                {holdings !== null && isEvm && (
                  <span>BAL {holdings.toLocaleString(undefined, { maximumFractionDigits: 0 })} {ticker}</span>
                )}
              </div>

              {/* quick amounts */}
              <div className="mt-3 flex gap-2">
                {(side === "buy" ? ["0.05", "0.1", "0.5", "1"] : ["25%", "50%", "100%"]).map((q) => (
                  <button
                    key={q}
                    onClick={() => {
                      if (q.endsWith("%") && holdings !== null) {
                        setAmount(((holdings * parseInt(q)) / 100).toString());
                      } else if (!q.endsWith("%")) {
                        setAmount(q);
                      }
                    }}
                    className="mono h-7 flex-1 rounded border border-line text-[10px] text-muted transition-colors hover:text-white"
                  >
                    {q}
                  </button>
                ))}
              </div>

              {/* EVM signer picker */}
              {isEvm && (
                <div className="mt-5">
                  <p className="microlabel mb-2">SIGNING WALLET</p>
                  {devWallets.length === 0 ? (
                    <p className="text-[12px] text-muted">
                      No EVM dev wallet —{" "}
                      <Link href="/profile" className="text-primary hover:underline">create one</Link>.
                    </p>
                  ) : (
                    <select
                      value={devWalletId ?? ""}
                      onChange={(e) => setDevWalletId(e.target.value)}
                      className="mono h-9 w-full rounded-md border border-line bg-bg2 px-3 text-[11px] text-white focus:outline-none"
                    >
                      {devWallets.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.label} — {w.address.slice(0, 10)}…
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
              {!isEvm && !wallet.publicKey && (
                <p className="mt-5 text-[12px] text-muted">
                  <button onClick={() => setVisible(true)} className="text-primary hover:underline">
                    Connect a Solana wallet
                  </button>{" "}
                  to trade.
                </p>
              )}

              <button
                onClick={trade}
                disabled={trading || !parseFloat(amount)}
                className={`mt-6 flex h-12 w-full items-center justify-center gap-2 rounded-md text-[14px] font-bold tracking-[0.1em] transition-all disabled:cursor-not-allowed disabled:opacity-40 ${
                  side === "buy" ? "bg-primary text-black hover:brightness-110" : "bg-danger text-white hover:brightness-110"
                }`}
              >
                {trading && <Loader2 size={15} className="animate-spin" />}
                {trading ? "SUBMITTING…" : side === "buy" ? `ACQUIRE $${ticker}` : `LIQUIDATE $${ticker}`}
              </button>

              {tradeMsg && (
                <div
                  className={`mono mt-4 rounded-md border p-3 text-[10px] leading-relaxed ${
                    tradeMsg.ok
                      ? "border-[rgba(232,224,208,0.3)] bg-[rgba(232,224,208,0.06)] text-primary"
                      : "border-[rgba(168,75,66,0.3)] bg-[rgba(168,75,66,0.06)] text-danger"
                  }`}
                >
                  {tradeMsg.text}
                  {tradeMsg.href && (
                    <a href={tradeMsg.href} target="_blank" rel="noreferrer" className="ml-2 underline">
                      VIEW TX
                    </a>
                  )}
                </div>
              )}

              <p className="mono mt-4 text-center text-[8px] tracking-[0.16em] text-faint">
                1% MAX SLIPPAGE // {isEvm ? "SIGNED BY DEV WALLET" : "SIGNED BY CONNECTED WALLET"}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ExternalLink, Loader2, RefreshCw, KeyRound } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { motion } from "framer-motion";
import { fetchLaunch, type LaunchRecord } from "@/lib/launches";
import { Decrypt, Lines, Reveal } from "@/components/motion";
import { Bar, EmptyState } from "@/components/ui";
import { loadWallets, type DevWallet } from "@/lib/devwallets";
import {
  readSolMission, quoteSolSwap, solSwap, type SolMissionState,
} from "@/lib/meteora/trade";
import {
  readEvmMission, quoteEvmBuy, quoteEvmSell, evmBuy, evmSell,
  evmTokenBalance, type EvmMissionState,
} from "@/lib/evm/launch";
import {
  readUniswapMission, quoteUniswap, uniswapBuy, uniswapSell,
  type UniswapMissionState,
} from "@/lib/evm/uniswap";
import {
  readPumpMission, quotePumpSwap, pumpSwap, pumpfunUrl,
  type PumpMissionState,
} from "@/lib/pumpfun/launch";
import { SOLANA_CLUSTER, explorerAddress, explorerTx } from "@/lib/meteora/config";
import { EVM_NETWORK_LABEL, evmExplorerAddress, evmExplorerTx } from "@/lib/evm/config";
import { ChainBadge, StatusBadge } from "@/components/Badges";
import Insignia from "@/components/Insignia";

type Side = "buy" | "sell";

export default function LiveMissionClient({ address }: { address: string }) {
  const [record, setRecord] = useState<LaunchRecord | null | undefined>(undefined);
  const [sol, setSol] = useState<SolMissionState | null>(null);
  const [evm, setEvm] = useState<EvmMissionState | null>(null);
  const [uni, setUni] = useState<UniswapMissionState | null>(null);
  const [pump, setPump] = useState<PumpMissionState | null>(null);
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

  const chain = record?.chain ?? (sol || pump ? "SOLANA" : evm || uni ? "ROBINHOOD" : null);
  const isEvm = chain === "ROBINHOOD";
  const isUni = !!uni;
  const isPump = !!pump;
  const unit = isEvm ? "ETH" : "SOL";
  const ticker = record?.ticker ?? uni?.symbol ?? evm?.symbol ?? "TOKEN";

  const refresh = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    const rec = await fetchLaunch(address);
    setRecord(rec);
    // retry a few times — fresh deploys can lag behind the RPC's view
    for (let attempt = 0; attempt < 4; attempt++) {
      try {
        // pump.fun is the live Solana venue — try it first for any unknown Solana address
        if (rec?.venue === "pumpfun" || (!rec && !address.startsWith("0x"))) {
          const s = await readPumpMission(connection, address).catch(() => null);
          if (s) {
            setPump(s);
            break;
          }
          if (!rec) {
            // not a pump coin — maybe a legacy Meteora pool
            const m = await readSolMission(connection, address).catch(() => null);
            if (m) {
              setSol(m);
              break;
            }
          }
          if (attempt === 3) setLoadError("No token found at this address yet — if you just launched it, it may still be confirming.");
        } else if (rec?.venue === "uniswap") {
          setUni(await readUniswapMission(address));
          break;
        } else if (rec?.chain === "ROBINHOOD" || (!rec && address.startsWith("0x"))) {
          try {
            const s = await readEvmMission(address);
            setEvm(s);
          } catch {
            // not a curve contract — try Uniswap venue
            setUni(await readUniswapMission(address));
          }
          break;
        } else {
          const s = await readSolMission(connection, address);
          if (s) {
            setSol(s);
            break;
          }
          // not a Meteora pool — maybe a pump.fun mint
          const ps = await readPumpMission(connection, address).catch(() => null);
          if (ps) {
            setPump(ps);
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
        if (isPump) {
          const out = await quotePumpSwap(connection, address, n, side);
          setQuote(
            side === "buy"
              ? `\u2248 ${out.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ticker}`
              : `\u2248 ${out.toFixed(6)} SOL`,
          );
        } else if (isUni) {
          const q = await quoteUniswap(address, n, side);
          setQuote(
            side === "buy"
              ? `\u2248 ${q.out.toLocaleString(undefined, { maximumFractionDigits: 0 })} ${ticker}`
              : `\u2248 ${q.out.toFixed(6)} ETH`,
          );
        } else if (isEvm) {
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
      if (isPump) {
        if (!wallet.publicKey) {
          setVisible(true);
          setTrading(false);
          return;
        }
        const sig = await pumpSwap(
          connection,
          { publicKey: wallet.publicKey, sendTransaction: wallet.sendTransaction },
          address, n, side,
        );
        setTradeMsg({ ok: true, text: `${side.toUpperCase()} confirmed`, href: explorerTx(sig) });
      } else if (isEvm) {
        const dev = devWallets.find((d) => d.id === devWalletId);
        if (!dev) throw new Error("Select a dev wallet to sign the trade.");
        const hash = isUni
          ? side === "buy"
            ? await uniswapBuy(dev, address, n)
            : await uniswapSell(dev, address, n)
          : side === "buy"
            ? await evmBuy(dev, address, n)
            : await evmSell(dev, address, n);
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
    if (pump) {
      return [
        ["PRICE", `${pump.priceSol.toExponential(3)} SOL`],
        ["MARKET CAP", `${pump.marketCapSol.toFixed(2)} SOL`],
        ["CURVE RESERVE", `${pump.realSolReserves.toFixed(4)} SOL`],
        ["CREATOR VAULT", `${pump.creatorVaultSol.toFixed(4)} SOL`],
        ["VENUE", "PUMP.FUN"],
      ] as Array<[string, string]>;
    }
    if (uni) {
      return [
        ["PRICE", `${uni.priceEth.toExponential(3)} ETH`],
        ["MARKET CAP", `${uni.marketCapEth.toFixed(2)} ETH`],
        ["POOL LIQUIDITY", `${uni.liquidityEth.toFixed(4)} ETH`],
        ["POOL TOKENS", uni.poolTokens.toLocaleString(undefined, { maximumFractionDigits: 0 })],
        ["SWAP FEE", "0.30% \u2192 LP"],
      ] as Array<[string, string]>;
    }
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
  }, [isEvm, evm, sol, uni, pump]);

  const progress = isPump ? pump?.progressPct ?? 0 : isUni ? 100 : isEvm ? evm?.progressPct ?? 0 : sol?.progressPct ?? 0;
  const graduated = isPump ? pump?.graduated ?? false : isUni ? false : isEvm ? evm?.graduated ?? false : sol?.graduated ?? false;
  const found = !!(sol || evm || uni || pump);

  return (
    <div className="wrap pt-28 sm:pt-32">
      <Link href="/explore" className="mono group mb-8 inline-flex items-center gap-2 text-[11px] tracking-[0.14em] text-muted transition-colors hover:text-white">
        <ArrowLeft size={13} className="transition-transform group-hover:-translate-x-0.5" /> ALL MISSIONS
      </Link>

      {loading && (
        <div className="space-y-4">
          <div className="card flex items-center gap-5 p-6">
            <div className="skeleton h-[52px] w-[52px] rounded-full" />
            <div className="space-y-2.5">
              <div className="skeleton h-2 w-40" />
              <div className="skeleton h-5 w-56" />
            </div>
            <span className="mono ml-auto hidden items-center gap-2 text-[10px] tracking-[0.16em] text-faint sm:flex">
              <Loader2 size={12} className="animate-spin" />
              <Decrypt text="READING CURVE STATE FROM CHAIN" trigger="mount" />
            </span>
          </div>
          <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
            <div className="card h-64 p-6"><div className="skeleton h-2 w-full" /></div>
            <div className="card h-64 p-6"><div className="skeleton h-10 w-full" /></div>
          </div>
        </div>
      )}

      {!loading && !found && (
        <EmptyState
          title="Mission not found on-chain"
          body={
            <>
              <span className="mono block break-all text-[11px] text-faint">{address}</span>
              {loadError && <span className="mt-3 block text-[13px]">{loadError}</span>}
            </>
          }
          cta={{ href: "/explore", label: "Browse missions" }}
        />
      )}

      {!loading && found && (
        <>
          {/* header */}
          <Reveal immediate className="relative border-b border-line-strong pb-10">
            <p className="microlabel flex items-center gap-3 !text-muted">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-red" />
              LIVE MISSION — {isEvm ? EVM_NETWORK_LABEL : SOLANA_CLUSTER.toUpperCase()}
            </p>
            <div className="mt-6 flex flex-wrap items-end gap-6">
              <Insignia image={record?.image} ticker={ticker} size={72} />
              <div className="min-w-0">
                <h1 className="display text-[64px] text-white sm:text-[110px]">
                  <Lines immediate lines={[`$${ticker}`]} />
                </h1>
                <p className="display-md mt-1 text-[24px] text-muted">{record?.name ?? evm?.name ?? "Unlisted mission"}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2.5">
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
              <button onClick={() => void refresh()} className="btn btn-ghost btn-sm sm:ml-auto">
                <RefreshCw size={12} /> Refresh
              </button>
            </div>
          </Reveal>

          <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_400px]">
            {/* left: curve state */}
            <div className="space-y-12">
              <div>
                <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
                  <p className="microlabel">{isUni ? "UNISWAP V2 POOL \u2014 LIVE" : isPump ? "PUMP.FUN CURVE \u2014 PROGRESS TO PUMPSWAP" : "CURVE PROGRESS TO GRADUATION"}</p>
                  <p className="display text-[72px] leading-[0.8] text-white sm:text-[96px]">
                    {isUni ? `${uni?.liquidityEth.toFixed(3)} ETH` : <>{progress.toFixed(1)}<span className="text-red">%</span></>}
                  </p>
                </div>
                <Bar pct={progress} done={graduated} className="!h-1.5" />
                {graduated && (
                  <p className="mono mt-3 text-[10px] tracking-[0.14em] text-accent">
                    MISSION GRADUATED — {isEvm ? "CURVE FLAGGED COMPLETE" : isPump ? "MIGRATED TO PUMPSWAP" : "MIGRATED TO DAMM V2"}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-px border border-line bg-line sm:grid-cols-3 lg:grid-cols-5">
                {stats.map(([k, v]) => (
                  <div key={k} className="bg-bg px-5 py-5">
                    <p className="microlabel">{k}</p>
                    <p className="display-md tnum mt-2 text-[24px] text-white">{v}</p>
                  </div>
                ))}
              </div>

              {record && (
                <div className="border-t border-line pt-8">
                  <p className="microlabel mb-5">Deployment record</p>
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
            <div className="brackets h-fit border border-line bg-panel p-6 lg:sticky lg:top-28">
              <p className="microlabel mb-5">Trading desk</p>

              <div className="flex border border-line p-0.5">
                {(["buy", "sell"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => { setSide(s); setAmount(s === "buy" ? "0.1" : "1000"); }}
                    className={`relative h-10 flex-1 text-[13px] font-semibold uppercase tracking-[0.1em] transition-colors duration-300 ${
                      side === s ? (s === "buy" ? "text-white" : "text-black") : "text-muted hover:text-white"
                    }`}
                  >
                    {side === s && (
                      <motion.span
                        layoutId="trade-side"
                        className="absolute inset-0"
                        style={{ background: s === "buy" ? "var(--red)" : "rgba(244,242,238,0.9)" }}
                        transition={{ type: "spring", stiffness: 420, damping: 34 }}
                      />
                    )}
                    <span className="relative">{s}</span>
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
                  className="mono h-12 w-full border border-line bg-bg2 px-3.5 text-[16px] text-white transition-all focus:border-line-strong focus:outline-none focus:ring-4 focus:ring-[rgba(232,224,208,0.05)]"
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
                      className="mono h-9 w-full border border-line bg-bg2 px-3 text-[11px] text-white focus:outline-none"
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
                className={`btn mt-6 !h-14 w-full !text-[12px] ${side === "buy" ? "btn-primary" : "btn-light"}`}
              >
                {trading && <Loader2 size={15} className="animate-spin" />}
                {trading ? "SUBMITTING…" : side === "buy" ? `ACQUIRE $${ticker}` : `LIQUIDATE $${ticker}`}
              </button>

              {tradeMsg && (
                <div
                  className={`mono mt-4 border p-3 text-[10px] leading-relaxed ${
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

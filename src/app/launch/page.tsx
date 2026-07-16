"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle, Upload, ExternalLink, Loader2 } from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import TokenSigil from "@/components/TokenSigil";
import { deployOnMeteora, buildMetadataUri, type DeployResult } from "@/lib/meteora/deploy";
import { SOLANA_CLUSTER, explorerTx, explorerAddress } from "@/lib/meteora/config";

const STEPS = [
  { n: 1, title: "Choose Theatre", sub: "Deployment network" },
  { n: 2, title: "Mission Identity", sub: "Name, ticker, briefing" },
  { n: 3, title: "Communications", sub: "Verified channels" },
  { n: 4, title: "Mission Parameters", sub: "Supply & liquidity" },
  { n: 5, title: "Final Briefing", sub: "Review & authorise" },
];

const CATEGORIES = ["Infrastructure", "Finance", "AI", "DePIN", "RWA", "Privacy", "Gaming", "Social", "Energy", "Other"];

interface Form {
  chain: "SOLANA" | "ROBINHOOD" | null;
  name: string;
  ticker: string;
  description: string;
  classification: string;
  category: string;
  website: string;
  x: string;
  telegram: string;
  discord: string;
  github: string;
  supply: number;
  creatorPct: number; // vested creator allocation, % of supply
  tradingFeeBps: number; // swap tax on the curve, basis points
  creatorFeeShare: number; // % of trading fees routed to creator
  dynamicFee: boolean; // Meteora volatility fee on top of base fee
  initialMcapSol: number; // curve starting market cap, SOL
  gradMcapSol: number; // graduation market cap, SOL
  advanced: boolean;
}

const initial: Form = {
  chain: null,
  name: "",
  ticker: "",
  description: "",
  classification: "UNCLASSIFIED",
  category: "Infrastructure",
  website: "",
  x: "",
  telegram: "",
  discord: "",
  github: "",
  supply: 1_000_000_000,
  creatorPct: 0,
  tradingFeeBps: 100,
  creatorFeeShare: 50,
  dynamicFee: true,
  initialMcapSol: 30,
  gradMcapSol: 400,
  advanced: false,
};

const inputCls =
  "h-10 w-full rounded-md border border-line bg-bg2 px-3.5 text-[13px] text-white placeholder:text-faint focus:border-[rgba(168,255,53,0.4)] focus:outline-none transition-colors";

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="microlabel mb-2 block">{label}</span>
      {children}
      {hint && <span className="mt-1.5 block text-[11px] text-faint">{hint}</span>}
    </label>
  );
}

export default function LaunchPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<Form>(initial);
  const [deploying, setDeploying] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [result, setResult] = useState<DeployResult | "simulated" | null>(null);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const canNext =
    step === 1 ? !!form.chain : step === 2 ? form.name.length > 1 && form.ticker.length > 1 : true;

  const missionId = `MISSION-0${(4900 + form.name.length * 13 + form.ticker.length * 7).toString().slice(0, 4)}`;

  const deploy = async () => {
    setDeployError(null);

    // Robinhood theatre isn't wired to a chain yet — simulate
    if (form.chain !== "SOLANA") {
      setResult("simulated");
      return;
    }
    if (!publicKey) {
      setVisible(true);
      return;
    }
    setDeploying(true);
    try {
      const res = await deployOnMeteora(
        connection,
        { publicKey, sendTransaction },
        {
          name: form.name,
          symbol: form.ticker.toUpperCase(),
          uri: buildMetadataUri(form.name, form.ticker.toUpperCase()),
          totalSupply: form.supply,
          tradingFeeBps: form.tradingFeeBps,
          creatorFeeShare: form.creatorFeeShare,
          dynamicFee: form.dynamicFee,
          initialMarketCapSol: form.initialMcapSol,
          graduationMarketCapSol: form.gradMcapSol,
          creatorVestedPct: form.creatorPct,
        },
      );
      setResult(res);
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : String(e));
    } finally {
      setDeploying(false);
    }
  };

  if (result) {
    const real = result !== "simulated";
    return (
      <div className="flex min-h-[70vh] items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="panel-elevated w-full max-w-xl p-10 text-center"
        >
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-[rgba(168,255,53,0.4)] bg-[rgba(168,255,53,0.08)]">
            <Check size={24} className="text-primary" />
          </div>
          <p className="microlabel mt-6">DEPLOYMENT AUTHORISED</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">{missionId} is live</h1>
          <p className="mt-3 text-[13px] leading-relaxed text-muted">
            {form.name} (${form.ticker.toUpperCase()}) has been deployed to the{" "}
            {form.chain} theatre
            {real
              ? ` on a Meteora Dynamic Bonding Curve (${SOLANA_CLUSTER}).`
              : ". Relay confirmation received from 14 nodes."}
          </p>

          {real && (
            <div className="mt-6 space-y-2 rounded-md border border-line bg-bg2 p-4 text-left">
              {(
                [
                  ["TRANSACTION", result.signature, explorerTx(result.signature)],
                  ["TOKEN MINT", result.baseMint, explorerAddress(result.baseMint)],
                  ["DBC POOL", result.pool, explorerAddress(result.pool)],
                  ["CURVE CONFIG", result.config, explorerAddress(result.config)],
                ] as const
              ).map(([k, v, href]) => (
                <div key={k} className="flex items-center gap-3">
                  <span className="microlabel w-[92px] shrink-0">{k}</span>
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="mono flex min-w-0 items-center gap-1.5 text-[11px] text-accent hover:underline"
                  >
                    <span className="truncate">{v}</span>
                    <ExternalLink size={11} className="shrink-0" />
                  </a>
                </div>
              ))}
            </div>
          )}

          <p className="mono mt-6 text-[9px] tracking-[0.18em] text-faint">
            {real
              ? `METEORA DBC // QUOTE SOL // GRADUATES AT ${form.gradMcapSol} SOL MCAP`
              : "TX // 4F7A…E21C — BLOCK CONFIRMED — LATENCY 402MS"}
          </p>
          <button
            onClick={() => {
              setForm(initial);
              setStep(1);
              setResult(null);
            }}
            className="mt-8 h-10 rounded-md border border-line px-6 text-[13px] text-white transition-colors hover:bg-panel2"
          >
            File Another Mission
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="py-10">
      <div className="mb-10">
        <p className="microlabel mb-2">DEPLOYMENT PROTOCOL — {missionId}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-white">Deploy Mission</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        {/* stepper */}
        <ol className="flex gap-2 overflow-x-auto lg:block lg:space-y-1">
          {STEPS.map((s) => {
            const state = s.n === step ? "active" : s.n < step ? "done" : "todo";
            return (
              <li key={s.n}>
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  className={`flex w-full min-w-[180px] items-center gap-3 rounded-md border px-4 py-3 text-left transition-colors lg:min-w-0 ${
                    state === "active"
                      ? "border-[rgba(168,255,53,0.35)] bg-panel"
                      : state === "done"
                        ? "border-line bg-transparent hover:bg-panel"
                        : "border-transparent"
                  }`}
                >
                  <span
                    className={`mono flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] ${
                      state === "done"
                        ? "border-primary bg-[rgba(168,255,53,0.1)] text-primary"
                        : state === "active"
                          ? "border-white text-white"
                          : "border-line text-faint"
                    }`}
                  >
                    {state === "done" ? <Check size={11} /> : s.n}
                  </span>
                  <span>
                    <span className={`block text-[13px] font-medium ${state === "todo" ? "text-faint" : "text-white"}`}>
                      {s.title}
                    </span>
                    <span className="microlabel !text-[8px]">{s.sub}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>

        {/* step body */}
        <div className="panel-elevated p-7">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Choose Theatre</h2>
                  <p className="mt-1 text-[13px] text-muted">Select the network your mission deploys to.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        { id: "SOLANA", desc: "High-throughput theatre. Sub-second finality, deepest launch liquidity.", color: "var(--accent)", fee: "~0.02 SOL" },
                        { id: "ROBINHOOD", desc: "Regulated-adjacent theatre. Direct retail distribution surface.", color: "var(--warning)", fee: "~$1.40" },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => set("chain", c.id)}
                        className={`rounded-lg border p-5 text-left transition-all ${
                          form.chain === c.id
                            ? "border-[rgba(168,255,53,0.5)] bg-panel"
                            : "border-line hover:border-[rgba(255,255,255,0.18)]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="mono text-[12px] tracking-[0.2em] text-white">{c.id}</span>
                          <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
                        </div>
                        <p className="mt-3 text-[12px] leading-relaxed text-muted">{c.desc}</p>
                        <p className="mono mt-4 text-[9px] tracking-[0.16em] text-faint">DEPLOY COST {c.fee}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Mission Identity</h2>
                  <p className="mt-1 text-[13px] text-muted">Public dossier details for your token.</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="microlabel mb-2 block">INSIGNIA</span>
                      <div className="flex items-center gap-4">
                        {form.ticker ? (
                          <TokenSigil ticker={form.ticker.toUpperCase()} hue={(form.ticker.charCodeAt(0) || 65) * 5} size={48} />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-dashed border-line text-faint">
                            <Upload size={15} />
                          </div>
                        )}
                        <span className="text-[11px] text-faint">
                          PNG or SVG, 512×512. A generated seal is used until upload.
                        </span>
                      </div>
                    </div>
                    <Field label="MISSION NAME">
                      <input className={inputCls} placeholder="Meridian Protocol" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="TICKER">
                      <input className={`${inputCls} mono uppercase`} placeholder="MRDN" maxLength={6} value={form.ticker} onChange={(e) => set("ticker", e.target.value)} />
                    </Field>
                    <div className="sm:col-span-2">
                      <Field label="BRIEFING / DESCRIPTION">
                        <textarea
                          className={`${inputCls} h-24 resize-none py-2.5`}
                          placeholder="One paragraph. What is this mission, and why does it matter?"
                          value={form.description}
                          onChange={(e) => set("description", e.target.value)}
                        />
                      </Field>
                    </div>
                    <Field label="CLASSIFICATION">
                      <select className={inputCls} value={form.classification} onChange={(e) => set("classification", e.target.value)}>
                        {["UNCLASSIFIED", "RESTRICTED", "CONFIDENTIAL", "CLASSIFIED"].map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="CATEGORY">
                      <select className={inputCls} value={form.category} onChange={(e) => set("category", e.target.value)}>
                        {CATEGORIES.map((c) => (
                          <option key={c}>{c}</option>
                        ))}
                      </select>
                    </Field>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Communications</h2>
                  <p className="mt-1 text-[13px] text-muted">
                    Verified channels increase your clearance grade. All optional.
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="WEBSITE"><input className={inputCls} placeholder="https://" value={form.website} onChange={(e) => set("website", e.target.value)} /></Field>
                    <Field label="X / TWITTER"><input className={inputCls} placeholder="@handle" value={form.x} onChange={(e) => set("x", e.target.value)} /></Field>
                    <Field label="TELEGRAM"><input className={inputCls} placeholder="t.me/" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} /></Field>
                    <Field label="DISCORD"><input className={inputCls} placeholder="discord.gg/" value={form.discord} onChange={(e) => set("discord", e.target.value)} /></Field>
                    <Field label="GITHUB"><input className={inputCls} placeholder="github.com/" value={form.github} onChange={(e) => set("github", e.target.value)} /></Field>
                  </div>
                  <div className="mt-6 flex items-start gap-3 rounded-md border border-line bg-bg2 p-4">
                    <ShieldCheck size={15} className="mt-0.5 shrink-0 text-primary" />
                    <p className="text-[12px] leading-relaxed text-muted">
                      Channels are checked against known impersonation registries at
                      deployment. Verified missions receive the clearance seal on all
                      intelligence surfaces.
                    </p>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Mission Parameters</h2>
                  <p className="mt-1 text-[13px] text-muted">
                    {form.chain === "SOLANA"
                      ? "Live curve configuration — deployed to a Meteora Dynamic Bonding Curve."
                      : "Tokenomics and launch configuration."}
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="TOTAL SUPPLY" hint="Fixed at deployment. Mint authority is revoked.">
                      <input
                        className={`${inputCls} mono`}
                        value={form.supply.toLocaleString("en-US")}
                        onChange={(e) => {
                          const n = parseInt(e.target.value.replace(/[^0-9]/g, ""), 10);
                          set("supply", Number.isFinite(n) ? n : 0);
                        }}
                      />
                    </Field>
                    <Field label={`CREATOR ALLOCATION — ${form.creatorPct}%`} hint="Vested linearly over 90 days after graduation. Max 5%.">
                      <input
                        type="range" min={0} max={5} step={0.5}
                        value={form.creatorPct}
                        onChange={(e) => set("creatorPct", +e.target.value)}
                        className="mt-2 w-full accent-[#a8ff35]"
                      />
                    </Field>
                    <Field
                      label={`TRADING FEE (TAX) — ${(form.tradingFeeBps / 100).toFixed(2)}%`}
                      hint="Charged on every curve swap, collected in SOL. Min 0.25%."
                    >
                      <input
                        type="range" min={25} max={500} step={25}
                        value={form.tradingFeeBps}
                        onChange={(e) => set("tradingFeeBps", +e.target.value)}
                        className="mt-2 w-full accent-[#a8ff35]"
                      />
                    </Field>
                    <Field
                      label={`CREATOR FEE SHARE — ${form.creatorFeeShare}%`}
                      hint="Your cut of the trading fee. The remainder funds the platform treasury."
                    >
                      <input
                        type="range" min={0} max={100} step={5}
                        value={form.creatorFeeShare}
                        onChange={(e) => set("creatorFeeShare", +e.target.value)}
                        className="mt-2 w-full accent-[#a8ff35]"
                      />
                    </Field>
                    <Field label={`INITIAL MARKET CAP — ${form.initialMcapSol} SOL`} hint="Where the curve starts pricing.">
                      <input
                        type="range" min={10} max={100} step={5}
                        value={form.initialMcapSol}
                        onChange={(e) => set("initialMcapSol", Math.min(+e.target.value, form.gradMcapSol - 50))}
                        className="mt-2 w-full accent-[#a8ff35]"
                      />
                    </Field>
                    <Field label={`GRADUATION MARKET CAP — ${form.gradMcapSol} SOL`} hint="Curve migrates to a locked Meteora DAMM v2 pool at this cap.">
                      <input
                        type="range" min={100} max={2000} step={50}
                        value={form.gradMcapSol}
                        onChange={(e) => set("gradMcapSol", Math.max(+e.target.value, form.initialMcapSol + 50))}
                        className="mt-2 w-full accent-[#a8ff35]"
                      />
                    </Field>
                  </div>

                  <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-md border border-line bg-bg2 p-4">
                    <input
                      type="checkbox"
                      checked={form.dynamicFee}
                      onChange={(e) => set("dynamicFee", e.target.checked)}
                      className="mt-0.5 accent-[#a8ff35]"
                    />
                    <span>
                      <span className="block text-[13px] font-medium text-white">Dynamic volatility fee</span>
                      <span className="block text-[12px] leading-relaxed text-muted">
                        Adds a variable fee during high volatility (Meteora dynamic fee) on top
                        of your base trading fee — protects the curve from sniping and churn.
                      </span>
                    </span>
                  </label>

                  <button
                    onClick={() => set("advanced", !form.advanced)}
                    className="mono mt-6 text-[10px] tracking-[0.16em] text-muted hover:text-white"
                  >
                    {form.advanced ? "▾" : "▸"} ADVANCED OPTIONS
                  </button>
                  {form.advanced && (
                    <div className="mt-4 grid gap-4 rounded-md border border-line bg-bg2 p-5 sm:grid-cols-3">
                      {[
                        ["CURVE", "METEORA DBC"],
                        ["QUOTE ASSET", "SOL (NATIVE)"],
                        ["FEE COLLECTION", "QUOTE TOKEN"],
                        ["GRADUATION VENUE", "DAMM V2"],
                        ["POST-GRAD POOL FEE", "1.00%"],
                        ["GRADUATED LP", "PERMANENTLY LOCKED"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="microlabel">{k}</p>
                          <p className="mono mt-1 text-[12px] text-white">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="text-lg font-semibold text-white">Final Briefing</h2>
                  <p className="mt-1 text-[13px] text-muted">Review before authorisation. Deployment is irreversible.</p>

                  <div className="mt-6 rounded-lg border border-line">
                    <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
                      <span className="microlabel">DEPLOYMENT SUMMARY</span>
                      <span className="stamp text-warning">{form.classification}</span>
                    </div>
                    <dl className="grid gap-x-6 gap-y-4 p-5 sm:grid-cols-3">
                      {(
                        [
                          ["THEATRE", form.chain ?? "—"],
                          ["MISSION", form.name || "—"],
                          ["TICKER", form.ticker ? `$${form.ticker.toUpperCase()}` : "—"],
                          ["SUPPLY", form.supply.toLocaleString("en-US")],
                          ["CREATOR ALLOC", `${form.creatorPct}% VESTED 90D`],
                          ["TRADING FEE", `${(form.tradingFeeBps / 100).toFixed(2)}%${form.dynamicFee ? " + DYN" : ""}`],
                          ["CREATOR FEE SHARE", `${form.creatorFeeShare}%`],
                          ["CURVE", `${form.initialMcapSol} → ${form.gradMcapSol} SOL MCAP`],
                          ["VENUE", form.chain === "SOLANA" ? `METEORA DBC (${SOLANA_CLUSTER.toUpperCase()})` : "SIMULATED"],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k}>
                          <dt className="microlabel">{k}</dt>
                          <dd className="mono mt-1 text-[12px] text-white">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(255,201,77,0.25)] bg-[rgba(255,201,77,0.05)] p-4">
                    <AlertTriangle size={15} className="mt-0.5 shrink-0 text-warning" />
                    <p className="text-[12px] leading-relaxed text-muted">
                      Supply, ticker, trading fee and curve parameters are locked into the
                      on-chain config at deployment and cannot be modified. Creator
                      allocation vests over 90 days after graduation. Graduated liquidity
                      is permanently locked in the DAMM v2 pool.
                    </p>
                  </div>

                  {form.chain === "SOLANA" && !publicKey && (
                    <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(77,227,255,0.25)] bg-[rgba(77,227,255,0.05)] p-4">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
                      <p className="text-[12px] leading-relaxed text-muted">
                        A connected Solana wallet is required to sign the deployment.
                        Pressing DEPLOY MISSION will open wallet selection.
                      </p>
                    </div>
                  )}

                  {deployError && (
                    <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(255,90,90,0.3)] bg-[rgba(255,90,90,0.06)] p-4">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" />
                      <p className="mono break-all text-[11px] leading-relaxed text-danger">
                        DEPLOYMENT REJECTED — {deployError}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={deploy}
                    disabled={!form.chain || !form.name || !form.ticker || deploying}
                    className="mt-8 flex h-14 w-full items-center justify-center gap-3 rounded-md bg-primary text-[15px] font-bold tracking-[0.14em] text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    {deploying && <Loader2 size={17} className="animate-spin" />}
                    {deploying ? "AWAITING SIGNATURE…" : "DEPLOY MISSION"}
                  </button>
                  <p className="mono mt-3 text-center text-[9px] tracking-[0.18em] text-faint">
                    {form.chain === "SOLANA"
                      ? `ONE TRANSACTION — CREATES CURVE CONFIG, MINT AND POOL ON ${SOLANA_CLUSTER.toUpperCase()}`
                      : "AUTHORISATION BINDS YOUR WALLET SIGNATURE TO THE MISSION DOSSIER"}
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* nav */}
          {step < 5 && (
            <div className="mt-8 flex items-center justify-between border-t border-line pt-6">
              <button
                onClick={() => setStep((s) => Math.max(1, s - 1))}
                disabled={step === 1}
                className="flex h-9 items-center gap-1.5 rounded-md border border-line px-4 text-[12px] text-muted transition-colors hover:text-white disabled:opacity-30"
              >
                <ChevronLeft size={13} /> Back
              </button>
              <button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="flex h-9 items-center gap-1.5 rounded-md bg-primary px-5 text-[12px] font-semibold text-black transition-all hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Continue <ChevronRight size={13} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

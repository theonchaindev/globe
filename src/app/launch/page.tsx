"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check, ChevronLeft, ChevronRight, ShieldCheck, AlertTriangle, Upload,
  ExternalLink, Loader2, ArrowRight, ArrowUpRight,
} from "lucide-react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import Insignia from "@/components/Insignia";
import PageHeader from "@/components/PageHeader";
import { fileToInsignia } from "@/lib/image";
import { launchOnPumpfun, pumpfunUrl, type PumpLaunchResult } from "@/lib/pumpfun/launch";
import { buildMetadataUri } from "@/lib/meteora/deploy";
import { SOLANA_CLUSTER, explorerTx, explorerAddress } from "@/lib/meteora/config";
import { recordLaunch } from "@/lib/launches";

const PONS_URL = "https://pons.family";

interface Outcome {
  mode: "SOLANA" | "ROBINHOOD" | "DUAL";
  sol?: PumpLaunchResult;
  solError?: string;
  ponsHandoff?: boolean;
}

const STEPS = [
  { n: 1, title: "Network", sub: "Theatre" },
  { n: 2, title: "Token details", sub: "Mission identity" },
  { n: 3, title: "Socials", sub: "Communications" },
  { n: 4, title: "Launch settings", sub: "Parameters" },
  { n: 5, title: "Review & launch", sub: "Final briefing" },
];

const CATEGORIES = ["Infrastructure", "Finance", "AI", "DePIN", "RWA", "Privacy", "Gaming", "Social", "Energy", "Other"];

interface Form {
  chain: "SOLANA" | "ROBINHOOD" | "DUAL" | null;
  name: string;
  image: string | null;
  ticker: string;
  description: string;
  classification: string;
  category: string;
  website: string;
  x: string;
  telegram: string;
  discord: string;
  github: string;
  devBuySol: number; // optional first buy on the pump.fun curve
  advanced: boolean;
}

const initial: Form = {
  chain: null,
  name: "",
  image: null,
  ticker: "",
  description: "",
  classification: "UNCLASSIFIED",
  category: "Infrastructure",
  website: "",
  x: "",
  telegram: "",
  discord: "",
  github: "",
  devBuySol: 0,
  advanced: false,
};

const inputCls =
  "h-11 w-full rounded-lg border border-line bg-bg2 px-3.5 text-[14px] text-white placeholder:text-faint focus:border-line-strong focus:bg-panel focus:outline-none focus:ring-4 focus:ring-[rgba(232,224,208,0.05)] transition-all";

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
  const [imageError, setImageError] = useState<string | null>(null);
  const [deployStage, setDeployStage] = useState<string | null>(null);
  const [solSig, setSolSig] = useState<string | null>(null);
  const [solBalance, setSolBalance] = useState<number | null>(null);
  const [result, setResult] = useState<Outcome | null>(null);

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  useEffect(() => {
    if (!publicKey) {
      setSolBalance(null);
      return;
    }
    let cancelled = false;
    const read = () =>
      connection
        .getBalance(publicKey, "confirmed")
        .then((b) => !cancelled && setSolBalance(b / 1e9))
        .catch(() => !cancelled && setSolBalance(null));
    void read();
    const t = setInterval(read, 15_000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [publicKey, connection]);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm((f) => ({ ...f, [k]: v }));

  const canNext =
    step === 1 ? !!form.chain : step === 2 ? form.name.length > 1 && form.ticker.length > 1 : true;

  const missionId = `MISSION-0${(4900 + form.name.length * 13 + form.ticker.length * 7).toString().slice(0, 4)}`;

  const wantsSol = form.chain === "SOLANA" || form.chain === "DUAL";
  const wantsEvm = form.chain === "ROBINHOOD" || form.chain === "DUAL";
  const solNeeded = 0.03 + form.devBuySol;

  const deploy = async () => {
    setDeployError(null);
    setSolSig(null);
    if (!form.chain) return;

    if (wantsSol && !publicKey) {
      setVisible(true);
      return;
    }

    setDeploying(true);
    const out: Outcome = { mode: form.chain };

    if (wantsSol && publicKey) {
      try {
        const res = await launchOnPumpfun(
          connection,
          { publicKey, sendTransaction },
          {
            name: form.name,
            symbol: form.ticker.toUpperCase(),
            uri: buildMetadataUri(form.name, form.ticker.toUpperCase()),
            devBuySol: form.devBuySol,
          },
          (stage) => setDeployStage(stage),
          (sig) => setSolSig(sig),
        );
        recordLaunch({
          chain: "SOLANA",
          venue: "pumpfun",
          name: form.name,
          image: form.image ?? undefined,
          ticker: form.ticker.toUpperCase(),
          address: res.mint, // pump missions are addressed by mint
          mint: res.mint,
          config: res.bondingCurve,
          txSignature: res.signature,
          creator: publicKey.toBase58(),
          tradingFeeBps: 100, // pump.fun ~1% protocol fee on curve trades
          creatorFeeShare: 0,
          gradMcap: 0,
        });
        out.sol = res;
      } catch (e) {
        out.solError = e instanceof Error ? e.message : String(e);
      }
    }

    if (wantsEvm) {
      // Robinhood theatre launches through the Pons launcher itself.
      // Robinhood-only: open immediately while the click gesture is live.
      // Dual: the pump leg takes minutes, so a late window.open would be
      // popup-blocked — the result card's button handles it instead.
      out.ponsHandoff = true;
      if (!wantsSol) window.open(PONS_URL, "_blank", "noopener");
    }

    setDeploying(false);
    setDeployStage(null);

    if (wantsSol && !out.sol && !out.ponsHandoff) {
      setDeployError(out.solError ?? "Deployment failed");
      return;
    }
    if (wantsSol && !out.sol && out.ponsHandoff) {
      // dual with failed sol leg — still show result with the error visible
    }
    setResult(out);
  };

  /* ── success / handoff screen ─────────────────────────── */
  if (result) {
    const failures = result.mode !== "ROBINHOOD" && !result.sol ? 1 : 0;
    return (
      <div className="flex min-h-[70vh] items-center justify-center py-16">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="panel-elevated brackets w-full max-w-2xl p-6 text-center sm:p-10"
        >
          <div
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full border ${
              failures === 0
                ? "border-[rgba(232,224,208,0.4)] bg-[rgba(232,224,208,0.08)]"
                : "border-[rgba(201,168,124,0.4)] bg-[rgba(201,168,124,0.08)]"
            }`}
          >
            {failures === 0 ? (
              <motion.svg width="26" height="26" viewBox="0 0 24 24" fill="none" className="text-primary">
                <motion.path
                  d="M5 12.5l4.5 4.5L19 7.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  initial={{ pathLength: 0 }}
                  animate={{ pathLength: 1 }}
                  transition={{ duration: 0.7, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
                />
              </motion.svg>
            ) : (
              <AlertTriangle size={22} className="text-warning" />
            )}
          </div>
          <p className="microlabel mt-6">
            {result.mode === "DUAL" ? "DUAL DEPLOYMENT" : "DEPLOYMENT"}{" "}
            {failures === 0 ? "AUTHORISED" : "PARTIALLY COMPLETE"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-white">
            {result.sol ? `${missionId} is live` : result.ponsHandoff ? "Continue on Pons" : missionId}
          </h1>

          <div className={`mt-6 grid gap-4 text-left ${result.mode === "DUAL" ? "sm:grid-cols-2" : ""}`}>
            {result.mode !== "ROBINHOOD" && (
              <div
                className={`rounded-md border p-4 ${
                  result.sol ? "border-line bg-bg2" : "border-[rgba(168,75,66,0.3)] bg-[rgba(168,75,66,0.04)]"
                }`}
              >
                <p className="microlabel">SOLANA THEATRE</p>
                <p className={`mt-1 text-[11px] ${result.sol ? "text-muted" : "text-danger"}`}>
                  {result.sol ? `pump.fun bonding curve (${SOLANA_CLUSTER})` : "Deployment failed"}
                </p>
                {result.sol ? (
                  <>
                    <div className="mt-3 space-y-2">
                      {(
                        [
                          ["TRANSACTION", result.sol.signature, explorerTx(result.sol.signature)],
                          ["TOKEN MINT", result.sol.mint, explorerAddress(result.sol.mint)],
                          ["BONDING CURVE", result.sol.bondingCurve, explorerAddress(result.sol.bondingCurve)],
                          ["PUMP.FUN PAGE", `pump.fun/coin/${result.sol.mint.slice(0, 8)}…`, pumpfunUrl(result.sol.mint)],
                        ] as const
                      ).map(([k, v, href]) => (
                        <div key={k} className="flex items-center gap-2">
                          <span className="microlabel w-[100px] shrink-0 !text-[8px]">{k}</span>
                          <a
                            href={href}
                            target="_blank"
                            rel="noreferrer"
                            className="mono flex min-w-0 items-center gap-1.5 text-[10px] text-accent hover:underline"
                          >
                            <span className="truncate">{v}</span>
                            <ExternalLink size={10} className="shrink-0" />
                          </a>
                        </div>
                      ))}
                    </div>
                    <Link
                      href={`/live/${result.sol.mint}`}
                      className="btn btn-primary btn-sm mt-4 w-full"
                    >
                      Open Trading Desk <ArrowRight size={13} />
                    </Link>
                  </>
                ) : (
                  <p className="mono mt-3 break-words text-[10px] leading-relaxed text-danger">
                    {result.solError?.slice(0, 220)}
                  </p>
                )}
              </div>
            )}

            {result.ponsHandoff && (
              <div className="rounded-md border border-line bg-bg2 p-4">
                <p className="microlabel">ROBINHOOD THEATRE</p>
                <p className="mt-1 text-[11px] text-muted">Launches through the Pons launcher</p>
                <p className="mt-3 text-[12px] leading-relaxed text-muted">
                  Pons is the launchpad on Robinhood Chain. Open the launcher below and
                  recreate your briefing there ({form.name || "your mission"} · $
                  {form.ticker.toUpperCase() || "TICKER"}), launch, then paste the token
                  address into IMPORT MISSION on your dashboard to track it here.
                </p>
                <a
                  href={PONS_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 flex h-9 items-center justify-center gap-2 rounded-md border border-line text-[12px] font-medium text-white transition-colors hover:bg-panel2"
                >
                  Open Pons Launcher <ArrowUpRight size={13} />
                </a>
                <p className="mono mt-3 text-[8px] leading-relaxed tracking-[0.1em] text-faint">
                  NOTE: PONS DOES NOT OPERATE IN THE UK OR OFAC JURISDICTIONS
                </p>
              </div>
            )}
          </div>

          <button
            onClick={() => {
              setForm(initial);
              setStep(1);
              setResult(null);
            }}
            className="btn btn-ghost mt-8"
          >
            Launch another token
          </button>
        </motion.div>
      </div>
    );
  }

  /* ── flow ─────────────────────────────────────────────── */
  return (
    <div>
      <PageHeader
        code={`DEPLOYMENT PROTOCOL — ${missionId}`}
        title="Launch a token"
        description="Five short steps. Nothing touches the chain until you sign the last one."
      />

      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
        {/* stepper */}
        <ol className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1 sm:mx-0 sm:px-0 lg:block lg:space-y-1">
          {STEPS.map((s) => {
            const state = s.n === step ? "active" : s.n < step ? "done" : "todo";
            return (
              <li key={s.n}>
                <button
                  onClick={() => s.n < step && setStep(s.n)}
                  className={`relative flex w-full min-w-[170px] items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors lg:min-w-0 ${
                    state === "done" ? "border-transparent hover:bg-panel" : "border-transparent"
                  } ${state === "todo" ? "cursor-default" : ""}`}
                >
                  {state === "active" && (
                    <motion.span
                      layoutId="step-active"
                      className="absolute inset-0 rounded-lg border border-line-strong bg-panel"
                      transition={{ type: "spring", stiffness: 380, damping: 34 }}
                    />
                  )}
                  <span
                    className={`mono relative flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-[10px] transition-colors duration-500 ${
                      state === "done"
                        ? "border-primary bg-[rgba(232,224,208,0.1)] text-primary"
                        : state === "active"
                          ? "border-white text-white"
                          : "border-line text-faint"
                    }`}
                  >
                    {state === "done" ? <Check size={11} /> : s.n}
                  </span>
                  <span className="relative">
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

        {/* live preview of the token being briefed */}
        <div className="card brackets hidden p-4 lg:block">
          <p className="microlabel mb-3 flex items-center gap-2">
            <span className="pulse-dot h-1 w-1 rounded-full bg-primary" /> LIVE PREVIEW
          </p>
          <div className="flex items-center gap-3">
            <Insignia image={form.image} ticker={form.ticker.toUpperCase() || "??"} size={40} />
            <div className="min-w-0">
              <p className="truncate text-[14px] font-semibold text-white">{form.name || "Your token"}</p>
              <p className="mono text-[11px] text-muted">${form.ticker.toUpperCase() || "TICKER"}</p>
            </div>
          </div>
          <div className="mono mt-4 flex items-center justify-between border-t border-line pt-3 text-[9px] tracking-[0.14em] text-faint">
            <span>{form.chain ?? "NO THEATRE"}</span>
            <span>{wantsSol ? `DEV BUY ${form.devBuySol.toFixed(2)} SOL` : "—"}</span>
          </div>
        </div>
        </div>

        {/* step body */}
        <div
          className="panel-elevated relative min-w-0 overflow-hidden p-6 sm:p-8"
          onKeyDown={(e) => {
            if (e.key === "Enter" && step < 5 && canNext && (e.target as HTMLElement).tagName !== "TEXTAREA") {
              e.preventDefault();
              setStep((s) => s + 1);
            }
          }}
        >
          {/* progress */}
          <div className="absolute inset-x-0 top-0 h-px bg-line">
            <motion.div
              className="h-full origin-left bg-primary"
              animate={{ scaleX: step / STEPS.length }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </div>
          <p className="mono mb-5 text-[10px] tracking-[0.18em] text-faint">
            STEP {step} OF {STEPS.length}
          </p>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16, filter: "blur(4px)" }}
              animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, x: -16, filter: "blur(4px)" }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 1 && (
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-white">Where should it launch?</h2>
                  <p className="mt-1.5 text-[14px] text-muted">Pick a network — or both.</p>
                  <div className="mt-6 grid gap-4 sm:grid-cols-2">
                    {(
                      [
                        { id: "SOLANA", desc: "Launches on pump.fun — the official program, so your token appears on pump.fun itself and graduates to PumpSwap.", color: "var(--accent)", fee: "~0.03 SOL" },
                        { id: "ROBINHOOD", desc: "Launches through Pons, the Robinhood Chain launchpad — guided handoff to their launcher, tracked here after.", color: "var(--warning)", fee: "SET ON PONS" },
                      ] as const
                    ).map((c) => (
                      <button
                        key={c.id}
                        onClick={() => set("chain", c.id)}
                        className={`card card-hover p-5 text-left ${
                          form.chain === c.id ? "!border-[rgba(232,224,208,0.5)] !bg-panel2" : ""
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="mono text-[12px] tracking-[0.2em] text-white">{c.id}</span>
                          <Picked on={form.chain === c.id} color={c.color} />
                        </div>
                        <p className="mt-3 text-[12px] leading-relaxed text-muted">{c.desc}</p>
                        <p className="mono mt-4 text-[9px] tracking-[0.16em] text-faint">DEPLOY COST {c.fee}</p>
                      </button>
                    ))}
                    <button
                      onClick={() => set("chain", "DUAL")}
                      className={`card card-hover p-5 text-left sm:col-span-2 ${
                        form.chain === "DUAL" ? "!border-[rgba(232,224,208,0.5)] !bg-panel2" : ""
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="mono text-[12px] tracking-[0.2em] text-white">DUAL DEPLOYMENT</span>
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-accent" />
                          <svg width="26" height="8"><line x1="0" y1="4" x2="26" y2="4" stroke="var(--primary)" strokeWidth="1" className="dash-flow" /></svg>
                          <span className="h-2 w-2 rounded-full bg-warning" />
                          <Picked on={form.chain === "DUAL"} color="var(--primary)" />
                        </span>
                      </div>
                      <p className="mt-3 text-[12px] leading-relaxed text-muted">
                        One briefing, both theatres. Launches on pump.fun via your
                        connected wallet, then hands you to the Pons launcher with the
                        same identity for the Robinhood side.
                      </p>
                      <p className="mono mt-4 text-[9px] tracking-[0.16em] text-faint">
                        ~0.03 SOL + PONS LAUNCH COST
                      </p>
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-white">Name your token</h2>
                  <p className="mt-1.5 text-[14px] text-muted">Name and ticker are required; everything else is optional.</p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <span className="microlabel mb-2 block">INSIGNIA</span>
                      <div className="flex items-center gap-4">
                        <label className="group relative block cursor-pointer">
                          <Insignia image={form.image} ticker={form.ticker.toUpperCase() || "??"} size={56} />
                          <span className="absolute inset-0 flex items-center justify-center rounded-[9px] bg-[rgba(7,6,5,0.72)] opacity-0 transition-opacity group-hover:opacity-100">
                            <Upload size={15} className="text-white" />
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={async (e) => {
                              const f = e.target.files?.[0];
                              if (!f) return;
                              try {
                                set("image", await fileToInsignia(f));
                                setImageError(null);
                              } catch (err) {
                                setImageError(err instanceof Error ? err.message : String(err));
                              }
                              e.target.value = "";
                            }}
                          />
                        </label>
                        <div>
                          <span className="block text-[11px] text-faint">
                            Click to upload — cropped square, downscaled to 256×256.
                            Generated seal used until then.
                          </span>
                          {form.image && (
                            <button
                              type="button"
                              onClick={() => set("image", null)}
                              className="mono mt-1.5 text-[9px] tracking-[0.14em] text-danger hover:underline"
                            >
                              REMOVE IMAGE
                            </button>
                          )}
                          {imageError && (
                            <span className="mono mt-1.5 block text-[9px] tracking-[0.1em] text-danger">{imageError}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Field label="MISSION NAME">
                      <input className={inputCls} placeholder="Meridian Protocol" value={form.name} onChange={(e) => set("name", e.target.value)} />
                    </Field>
                    <Field label="TICKER">
                      <input className={`${inputCls} mono uppercase`} placeholder="MRDN" maxLength={10} value={form.ticker} onChange={(e) => set("ticker", e.target.value)} />
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
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-white">Add socials</h2>
                  <p className="mt-1.5 text-[14px] text-muted">
                    All optional — skip ahead if you don&apos;t have them yet.
                  </p>
                  <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    <Field label="WEBSITE"><input className={inputCls} placeholder="https://" value={form.website} onChange={(e) => set("website", e.target.value)} /></Field>
                    <Field label="X / TWITTER"><input className={inputCls} placeholder="@handle" value={form.x} onChange={(e) => set("x", e.target.value)} /></Field>
                    <Field label="TELEGRAM"><input className={inputCls} placeholder="t.me/" value={form.telegram} onChange={(e) => set("telegram", e.target.value)} /></Field>
                    <Field label="DISCORD"><input className={inputCls} placeholder="discord.gg/" value={form.discord} onChange={(e) => set("discord", e.target.value)} /></Field>
                    <Field label="GITHUB"><input className={inputCls} placeholder="github.com/" value={form.github} onChange={(e) => set("github", e.target.value)} /></Field>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-white">Launch settings</h2>
                  <p className="mt-1.5 text-[14px] text-muted">
                    {wantsSol
                      ? "pump.fun runs a fixed curve — 1B supply, standard graduation. Your only launch decision is the dev buy."
                      : "Pons launch parameters are set on the Pons launcher itself."}
                  </p>

                  {wantsSol && (
                    <div className="mt-6 max-w-md">
                      <Field
                        label={`DEV BUY — ${form.devBuySol.toFixed(2)} SOL`}
                        hint="Optional first purchase in the same transaction as the launch. 0 skips it."
                      >
                        <input
                          type="range" min={0} max={1} step={0.05}
                          value={form.devBuySol}
                          onChange={(e) => set("devBuySol", +e.target.value)}
                          className="mt-2 w-full accent-[#e8e0d0]"
                        />
                      </Field>
                    </div>
                  )}

                  {wantsSol && (
                    <div className="mt-6 grid gap-4 rounded-md border border-line bg-bg2 p-5 sm:grid-cols-3">
                      {[
                        ["VENUE", "PUMP.FUN PROGRAM"],
                        ["SUPPLY", "1,000,000,000 (FIXED)"],
                        ["CURVE", "PUMP BONDING CURVE"],
                        ["GRADUATION", "AUTO → PUMPSWAP"],
                        ["CREATOR FEES", "PUMP CREATOR VAULT"],
                        ["MINT AUTHORITY", "REVOKED BY PROGRAM"],
                      ].map(([k, v]) => (
                        <div key={k}>
                          <p className="microlabel">{k}</p>
                          <p className="mono mt-1 text-[12px] text-white">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {wantsEvm && (
                    <div className="mt-6 flex items-start gap-3 rounded-md border border-line bg-bg2 p-4">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
                      <p className="text-[12px] leading-relaxed text-muted">
                        The Robinhood theatre launches through{" "}
                        <span className="text-white">Pons</span> — supply, pricing and
                        graduation are configured on the Pons launcher when you complete
                        the launch there. GLOBAL hands you across with your mission
                        identity and tracks the token once you import its address.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {step === 5 && (
                <div>
                  <h2 className="text-[22px] font-semibold tracking-[-0.01em] text-white">Review & launch</h2>
                  <p className="mt-1.5 text-[14px] text-muted">Check the details — launching is irreversible.</p>

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
                          ["SOLANA VENUE", wantsSol ? `PUMP.FUN (${SOLANA_CLUSTER.toUpperCase()})` : "—"],
                          ["ROBINHOOD VENUE", wantsEvm ? "PONS LAUNCHER" : "—"],
                          ["DEV BUY", wantsSol ? `${form.devBuySol.toFixed(2)} SOL` : "—"],
                          ["CATEGORY", form.category],
                          ["EST. COST", wantsSol ? `~${solNeeded.toFixed(2)} SOL${wantsEvm ? " + PONS" : ""}` : "SET ON PONS"],
                        ] as const
                      ).map(([k, v]) => (
                        <div key={k}>
                          <dt className="microlabel">{k}</dt>
                          <dd className="mono mt-1 text-[12px] text-white">{v}</dd>
                        </div>
                      ))}
                    </dl>
                  </div>

                  {wantsSol && !publicKey && (
                    <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(179,166,140,0.25)] bg-[rgba(179,166,140,0.05)] p-4">
                      <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
                      <p className="text-[12px] leading-relaxed text-muted">
                        A connected Solana wallet is required. Pressing DEPLOY MISSION
                        will open wallet selection.
                      </p>
                    </div>
                  )}

                  {wantsSol && publicKey && (
                    <div className="mt-4 rounded-md border border-line bg-bg2 p-4">
                      <p className="microlabel mb-3">SIGNING WALLET — SOLANA {SOLANA_CLUSTER.toUpperCase()}</p>
                      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                        <span className="mono text-[11px] text-accent">{publicKey.toBase58()}</span>
                        <span className="mono tnum text-[11px] text-white">
                          {solBalance === null ? "reading balance…" : `${solBalance.toFixed(4)} SOL`}
                        </span>
                      </div>
                      {solBalance !== null && solBalance < solNeeded && (
                        <p className="mt-2.5 text-[11px] leading-relaxed text-warning">
                          This address holds {solBalance.toFixed(4)} SOL on {SOLANA_CLUSTER.toUpperCase()} —
                          launch needs ~{solNeeded.toFixed(2)}. If your wallet shows more, it&apos;s on a
                          different network or account. Airdrop to the address above at faucet.solana.com.
                        </p>
                      )}
                    </div>
                  )}

                  {wantsEvm && (
                    <div className="mt-4 flex items-start gap-3 rounded-md border border-line bg-bg2 p-4">
                      <ArrowUpRight size={15} className="mt-0.5 shrink-0 text-warning" />
                      <p className="text-[12px] leading-relaxed text-muted">
                        The Robinhood leg opens the Pons launcher in a new tab — complete
                        the launch there, then import the token address on your dashboard.
                        Pons does not operate in the UK or OFAC jurisdictions.
                      </p>
                    </div>
                  )}

                  {deployError && (
                    <div className="mt-4 flex items-start gap-3 rounded-md border border-[rgba(168,75,66,0.3)] bg-[rgba(168,75,66,0.06)] p-4">
                      <AlertTriangle size={15} className="mt-0.5 shrink-0 text-danger" />
                      <p className="mono break-all text-[11px] leading-relaxed text-danger">
                        DEPLOYMENT REJECTED — {deployError}
                      </p>
                    </div>
                  )}

                  <button
                    onClick={deploy}
                    disabled={!form.chain || !form.name || !form.ticker || deploying}
                    className="btn btn-primary mt-8 !h-14 w-full !text-[15px] !font-bold tracking-[0.14em]"
                  >
                    {deploying && <Loader2 size={17} className="animate-spin" />}
                    {deploying ? (deployStage ?? "DEPLOYING…").toUpperCase() : "DEPLOY MISSION"}
                  </button>
                  {solSig && (
                    <a
                      href={explorerTx(solSig)}
                      target="_blank"
                      rel="noreferrer"
                      className="mono mt-3 flex items-center justify-center gap-1.5 text-[10px] tracking-[0.14em] text-accent hover:underline"
                    >
                      TX SUBMITTED — TRACK ON SOLSCAN <ExternalLink size={10} />
                    </a>
                  )}
                  <p className="mono mt-3 text-center text-[9px] tracking-[0.18em] text-faint">
                    {form.chain === "DUAL"
                      ? `PUMP.FUN LAUNCH ON ${SOLANA_CLUSTER.toUpperCase()}, THEN HANDOFF TO PONS`
                      : wantsSol
                        ? `ONE TRANSACTION — CREATES MINT + CURVE ON PUMP.FUN (${SOLANA_CLUSTER.toUpperCase()})`
                        : "OPENS THE PONS LAUNCHER — LAUNCH COMPLETES THERE"}
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
                className="btn btn-ghost btn-sm"
              >
                <ChevronLeft size={13} /> Back
              </button>
              <span className="mono hidden text-[10px] tracking-[0.12em] text-faint sm:inline">
                {canNext ? <>PRESS <kbd>ENTER</kbd> TO CONTINUE</> : step === 1 ? "CHOOSE A NETWORK" : "NAME AND TICKER REQUIRED"}
              </span>
              <button
                onClick={() => canNext && setStep((s) => s + 1)}
                disabled={!canNext}
                className="btn btn-primary btn-sm"
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

/** Selection indicator: a ring that fills with a check when picked. */
function Picked({ on, color }: { on: boolean; color: string }) {
  return (
    <span
      className="flex h-5 w-5 items-center justify-center rounded-full border transition-colors duration-300"
      style={{ borderColor: on ? color : "var(--border)", background: on ? color : "transparent" }}
    >
      <AnimatePresence>
        {on && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 28 }}
          >
            <Check size={11} className="text-black" strokeWidth={3} />
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

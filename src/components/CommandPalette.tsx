"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, BarChart3, BookOpen, Compass, CornerDownLeft, Rocket, Search, Trophy, UserRound } from "lucide-react";
import { fetchAllLaunches, type LaunchRecord } from "@/lib/launches";
import { EASE } from "./motion";

const PAGES = [
  { href: "/launch", label: "Launch a token", hint: "Deploy Mission", icon: Rocket },
  { href: "/explore", label: "Explore tokens", hint: "Mission database", icon: Compass },
  { href: "/leaderboard", label: "Leaderboard", hint: "Top missions", icon: Trophy },
  { href: "/command", label: "Analytics", hint: "Command Centre", icon: BarChart3 },
  { href: "/profile", label: "Profile & creator fees", hint: "Your dossier", icon: UserRound },
  { href: "/docs", label: "Documentation", hint: "How GLOBAL works", icon: BookOpen },
];

type Item =
  | { kind: "page"; href: string; label: string; hint: string; icon: typeof Rocket }
  | { kind: "launch"; href: string; rec: LaunchRecord };

/** ⌘K / Ctrl-K / "/" — jump to any page or token from anywhere. */
export default function CommandPalette({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [launches, setLaunches] = useState<LaunchRecord[]>([]);
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQ("");
    setSel(0);
    void fetchAllLaunches().then(setLaunches);
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const term = q.trim().toLowerCase();
    const pages: Item[] = PAGES.filter(
      (p) => !term || p.label.toLowerCase().includes(term) || p.hint.toLowerCase().includes(term),
    ).map((p) => ({ kind: "page", ...p }));
    const tokens: Item[] = launches
      .filter(
        (l) =>
          !term ||
          l.name.toLowerCase().includes(term) ||
          l.ticker.toLowerCase().includes(term) ||
          l.address.toLowerCase().includes(term),
      )
      .slice(0, 6)
      .map((rec) => ({ kind: "launch", href: `/live/${rec.address}`, rec }));
    return [...tokens, ...pages];
  }, [q, launches]);

  const go = useCallback(
    (item: Item | undefined) => {
      if (!item) return;
      onClose();
      router.push(item.href);
    },
    [onClose, router],
  );

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSel((s) => Math.min(items.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSel((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      go(items[sel]);
    } else if (e.key === "Escape") {
      onClose();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-start justify-center px-4 pt-[14vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <div className="absolute inset-0 bg-[rgba(8,8,8,0.8)] backdrop-blur-sm" onClick={onClose} />
          <motion.div
            role="dialog"
            aria-label="Search"
            className="panel-elevated brackets relative w-full max-w-xl overflow-hidden shadow-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.35, ease: EASE }}
          >
            <div className="flex items-center gap-3 border-b border-line px-4">
              <Search size={15} className="text-faint" />
              <input
                ref={inputRef}
                value={q}
                onChange={(e) => {
                  setQ(e.target.value);
                  setSel(0);
                }}
                onKeyDown={onKey}
                placeholder="Search tokens, tickers, addresses or pages…"
                className="h-14 flex-1 bg-transparent text-[14px] text-white placeholder:text-faint focus:outline-none"
              />
              <kbd>ESC</kbd>
            </div>
            <ul className="max-h-[50vh] overflow-y-auto p-2">
              {items.length === 0 && (
                <li className="px-3 py-8 text-center text-[13px] text-muted">No matches for “{q}”.</li>
              )}
              {items.map((item, i) => {
                const active = i === sel;
                const first = i === 0 || items[i - 1].kind !== item.kind;
                return (
                  <li key={item.href}>
                    {first && (
                      <p className="microlabel px-3 pb-1.5 pt-3">
                        {item.kind === "launch" ? "Tokens" : "Pages"}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setSel(i)}
                      onClick={() => go(item)}
                      className={`relative flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                        active ? "text-white" : "text-muted"
                      }`}
                    >
                      {active && (
                        <motion.span
                          layoutId="palette-sel"
                          className="absolute inset-0 bg-[rgba(227,20,27,0.14)]"
                          transition={{ duration: 0.25, ease: EASE }}
                        />
                      )}
                      {item.kind === "page" ? (
                        <>
                          <item.icon size={15} className="relative" />
                          <span className="relative text-[13px]">{item.label}</span>
                          <span className="mono relative ml-auto text-[10px] tracking-[0.12em] text-faint">
                            {item.hint.toUpperCase()}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="mono relative flex h-6 w-6 items-center justify-center border border-line text-[9px]">
                            {item.rec.ticker.slice(0, 2)}
                          </span>
                          <span className="relative text-[13px]">{item.rec.name}</span>
                          <span className="mono relative text-[11px] text-faint">${item.rec.ticker}</span>
                          <span className="mono relative ml-auto text-[10px] tracking-[0.12em] text-faint">
                            {item.rec.chain}
                          </span>
                        </>
                      )}
                      {active && <ArrowRight size={13} className="relative" />}
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="mono flex items-center gap-4 border-t border-line px-4 py-2.5 text-[10px] tracking-[0.1em] text-faint">
              <span className="flex items-center gap-1.5"><kbd>↑</kbd><kbd>↓</kbd> NAVIGATE</span>
              <span className="flex items-center gap-1.5"><kbd><CornerDownLeft size={9} className="inline" /></kbd> OPEN</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

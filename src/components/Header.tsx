"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { ArrowRight, Search, UserRound } from "lucide-react";
import Logo from "./Logo";
import ConnectWallet from "./ConnectWallet";
import CommandPalette from "./CommandPalette";
import { CUT, EASE } from "./motion";

const NAV = [
  { href: "/explore", label: "Explore" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/command", label: "Analytics" },
  { href: "/docs", label: "Docs" },
];

const MENU = [
  { href: "/launch", label: "Launch", hint: "Deploy a token" },
  ...NAV.map((n) => ({ ...n, hint: "" })),
  { href: "/profile", label: "Profile", hint: "Wallets & creator fees" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [clock, setClock] = useState("--:--:--");
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    const tick = () => setClock(new Date().toISOString().slice(11, 19));
    tick();
    const t = setInterval(tick, 1000);
    return () => {
      window.removeEventListener("scroll", onScroll);
      clearInterval(t);
    };
  }, []);

  useEffect(() => setOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  // ⌘K / Ctrl-K / "/" opens search from anywhere
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const typing = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !typing)) {
        e.preventDefault();
        setPalette((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-[background,border-color,backdrop-filter] duration-500 ${
          scrolled && !open
            ? "border-b border-line bg-[rgba(8,8,8,0.82)] backdrop-blur-xl"
            : "border-b border-transparent"
        }`}
      >
        <div className="wrap flex h-16 items-center gap-8">
          <Link href="/" className="group flex items-center gap-3 text-white" aria-label="GLOBAL home">
            <span className="shrink-0 transition-transform duration-1000 group-hover:rotate-[360deg]">
              <Logo size={20} />
            </span>
            <span className="display-md text-[22px] tracking-[0.22em]">GLOBAL</span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`mono relative py-1 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                    active ? "text-white" : "text-muted hover:text-white"
                  } link-wipe`}
                >
                  {item.label}
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute -bottom-[2px] left-0 h-px w-full bg-red"
                      transition={{ duration: 0.5, ease: CUT }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2">
            <span className="mono hidden items-center gap-2 pr-3 text-[10px] tracking-[0.16em] text-faint xl:flex">
              <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-red" />
              <span className="tnum">{clock} Z</span>
            </span>
            <button
              onClick={() => setPalette(true)}
              className="mono hidden h-9 items-center gap-3 border border-line px-3 text-[10px] uppercase tracking-[0.16em] text-faint transition-colors hover:border-line-strong hover:text-white md:flex"
              aria-label="Search (⌘K)"
            >
              <Search size={12} /> Search <kbd>⌘K</kbd>
            </button>
            <button
              onClick={() => setPalette(true)}
              className="flex h-9 w-9 items-center justify-center border border-line text-muted md:hidden"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
            <Link
              href="/profile"
              className={`hidden h-9 w-9 items-center justify-center border transition-colors sm:flex ${
                pathname === "/profile" ? "border-red text-white" : "border-line text-muted hover:border-line-strong hover:text-white"
              }`}
              aria-label="Profile"
              title="Profile & creator fees"
            >
              <UserRound size={14} />
            </Link>
            <ConnectWallet />
            <Link href="/launch" className="btn btn-primary btn-sm hidden !h-9 lg:inline-flex">
              Launch <ArrowRight size={13} />
            </Link>
            <button
              className="flex h-9 items-center gap-2 border border-line px-3 lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <span className="mono text-[10px] tracking-[0.18em] text-white">{open ? "CLOSE" : "MENU"}</span>
            </button>
          </div>
        </div>

        <motion.div
          className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-red"
          style={{ scaleX: progress }}
        />
      </header>

      {/* full-screen menu */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="fixed inset-0 z-40 flex flex-col bg-bg pt-16 lg:hidden"
            initial={{ clipPath: "inset(0 0 100% 0)" }}
            animate={{ clipPath: "inset(0 0 0% 0)" }}
            exit={{ clipPath: "inset(0 0 100% 0)" }}
            transition={{ duration: 0.7, ease: CUT }}
          >
            <div className="wrap flex flex-1 flex-col justify-center">
              {MENU.map((item, i) => (
                <div key={item.href} className="overflow-hidden border-b border-line">
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: "0%" }}
                    transition={{ delay: 0.25 + i * 0.05, duration: 0.8, ease: EASE }}
                  >
                    <Link href={item.href} className="group flex items-baseline gap-4 py-3">
                      <span className="mono text-[10px] text-red">0{i + 1}</span>
                      <span
                        className={`display text-[52px] transition-colors sm:text-[72px] ${
                          pathname.startsWith(item.href) ? "text-white" : "text-muted group-hover:text-white"
                        }`}
                      >
                        {item.label}
                      </span>
                      {item.hint && <span className="mono ml-auto text-[10px] tracking-[0.14em] text-faint">{item.hint.toUpperCase()}</span>}
                    </Link>
                  </motion.div>
                </div>
              ))}
            </div>
            <div className="wrap mono flex justify-between py-6 text-[10px] tracking-[0.16em] text-faint">
              <span>GLOBAL // SECURE CHANNEL</span>
              <span className="tnum">{clock} Z</span>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}

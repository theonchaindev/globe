"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { Search, Menu, X, UserRound, ArrowRight } from "lucide-react";
import Logo from "./Logo";
import UtcClock from "./UtcClock";
import ConnectWallet from "./ConnectWallet";
import CommandPalette from "./CommandPalette";
import { EASE } from "./motion";

const NAV = [
  { href: "/launch", label: "Launch", hint: "Deploy a token" },
  { href: "/explore", label: "Explore", hint: "Every live token" },
  { href: "/leaderboard", label: "Leaderboard", hint: "Top missions" },
  { href: "/command", label: "Analytics", hint: "Network overview" },
  { href: "/docs", label: "Docs", hint: "How it works" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [hover, setHover] = useState<string | null>(null);
  const pathname = usePathname();
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

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

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
  }, [open]);

  const activeHref = NAV.find((n) => pathname.startsWith(n.href))?.href ?? null;
  const pill = hover ?? activeHref;

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 border-b transition-[background,border-color] duration-500 ${
          scrolled || open
            ? "border-line bg-[rgba(7,6,5,0.78)] backdrop-blur-xl"
            : "border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-16 w-full max-w-[1440px] items-center gap-8 px-5 sm:px-8 lg:px-12">
          <Link href="/" className="group flex items-center gap-2.5 text-white" aria-label="GLOBAL home">
            <span className="transition-transform duration-700 group-hover:rotate-[360deg]">
              <Logo />
            </span>
            <span className="text-[15px] font-semibold tracking-[0.32em]">GLOBAL</span>
          </Link>

          <nav className="hidden items-center lg:flex" onMouseLeave={() => setHover(null)}>
            {NAV.map((item) => {
              const active = activeHref === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onMouseEnter={() => setHover(item.href)}
                  className={`relative rounded-md px-3.5 py-2 text-[13px] transition-colors duration-300 ${
                    active || hover === item.href ? "text-white" : "text-muted"
                  }`}
                >
                  {pill === item.href && (
                    <motion.span
                      layoutId="nav-pill"
                      className="absolute inset-0 rounded-md bg-[rgba(232,224,208,0.07)]"
                      transition={{ type: "spring", stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="relative">{item.label}</span>
                  {active && (
                    <motion.span
                      layoutId="nav-dot"
                      className="absolute -bottom-[13px] left-1/2 h-px w-5 -translate-x-1/2 bg-primary"
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          <div className="ml-auto flex items-center gap-2.5">
            <UtcClock />
            <button
              onClick={() => setPalette(true)}
              className="hidden h-9 items-center gap-2.5 rounded-md border border-line bg-[rgba(16,14,11,0.6)] pl-3 pr-2 text-[12px] text-faint transition-colors hover:border-line-strong hover:text-muted md:flex"
              aria-label="Search (⌘K)"
            >
              <Search size={13} />
              <span className="pr-6">Search</span>
              <kbd>⌘K</kbd>
            </button>
            <button
              onClick={() => setPalette(true)}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted md:hidden"
              aria-label="Search"
            >
              <Search size={14} />
            </button>
            <Link
              href="/profile"
              className={`hidden h-9 w-9 items-center justify-center rounded-md border transition-colors sm:flex ${
                pathname === "/profile"
                  ? "border-line-strong text-primary"
                  : "border-line text-muted hover:border-line-strong hover:text-white"
              }`}
              aria-label="Profile"
              title="Profile & creator fees"
            >
              <UserRound size={14} />
            </Link>
            <ConnectWallet />
            <button
              className="flex h-9 w-9 items-center justify-center rounded-md border border-line text-muted lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
              aria-expanded={open}
            >
              <AnimatePresence mode="wait" initial={false}>
                <motion.span
                  key={open ? "x" : "m"}
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  {open ? <X size={15} /> : <Menu size={15} />}
                </motion.span>
              </AnimatePresence>
            </button>
          </div>
        </div>

        {/* reading progress */}
        <motion.div
          className="absolute inset-x-0 bottom-[-1px] h-px origin-left bg-[rgba(232,224,208,0.35)]"
          style={{ scaleX: progress }}
        />
      </header>

      {/* mobile sheet */}
      <AnimatePresence>
        {open && (
          <motion.nav
            className="fixed inset-x-0 bottom-0 top-16 z-40 overflow-y-auto bg-[rgba(7,6,5,0.97)] px-5 pb-10 pt-6 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            {[...NAV, { href: "/profile", label: "Profile", hint: "Wallets & creator fees" }].map((item, i) => (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.04 * i, duration: 0.5, ease: EASE }}
              >
                <Link
                  href={item.href}
                  className="flex items-center justify-between border-b border-line py-5"
                >
                  <span>
                    <span className="mono mr-3 text-[10px] text-faint">0{i + 1}</span>
                    <span className={`text-[22px] font-medium ${pathname.startsWith(item.href) ? "text-white" : "text-muted"}`}>
                      {item.label}
                    </span>
                    <span className="mt-0.5 block pl-7 text-[12px] text-faint">{item.hint}</span>
                  </span>
                  <ArrowRight size={16} className="text-faint" />
                </Link>
              </motion.div>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      <CommandPalette open={palette} onClose={() => setPalette(false)} />
    </>
  );
}

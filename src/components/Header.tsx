"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Search, Menu, X, UserRound } from "lucide-react";
import Logo from "./Logo";
import UtcClock from "./UtcClock";
import ConnectWallet from "./ConnectWallet";

const NAV: Array<{ href: string; label: string; mobileOnly?: boolean }> = [
  { href: "/launch", label: "Launch" },
  { href: "/explore", label: "Explore" },
  { href: "/explore?view=missions", label: "Missions" },
  { href: "/leaderboard", label: "Leaderboard" },
  { href: "/command", label: "Analytics" },
  { href: "/docs", label: "Documentation" },
  { href: "/profile", label: "Profile", mobileOnly: true },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-all duration-300 ${
        scrolled
          ? "border-line bg-[rgba(7,6,5,0.72)] backdrop-blur-xl"
          : "border-transparent bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 w-full max-w-[1440px] items-center gap-6 px-5 sm:px-8 lg:px-12">
        <Link href="/" className="flex items-center gap-2.5 text-white">
          <Logo />
          <span className="text-[15px] font-semibold tracking-[0.32em]">GLOBAL</span>
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {NAV.filter((i) => !i.mobileOnly).map((item) => {
            const active = pathname === item.href.split("?")[0];
            return (
              <Link
                key={item.label}
                href={item.href}
                className={`rounded-md px-3 py-1.5 text-[13px] transition-colors ${
                  active ? "text-white" : "text-muted hover:text-white"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-4">
          <UtcClock />
          <Link
            href="/explore"
            className="hidden h-8 w-8 items-center justify-center rounded-md border border-line text-muted transition-colors hover:text-white sm:flex"
            aria-label="Search missions"
          >
            <Search size={14} />
          </Link>
          <Link
            href="/profile"
            className={`hidden h-8 w-8 items-center justify-center rounded-md border transition-colors sm:flex ${
              pathname === "/profile"
                ? "border-[rgba(232,224,208,0.4)] text-primary"
                : "border-line text-muted hover:text-white"
            }`}
            aria-label="Operative profile"
          >
            <UserRound size={14} />
          </Link>
          <ConnectWallet />
          <button
            className="flex h-8 w-8 items-center justify-center rounded-md border border-line text-muted lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X size={15} /> : <Menu size={15} />}
          </button>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line bg-[rgba(7,6,5,0.95)] px-5 py-3 backdrop-blur-xl lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="block rounded-md px-2 py-2.5 text-sm text-muted hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}

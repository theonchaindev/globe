"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { CUT, EASE, Reveal } from "./motion";

/** Segmented control: underline tabs with a sliding red rule. */
export function Segmented<T extends string>({
  id,
  options,
  value,
  onChange,
}: {
  id: string;
  options: Array<{ label: ReactNode; value: T; aria?: string }>;
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <div className="flex border-b border-line">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-label={o.aria}
          aria-pressed={value === o.value}
          className={`mono relative flex h-10 min-w-10 items-center justify-center px-3.5 text-[11px] uppercase tracking-[0.16em] transition-colors duration-300 ${
            value === o.value ? "text-white" : "text-faint hover:text-white"
          }`}
        >
          {o.label}
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-x-0 -bottom-px h-[2px] bg-red"
              transition={{ duration: 0.45, ease: CUT }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`group relative ${className}`}>
      <Search
        size={14}
        className="absolute left-0 top-1/2 -translate-y-1/2 text-faint transition-colors group-focus-within:text-red"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 w-full border-b border-line bg-transparent pl-7 pr-2 text-[14px] text-white transition-colors placeholder:text-faint focus:border-red focus:outline-none"
      />
    </div>
  );
}

export function EmptyState({
  title,
  body,
  cta = { href: "/launch", label: "Launch a token" },
}: {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  cta?: { href: string; label: string } | null;
}) {
  const inner = (
    <>
      <span className="min-w-0">
        <span className="row-dim mono block text-[10px] tracking-[0.2em] text-faint">NOTHING ON FILE</span>
        <span className="display-md mt-2 block text-[34px] text-white sm:text-[48px]">{title}</span>
        <span className="row-dim mt-2 block max-w-lg text-[14px] leading-relaxed text-muted">{body}</span>
      </span>
      {cta && (
        <span className="flex shrink-0 items-center gap-3">
          <span className="mono hidden text-[11px] tracking-[0.16em] text-white sm:inline">{cta.label.toUpperCase()}</span>
          <ArrowRight size={30} className="text-red transition-all duration-500 group-hover:translate-x-2 group-hover:text-white" />
        </span>
      )}
    </>
  );
  return (
    <Reveal>
      {cta ? (
        <Link href={cta.href} className="row-wipe group flex items-center justify-between gap-6 border-y border-line-strong px-2 py-10">
          {inner}
        </Link>
      ) : (
        <div className="flex items-center justify-between gap-6 border-y border-line-strong px-2 py-10">{inner}</div>
      )}
    </Reveal>
  );
}

/** Placeholder row while the registry loads. */
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-5 border-b border-line py-6">
      <div className="skeleton h-3 w-6" />
      <div className="skeleton h-11 w-11" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-5 w-48" />
        <div className="skeleton h-2.5 w-16" />
      </div>
      <div className="skeleton hidden h-[3px] w-1/4 md:block" />
    </div>
  );
}

/** Kept for grid views. */
export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="skeleton h-12 w-12" />
      <div className="skeleton mt-5 h-6 w-40" />
      <div className="skeleton mt-2 h-2.5 w-16" />
      <div className="skeleton mt-6 h-[3px] w-full" />
    </div>
  );
}

/** Animated progress rule. */
export function Bar({ pct, done, className = "" }: { pct: number; done?: boolean; className?: string }) {
  return (
    <div className={`h-[3px] bg-[rgba(244,242,238,0.1)] ${className}`}>
      <motion.div
        className="h-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.2, ease: EASE }}
        style={{ background: done ? "var(--primary)" : "var(--red)" }}
      />
    </div>
  );
}

/** Big-number stat: condensed figure over a mono label, left-ruled. */
export function Stat({ label, children, delay = 0 }: { label: string; children: ReactNode; delay?: number }) {
  return (
    <Reveal delay={delay} className="border-l border-line-strong pl-5">
      <p className="display text-[52px] text-white sm:text-[68px]">{children}</p>
      <p className="microlabel mt-2 !text-muted">{label}</p>
    </Reveal>
  );
}

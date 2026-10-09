"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import { Reveal } from "./motion";

/** Segmented control with a sliding indicator. */
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
    <div className="flex rounded-lg border border-line bg-[rgba(16,14,11,0.6)] p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          aria-label={o.aria}
          aria-pressed={value === o.value}
          className={`relative flex h-8 min-w-9 items-center justify-center px-3 text-[12px] transition-colors duration-300 ${
            value === o.value ? "text-white" : "text-muted hover:text-white"
          }`}
        >
          {value === o.value && (
            <motion.span
              layoutId={`seg-${id}`}
              className="absolute inset-0 rounded-md border border-line-strong bg-panel2"
              transition={{ type: "spring", stiffness: 420, damping: 34 }}
            />
          )}
          <span className="relative flex items-center">{o.label}</span>
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
        className="absolute left-3 top-1/2 -translate-y-1/2 text-faint transition-colors group-focus-within:text-primary"
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-full rounded-lg border border-line bg-[rgba(16,14,11,0.6)] pl-9 pr-3 text-[13px] text-white transition-colors placeholder:text-faint focus:border-line-strong focus:outline-none"
      />
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  body,
  cta = { href: "/launch", label: "Launch a token" },
}: {
  icon?: ReactNode;
  title: string;
  body: ReactNode;
  cta?: { href: string; label: string } | null;
}) {
  return (
    <Reveal>
      <div className="card brackets flex flex-col items-center gap-3 px-6 py-20 text-center">
        {icon && <div className="mb-1 text-faint">{icon}</div>}
        <p className="text-[16px] font-medium text-white">{title}</p>
        <p className="max-w-sm text-[13.5px] leading-relaxed text-muted">{body}</p>
        {cta && (
          <Link href={cta.href} className="btn btn-primary btn-sm mt-3">
            {cta.label} <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </Reveal>
  );
}

/** Placeholder card while the registry loads. */
export function SkeletonCard() {
  return (
    <div className="card p-5">
      <div className="flex items-start gap-3.5">
        <div className="skeleton h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-2 w-20" />
          <div className="skeleton h-3.5 w-32" />
          <div className="skeleton h-2 w-12" />
        </div>
      </div>
      <div className="skeleton mt-5 h-1 w-full" />
      <div className="skeleton mt-5 h-2 w-full" />
    </div>
  );
}

/** Animated progress bar used in tables. */
export function Bar({ pct, done, className = "" }: { pct: number; done?: boolean; className?: string }) {
  return (
    <div className={`h-1 overflow-hidden rounded-full bg-[rgba(255,255,255,0.07)] ${className}`}>
      <motion.div
        className="h-full rounded-full"
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
        style={{ background: done ? "var(--accent)" : "var(--primary)" }}
      />
    </div>
  );
}

"use client";

import type { ReactNode } from "react";
import { Decrypt, DrawLine, Reveal } from "./motion";

/**
 * Standard page opener: a decrypting file label, the title, a plain-English
 * line saying what the page is for, and optional actions on the right.
 */
export default function PageHeader({
  code,
  title,
  description,
  actions,
}: {
  /** cryptic file label, e.g. "FILE 02 — MISSION DATABASE" */
  code: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="pb-10 pt-12 sm:pt-16">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="max-w-2xl">
          <p className="microlabel flex items-center gap-2">
            <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
            <Decrypt text={code} trigger="mount" />
          </p>
          <Reveal immediate delay={0.05}>
            <h1 className="mt-4 text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] text-white sm:text-[44px]">
              {title}
            </h1>
          </Reveal>
          {description && (
            <Reveal immediate delay={0.12}>
              <p className="mt-3 text-[15px] leading-relaxed text-muted">{description}</p>
            </Reveal>
          )}
        </div>
        {actions && (
          <Reveal immediate delay={0.18} className="flex flex-wrap items-center gap-2.5">
            {actions}
          </Reveal>
        )}
      </div>
      <DrawLine className="mt-10" delay={0.2} />
    </header>
  );
}

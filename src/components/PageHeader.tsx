"use client";

import type { ReactNode } from "react";
import { Decrypt, DrawLine, Lines, Reveal } from "./motion";

/**
 * Standard page opener: a decrypting case-file label, a huge condensed
 * title that slides up line by line, then a ruled strip with a plain-English
 * description and the page's actions.
 */
export default function PageHeader({
  code,
  title,
  description,
  actions,
  compact = false,
}: {
  /** case-file label, e.g. "FILE 02 — MISSION DATABASE" */
  code: string;
  /** one or two lines */
  title: ReactNode | ReactNode[];
  description?: ReactNode;
  actions?: ReactNode;
  /** smaller title for task pages, so the work starts above the fold */
  compact?: boolean;
}) {
  const lines = Array.isArray(title) ? title : [title];
  return (
    <header className={`wrap ${compact ? "pb-10 pt-28 sm:pt-32" : "pb-14 pt-32 sm:pt-40"}`}>
      <p className="microlabel flex items-center gap-3 !text-muted">
        <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-red" />
        <Decrypt text={code} trigger="mount" />
      </p>
      <h1 className={`display mt-6 text-white ${compact ? "text-[16vw] sm:text-[88px] lg:text-[104px]" : "text-[19vw] sm:text-[120px] lg:text-[156px]"}`}>
        <Lines immediate delay={0.1} lines={lines} />
      </h1>
      <DrawLine className={compact ? "mt-6" : "mt-10"} delay={0.3} />
      {(description || actions) && (
        <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
          {description && (
            <Reveal immediate delay={0.4} className="max-w-xl">
              <p className="text-[16px] leading-relaxed text-muted sm:text-[17px]">{description}</p>
            </Reveal>
          )}
          {actions && (
            <Reveal immediate delay={0.5} className="flex flex-wrap items-center gap-3">
              {actions}
            </Reveal>
          )}
        </div>
      )}
    </header>
  );
}

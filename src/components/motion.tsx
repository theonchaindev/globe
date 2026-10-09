"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useInView, useReducedMotion, type Variants } from "framer-motion";

/**
 * Motion primitives for the whole site. One easing curve, one rhythm.
 * Every effect collapses to a plain fade under prefers-reduced-motion.
 */

export const EASE = [0.16, 1, 0.3, 1] as const;
/** sharper in-out curve for wipes and cuts */
export const CUT = [0.7, 0, 0.2, 1] as const;

/** Fade + lift + de-blur into view. Triggers on its own (unclipped) box. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  className,
  as = "div",
  immediate = false,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
  as?: "div" | "section" | "li" | "header";
  /** animate on mount instead of on scroll (above-the-fold content) */
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  const M = motion[as];
  const target = { opacity: 1, y: 0, filter: "blur(0px)" };
  return (
    <M
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y, filter: "blur(6px)" }}
      {...(immediate ? { animate: target } : { whileInView: target, viewport: { once: true, margin: "-60px" } })}
      transition={{ duration: 0.8, delay, ease: EASE }}
    >
      {children}
    </M>
  );
}

const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 16, filter: "blur(4px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

/** Parent that staggers any <StaggerItem> children into view. */
export function Stagger({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      className={className}
      variants={staggerParent}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
    >
      {children}
    </motion.div>
  );
}
export function StaggerItem({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <motion.div className={className} variants={staggerChild}>
      {children}
    </motion.div>
  );
}

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&/<>=+";

/**
 * Text that "decrypts" — characters cycle through cipher glyphs and lock in
 * left to right. Renders the final string on the server (no hydration
 * mismatch, readable without JS) and scrambles only after mount.
 */
export function Decrypt({
  text,
  className,
  delay = 0,
  speed = 28,
  trigger = "view",
}: {
  text: string;
  className?: string;
  delay?: number;
  /** ms per frame */
  speed?: number;
  trigger?: "view" | "mount";
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);
  const ran = useRef(false);

  const go = trigger === "mount" || inView;

  useEffect(() => {
    if (reduce || ran.current || !go) return;
    ran.current = true;
    let frame = 0;
    let raf: ReturnType<typeof setTimeout>;
    const total = text.length;
    const tick = () => {
      const locked = Math.floor(frame / 2);
      setOut(
        text
          .split("")
          .map((ch, i) =>
            ch === " " || i < locked ? ch : GLYPHS[(i * 7 + frame * 3) % GLYPHS.length],
          )
          .join(""),
      );
      frame++;
      if (locked <= total) raf = setTimeout(tick, speed);
      else setOut(text);
    };
    const start = setTimeout(tick, delay * 1000);
    return () => {
      // interrupted (unmount / text change) — settle on the real text and allow a rerun
      clearTimeout(start);
      clearTimeout(raf);
      ran.current = false;
      setOut(text);
    };
  }, [go, reduce, text, delay, speed]);

  return (
    <span ref={ref} className={className} aria-label={text}>
      <span aria-hidden>{out}</span>
    </span>
  );
}

/**
 * A redaction bar that wipes away to reveal the text underneath —
 * declassification as a reveal.
 */
export function Redact({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`relative inline-block ${className}`}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      <motion.span
        className="inline-block"
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: delay + 0.35, duration: 0.01 } } }}
      >
        {children}
      </motion.span>
      {!reduce && (
        <motion.span
          aria-hidden
          className="absolute inset-y-[0.04em] left-0 right-0 bg-red"
          variants={{
            hidden: { clipPath: "inset(0 100% 0 0)" },
            show: {
              clipPath: ["inset(0 100% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 0)", "inset(0 0% 0 100%)"],
              transition: { delay, duration: 0.95, times: [0, 0.4, 0.5, 1], ease: "easeInOut" },
            },
          }}
        />
      )}
    </motion.span>
  );
}

/** Thin progress line that draws itself across when scrolled into view. */
export function DrawLine({ className = "", delay = 0 }: { className?: string; delay?: number }) {
  return (
    <motion.span
      aria-hidden
      className={`block h-px origin-left bg-[var(--line-strong)] ${className}`}
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 1.2, delay, ease: EASE }}
    />
  );
}

/**
 * Title-sequence reveal: each line slides up from behind a mask, staggered.
 * Pass an array of lines (strings or nodes).
 */
export function Lines({
  lines,
  className = "",
  lineClassName = "",
  delay = 0,
  stagger = 0.09,
  immediate = false,
}: {
  lines: ReactNode[];
  className?: string;
  lineClassName?: string;
  delay?: number;
  stagger?: number;
  immediate?: boolean;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.span
      className={`block ${className}`}
      initial="hidden"
      {...(immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "-40px" } })}
    >
      {lines.map((line, i) => (
        <span key={i} className="block overflow-hidden pb-[0.06em]">
          <motion.span
            className={`block ${lineClassName}`}
            variants={{
              hidden: reduce ? { opacity: 0 } : { y: "105%" },
              show: reduce
                ? { opacity: 1, transition: { delay: delay + i * stagger } }
                : { y: "0%", transition: { duration: 1.05, delay: delay + i * stagger, ease: EASE } },
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

/** Image that slowly zooms out as it scrolls into view (Ken Burns, once). */
export function Cinematic({
  src,
  className = "",
  position = "center",
}: {
  src: string;
  className?: string;
  position?: string;
}) {
  return (
    <motion.div
      aria-hidden
      className={`cine absolute inset-0 bg-cover ${className}`}
      style={{ backgroundImage: `url(${src})`, backgroundPosition: position }}
      initial={{ scale: 1.18 }}
      whileInView={{ scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 2.4, ease: EASE }}
    />
  );
}

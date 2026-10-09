"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Counts up when it enters the viewport, and re-animates from the current
 * figure whenever `value` changes later (e.g. once chain data arrives).
 */
export default function Counter({
  value,
  format = (n) => Math.round(n).toLocaleString("en-US"),
  duration = 1400,
  className = "",
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const [display, setDisplay] = useState(format(0));
  const [seen, setSeen] = useState(false);
  const current = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!seen) return;
    const from = current.current;
    const t0 = performance.now();
    let raf = 0;
    const step = (t: number) => {
      const k = Math.min(1, (t - t0) / duration);
      const v = from + (value - from) * (1 - Math.pow(1 - k, 3));
      current.current = v;
      setDisplay(format(v));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // format is usually an inline lambda — exclude it so renders don't restart the tween
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, value, duration]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {display}
    </span>
  );
}

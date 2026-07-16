"use client";

import { useEffect, useRef, useState } from "react";

/** Counts up from 0 when it enters the viewport. Formats via the `format` fn. */
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
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || started.current) return;
        started.current = true;
        const t0 = performance.now();
        const step = (t: number) => {
          const k = Math.min(1, (t - t0) / duration);
          const eased = 1 - Math.pow(1 - k, 3);
          setDisplay(format(value * eased));
          if (k < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value, duration, format]);

  return (
    <span ref={ref} className={`tnum ${className}`}>
      {display}
    </span>
  );
}

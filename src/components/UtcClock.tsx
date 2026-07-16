"use client";

import { useEffect, useState } from "react";

/** UTC clock + fake latency + session id — the micro-detail strip. */
export default function UtcClock() {
  const [now, setNow] = useState<string>("--:--:--");
  const [latency, setLatency] = useState<number>(12);
  const [session] = useState(() =>
    `SES-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  );

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        d.toISOString().slice(11, 19),
      );
    };
    tick();
    const t = setInterval(tick, 1000);
    const l = setInterval(
      () => setLatency(9 + Math.floor(Math.random() * 14)),
      3200,
    );
    return () => {
      clearInterval(t);
      clearInterval(l);
    };
  }, []);

  return (
    <div className="mono hidden items-center gap-4 text-[10px] tracking-[0.14em] text-faint xl:flex">
      <span className="flex items-center gap-1.5">
        <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
        SECURE
      </span>
      <span className="tnum">{now} UTC</span>
      <span className="tnum">{latency}MS</span>
      <span>{session}</span>
    </div>
  );
}

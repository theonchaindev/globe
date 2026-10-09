"use client";

import { useEffect, useState } from "react";

/** Live UTC clock — the one bit of telemetry worth keeping in the header. */
export default function UtcClock() {
  const [now, setNow] = useState<string>("--:--:--");

  useEffect(() => {
    const tick = () => setNow(new Date().toISOString().slice(11, 19));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mono hidden items-center gap-2 pr-2 text-[10px] tracking-[0.14em] text-faint xl:flex">
      <span className="pulse-dot h-1 w-1 rounded-full bg-primary" />
      <span className="tnum">{now} UTC</span>
    </div>
  );
}

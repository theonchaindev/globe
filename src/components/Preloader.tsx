"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";

/**
 * Full-screen boot preloader — the GLOBAL wireframe globe spinning on its
 * axis while the app loads. Shows once per session (full page loads only;
 * client-side navigation never re-triggers it).
 */
export default function Preloader() {
  const [phase, setPhase] = useState<"loading" | "leaving" | "done">("loading");

  useEffect(() => {
    if (sessionStorage.getItem("globe.booted")) {
      setPhase("done");
      return;
    }
    const MIN_SHOW = 1400; // let the spin register
    const start = performance.now();
    const finish = () => {
      const wait = Math.max(0, MIN_SHOW - (performance.now() - start));
      setTimeout(() => {
        setPhase("leaving");
        sessionStorage.setItem("globe.booted", "1");
        setTimeout(() => setPhase("done"), 600);
      }, wait);
    };
    if (document.readyState === "complete") finish();
    else {
      window.addEventListener("load", finish, { once: true });
      // hard fallback — never trap the user behind the loader
      const t = setTimeout(finish, 4000);
      return () => {
        window.removeEventListener("load", finish);
        clearTimeout(t);
      };
    }
  }, []);

  if (phase === "done") return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-bg transition-opacity duration-500"
      style={{ opacity: phase === "leaving" ? 0 : 1, pointerEvents: phase === "leaving" ? "none" : "auto" }}
    >
      <div style={{ perspective: 700 }}>
        <img
          src="/logo.png"
          alt=""
          className="h-16 w-auto animate-[globe-spin_2.2s_linear_infinite] sm:h-20"
          draggable={false}
        />
      </div>
      <p className="mt-8 text-[15px] font-semibold tracking-[0.42em] text-white">GLOBAL</p>
      <p className="mono mt-3 text-[9px] tracking-[0.24em] text-faint">
        ESTABLISHING SECURE UPLINK
      </p>
      {/* progress shimmer */}
      <div className="mt-6 h-px w-40 overflow-hidden bg-[rgba(255,255,255,0.08)]">
        <div className="h-full w-1/3 animate-[loader-sweep_1.1s_ease-in-out_infinite] bg-primary" />
      </div>
      <style jsx global>{`
        @keyframes globe-spin {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(360deg); }
        }
        @keyframes loader-sweep {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(440%); }
        }
      `}</style>
    </div>
  );
}

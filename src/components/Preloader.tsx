"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Cold open: GLOBAL on black with a red progress rule, then the frame splits
 * open like letterbox bars. Once per session; client navigation never shows it.
 */
export default function Preloader() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem("globe.booted")) {
      setShow(false);
      return;
    }
    const t = setTimeout(() => {
      sessionStorage.setItem("globe.booted", "1");
      setShow(false);
    }, 1700);
    return () => clearTimeout(t);
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div aria-hidden className="fixed inset-0 z-[100]" exit={{ pointerEvents: "none" }}>
          {/* two halves that split apart on exit */}
          <motion.div
            className="absolute inset-x-0 top-0 h-1/2 bg-bg"
            exit={{ y: "-100%" }}
            transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          />
          <motion.div
            className="absolute inset-x-0 bottom-0 h-1/2 bg-bg"
            exit={{ y: "100%" }}
            transition={{ duration: 0.9, ease: [0.7, 0, 0.2, 1] }}
          />
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center"
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
          >
            <div className="overflow-hidden">
              <motion.p
                className="display text-[64px] tracking-[0.12em] text-white sm:text-[96px]"
                initial={{ y: "100%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              >
                GLOBAL
              </motion.p>
            </div>
            <div className="mt-4 h-[2px] w-48 overflow-hidden bg-[rgba(244,242,238,0.1)]">
              <motion.div
                className="h-full origin-left bg-red"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1.4, ease: [0.7, 0, 0.2, 1] }}
              />
            </div>
            <p className="mono mt-4 text-[9px] tracking-[0.3em] text-faint">ESTABLISHING SECURE UPLINK</p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

"use client";

import { motion, useReducedMotion } from "framer-motion";

/**
 * Re-mounts on every navigation: a red panel cuts away upward to reveal the
 * new page — the scene-change wipe.
 */
export default function Template({ children }: { children: React.ReactNode }) {
  const reduce = useReducedMotion();
  return (
    <>
      {!reduce && (
        <motion.div
          aria-hidden
          className="pointer-events-none fixed inset-0 z-[80] origin-top bg-red"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          transition={{ duration: 0.75, ease: [0.7, 0, 0.2, 1] }}
        />
      )}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: reduce ? 0 : 0.3 }}
      >
        {children}
      </motion.div>
    </>
  );
}

/* eslint-disable @next/next/no-img-element */

/** GLOBAL brand mark — white wireframe globe (public/logo.png). */
export default function Logo({ size = 22 }: { size?: number }) {
  // the mark is wide (503x231) — size refers to height
  return (
    <img
      src="/logo.png"
      alt=""
      aria-hidden
      style={{ height: size, width: "auto" }}
      className="shrink-0 select-none"
      draggable={false}
    />
  );
}

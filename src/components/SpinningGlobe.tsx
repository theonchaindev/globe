"use client";

import { useEffect, useRef } from "react";
import { MISSIONS } from "@/lib/data";

/**
 * Spinning dot-matrix globe rendered on canvas — orthographic projection,
 * procedural landmass dots, live mission markers with pulses. Rotates
 * slowly about its axis; back hemisphere is dimmed.
 */

// Crude continent polygons in equirectangular space (x = lon+180, y = 90-lat)
const CONTINENTS: number[][][] = [
  // North America
  [[25, 30], [60, 22], [95, 26], [110, 40], [100, 52], [88, 60], [80, 74], [68, 66], [52, 60], [40, 48], [28, 42]],
  // South America
  [[88, 96], [102, 92], [112, 104], [110, 122], [100, 142], [92, 134], [86, 114]],
  // Europe
  [[168, 30], [190, 24], [202, 32], [196, 44], [182, 48], [170, 42]],
  // Africa
  [[168, 58], [192, 54], [206, 66], [202, 86], [190, 106], [180, 96], [172, 76]],
  // Asia
  [[204, 24], [250, 18], [290, 26], [302, 42], [288, 54], [268, 62], [248, 56], [228, 50], [210, 42]],
  // SE Asia / India
  [[244, 62], [258, 60], [264, 74], [254, 84], [246, 74]],
  // Australia
  [[292, 112], [314, 108], [322, 120], [310, 130], [296, 126]],
  // Greenland
  [[110, 12], [130, 8], [140, 16], [128, 24], [114, 20]],
];

function inPoly(x: number, y: number, poly: number[][]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

interface P3 {
  x: number;
  y: number;
  z: number;
}

function toSphere(lat: number, lon: number): P3 {
  const phi = (lat * Math.PI) / 180;
  const lam = (lon * Math.PI) / 180;
  return {
    x: Math.cos(phi) * Math.sin(lam),
    y: Math.sin(phi),
    z: Math.cos(phi) * Math.cos(lam),
  };
}

// Precompute land dots (every 3.5°)
const LAND: P3[] = [];
for (let lat = -60; lat <= 78; lat += 3.5) {
  for (let lon = -180; lon < 180; lon += 3.5) {
    const ex = lon + 180;
    const ey = 90 - lat;
    if (CONTINENTS.some((p) => inPoly(ex, ey, p))) {
      LAND.push(toSphere(lat, lon));
    }
  }
}

const NODES = MISSIONS.slice(0, 10).map((m) => ({
  p: toSphere(m.coords.lat, m.coords.lon),
  label: m.coords.label,
  active: m.status === "ACTIVE",
}));

const TILT = -0.35; // axial tilt, radians

export default function SpinningGlobe() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let w = 0;
    let h = 0;
    let R = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      R = Math.min(w, h) * 0.42;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const rotate = (p: P3, rotY: number): P3 => {
      // spin about Y
      const x1 = p.x * Math.cos(rotY) + p.z * Math.sin(rotY);
      const z1 = -p.x * Math.sin(rotY) + p.z * Math.cos(rotY);
      // axial tilt about X
      const y2 = p.y * Math.cos(TILT) - z1 * Math.sin(TILT);
      const z2 = p.y * Math.sin(TILT) + z1 * Math.cos(TILT);
      return { x: x1, y: y2, z: z2 };
    };

    const draw = (t: number) => {
      const rot = t * 0.00012; // slow, dignified spin
      const cx = w / 2;
      const cy = h / 2;
      ctx.clearRect(0, 0, w, h);

      // atmosphere glow
      const glow = ctx.createRadialGradient(cx, cy, R * 0.6, cx, cy, R * 1.35);
      glow.addColorStop(0, "rgba(77,227,255,0)");
      glow.addColorStop(0.75, "rgba(77,227,255,0.05)");
      glow.addColorStop(1, "rgba(77,227,255,0)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);

      // sphere outline
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();

      // graticule: latitude rings (drawn as ellipses, tilted)
      ctx.strokeStyle = "rgba(255,255,255,0.05)";
      for (let lat = -60; lat <= 60; lat += 30) {
        const phi = (lat * Math.PI) / 180;
        const ry = Math.cos(phi) * R;
        const yOff = Math.sin(phi) * R;
        ctx.beginPath();
        ctx.ellipse(
          cx,
          cy - yOff * Math.cos(TILT),
          ry,
          Math.abs(ry * Math.sin(TILT)) + 0.5,
          0,
          0,
          Math.PI * 2,
        );
        ctx.stroke();
      }

      // land dots
      for (const p of LAND) {
        const q = rotate(p, rot);
        const sx = cx + q.x * R;
        const sy = cy - q.y * R;
        if (q.z > 0) {
          // front hemisphere — brightness scales with z
          const a = 0.18 + q.z * 0.5;
          ctx.fillStyle = `rgba(200,235,255,${a})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.1, 0, Math.PI * 2);
          ctx.fill();
        } else if (q.z > -0.35) {
          // limb — very faint
          ctx.fillStyle = "rgba(200,235,255,0.05)";
          ctx.beginPath();
          ctx.arc(sx, sy, 0.8, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // mission nodes
      ctx.textAlign = "left";
      ctx.font = "500 8px var(--font-geist-mono), monospace";
      for (let i = 0; i < NODES.length; i++) {
        const n = NODES[i];
        const q = rotate(n.p, rot);
        if (q.z <= 0.05) continue;
        const sx = cx + q.x * R;
        const sy = cy - q.y * R;
        const color = n.active ? "168,255,53" : "77,227,255";

        // pulse ring
        const pk = ((t * 0.0011 + i * 0.4) % 1.6) / 1.6;
        ctx.beginPath();
        ctx.arc(sx, sy, 2 + pk * 9, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(${color},${(1 - pk) * 0.4 * q.z})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        // dot
        ctx.beginPath();
        ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${color},${0.5 + q.z * 0.5})`;
        ctx.fill();

        // label for the most front-facing nodes only
        if (q.z > 0.72) {
          ctx.fillStyle = `rgba(255,255,255,${(q.z - 0.72) * 1.6})`;
          ctx.fillText(n.label, sx + 6, sy + 2.5);
        }
      }

      // connection arcs between visible active nodes
      const vis = NODES.map((n) => ({ n, q: rotate(n.p, rot) })).filter(
        (v) => v.q.z > 0.15,
      );
      ctx.lineWidth = 0.7;
      for (let i = 0; i + 1 < vis.length && i < 4; i += 2) {
        const a = vis[i].q;
        const b = vis[i + 1].q;
        const ax = cx + a.x * R;
        const ay = cy - a.y * R;
        const bx = cx + b.x * R;
        const by = cy - b.y * R;
        const mx = (ax + bx) / 2;
        const my = (ay + by) / 2;
        // bow the arc outward from centre
        const dx = mx - cx;
        const dy = my - cy;
        const d = Math.hypot(dx, dy) || 1;
        const ox = mx + (dx / d) * R * 0.22;
        const oy = my + (dy / d) * R * 0.22;
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.quadraticCurveTo(ox, oy, bx, by);
        ctx.strokeStyle = `rgba(168,255,53,${0.16 * Math.min(a.z, b.z)})`;
        ctx.stroke();
        // moving packet along the arc
        const k = (t * 0.0004 + i * 0.3) % 1;
        const px = (1 - k) * (1 - k) * ax + 2 * (1 - k) * k * ox + k * k * bx;
        const py = (1 - k) * (1 - k) * ay + 2 * (1 - k) * k * oy + k * k * by;
        ctx.beginPath();
        ctx.arc(px, py, 1.3, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(168,255,53,0.7)";
        ctx.fill();
      }

      // equatorial satellite orbit + satellite
      ctx.beginPath();
      ctx.ellipse(cx, cy, R * 1.18, R * 0.34, 0, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(255,255,255,0.06)";
      ctx.lineWidth = 0.8;
      ctx.stroke();
      const sa = t * 0.0005;
      const satX = cx + Math.cos(sa) * R * 1.18;
      const satY = cy + Math.sin(sa) * R * 0.34;
      const satFront = Math.sin(sa) > -0.15;
      if (satFront) {
        ctx.beginPath();
        ctx.arc(satX, satY, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(77,227,255,0.9)";
        ctx.fill();
        ctx.beginPath();
        ctx.arc(satX, satY, 4, 0, Math.PI * 2);
        ctx.strokeStyle = "rgba(77,227,255,0.25)";
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return (
    <div className="relative">
      <canvas ref={ref} className="h-[300px] w-full" aria-label="Rotating globe of live missions" />
      {/* corner coordinates */}
      <span className="mono pointer-events-none absolute left-1 top-1 text-[8px] tracking-[0.18em] text-faint">
        ORTHO // EARTH-1
      </span>
      <span className="mono pointer-events-none absolute bottom-1 right-1 text-[8px] tracking-[0.18em] text-faint">
        ROT 0.7°/S — SAT LINK ACTIVE
      </span>
    </div>
  );
}

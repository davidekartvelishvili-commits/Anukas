"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen animated cloud reveal.
 * Clouds start packed across the viewport, then drift outward from the
 * center — revealing whatever is rendered underneath. Fires `onDone` when
 * the animation completes so the parent can unmount / hide it.
 *
 * Usage:
 *   {!revealDone && <CloudReveal onDone={() => setRevealDone(true)} />}
 */
export default function CloudReveal({
  onDone,
  holdMs = 250,
  animMs = 2400,
  fadeMs = 320,
}: {
  onDone?: () => void;
  holdMs?: number;
  animMs?: number;
  fadeMs?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const W = () => canvas.width;
    const H = () => canvas.height;
    const rng = () => Math.random();
    const easeIO = (t: number) =>
      t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

    function resize() {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas!.width = w;
      canvas!.height = h;
    }
    resize();

    // Fix 1: immediately fill the canvas with opaque white so the village
    // underneath is hidden from the very first paint, even before puffs
    // finish baking. Baked puffs will draw on top of this in the first
    // animation frame.
    ctx!.fillStyle = "#ffffff";
    ctx!.fillRect(0, 0, canvas!.width, canvas!.height);

    type Bump = { rdx: number; rdy: number; r: number; warm: number };
    type Puff = {
      x: number;
      y: number;
      nx: number;
      ny: number;
      travel: number;
      r: number;
      delay: number;
      warm: number;
      lh: number;
      lv: number;
      bumps: Bump[];
      baked?: HTMLCanvasElement;
      bakedOX?: number;
      bakedOY?: number;
      bakedSz?: number;
    };

    function drawSphere(
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      r: number,
      lx: number,
      ly: number,
      warm: number,
      alpha: number
    ) {
      if (alpha <= 0 || r < 1) return;
      const wf = warm;
      const cr = (243 + wf * 10) | 0;
      const cg = (239 + wf * 7) | 0;
      const cb = (232 + wf * 2) | 0;
      const sr = (208 + wf * 8) | 0;
      const sg = (203 + wf * 5) | 0;
      const sb = (215 - wf * 12) | 0;
      const dr = (185 + wf * 6) | 0;
      const dg = (180 + wf * 4) | 0;
      const db = (196 - wf * 10) | 0;

      const g = c.createRadialGradient(lx, ly, 0, x, y, r);
      g.addColorStop(0.0, `rgba(255,255,255,${(0.99 * alpha).toFixed(3)})`);
      g.addColorStop(0.12, `rgba(254,253,251,${(0.97 * alpha).toFixed(3)})`);
      g.addColorStop(0.35, `rgba(${cr},${cg},${cb},${(0.91 * alpha).toFixed(3)})`);
      g.addColorStop(0.58, `rgba(${sr},${sg},${sb},${(0.68 * alpha).toFixed(3)})`);
      g.addColorStop(0.8, `rgba(${dr},${dg},${db},${(0.28 * alpha).toFixed(3)})`);
      g.addColorStop(1.0, "rgba(0,0,0,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(x, y, r, 0, Math.PI * 2);
      c.fill();
    }

    function bakePuff(p: Puff) {
      const R = p.r;
      const size = Math.ceil(R * 5);
      const cx = R * 2.5;
      const cy = R * 2.0;

      const pc = document.createElement("canvas");
      pc.width = pc.height = size;
      const px = pc.getContext("2d")!;

      const lx = cx + p.lh * R;
      const ly = cy - p.lv * R;

      // Shadow blobs
      const sy = cy + R * 0.2;
      const gs = px.createRadialGradient(cx, sy, 0, cx, sy, R * 1.25);
      gs.addColorStop(0.0, "rgba(158,152,174,0.40)");
      gs.addColorStop(0.38, "rgba(168,162,182,0.18)");
      gs.addColorStop(0.68, "rgba(175,169,187,0.07)");
      gs.addColorStop(1.0, "rgba(0,0,0,0)");
      px.fillStyle = gs;
      px.beginPath();
      px.arc(cx, sy, R * 1.25, 0, Math.PI * 2);
      px.fill();

      for (const b of p.bumps) {
        const bx = cx + b.rdx;
        const bsy = cy + b.rdy + b.r * 0.22;
        const gb = px.createRadialGradient(bx, bsy, 0, bx, bsy, b.r * 1.2);
        gb.addColorStop(0, "rgba(152,146,168,0.32)");
        gb.addColorStop(0.5, "rgba(162,156,176,0.12)");
        gb.addColorStop(1, "rgba(0,0,0,0)");
        px.fillStyle = gb;
        px.beginPath();
        px.arc(bx, bsy, b.r * 1.2, 0, Math.PI * 2);
        px.fill();
      }

      // Bodies
      for (const b of p.bumps) {
        const bx = cx + b.rdx;
        const by = cy + b.rdy;
        drawSphere(px, bx, by, b.r, bx + p.lh * b.r, by - p.lv * b.r - b.r * 0.12, b.warm, 1.0);
      }
      drawSphere(px, cx, cy, R, lx, ly, p.warm, 1.0);

      // Specular
      const hl = px.createRadialGradient(lx, ly + R * 0.04, 0, lx, ly + R * 0.04, R * 0.38);
      hl.addColorStop(0, "rgba(255,255,255,0.58)");
      hl.addColorStop(1, "rgba(255,255,255,0)");
      px.fillStyle = hl;
      px.beginPath();
      px.arc(cx, cy, R, 0, Math.PI * 2);
      px.fill();

      p.baked = pc;
      p.bakedOX = cx;
      p.bakedOY = cy;
      p.bakedSz = size;
    }

    let puffs: Puff[] = [];

    function buildPuffs() {
      puffs = [];
      const w = W();
      const h = H();
      const cx = w / 2;
      const cy = h / 2;
      const maxDim = Math.max(w, h);
      // Aggressive mobile budget — the baking phase dominates first-frame
      // latency, so we keep total puff count low (~60-80 on mobile) and
      // let larger individual puffs cover the screen instead.
      const isMobile = w < 768;
      const spacing = maxDim / (isMobile ? 7 : 13);
      const centerCluster = isMobile ? 15 : 45;

      function addPuff(px: number, py: number, rMin: number, rMax: number, delayScale: number) {
        const dx = px - cx;
        const dy = py - cy;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        const normD = Math.min(1, dist / (maxDim * 0.52));
        const R = rMin + rng() * (rMax - rMin);

        const bumps: Bump[] = [];
        const nb = 2 + Math.floor(rng() * 3);
        for (let k = 0; k < nb; k++) {
          const a = ((k + 0.5) / nb - 0.5) * Math.PI * 0.85 - Math.PI * 0.5;
          const d = R * (0.5 + rng() * 0.28);
          bumps.push({
            rdx: Math.cos(a) * d,
            rdy: Math.sin(a) * d * 0.72,
            r: R * (0.22 + rng() * 0.2),
            warm: rng(),
          });
        }

        const p: Puff = {
          x: px,
          y: py,
          nx: dx / dist,
          ny: dy / dist,
          travel: dist + maxDim * 0.88,
          r: R,
          delay: normD * 0.3 * delayScale + rng() * 0.04,
          warm: rng(),
          lh: (rng() - 0.5) * 0.22,
          lv: 0.22 + rng() * 0.18,
          bumps,
        };

        // Descriptor only — baking is deferred and chunked so the first
        // animation frame can paint before all puffs are ready.
        puffs.push(p);
      }

      const cols = Math.ceil(w / spacing) + 5;
      const rows = Math.ceil(h / spacing) + 5;
      const rMin = isMobile ? 75 : 58;
      const rMax = isMobile ? 145 : 125;
      for (let c = -2; c < cols; c++) {
        for (let r = -2; r < rows; r++) {
          const bx = c * spacing + (rng() - 0.5) * spacing * 1.4;
          const by = r * spacing + (rng() - 0.5) * spacing * 1.4;
          addPuff(bx, by, rMin, rMax, 1.0);
        }
      }

      for (let i = 0; i < centerCluster; i++) {
        const a = rng() * Math.PI * 2;
        const d = rng() * maxDim * 0.27;
        addPuff(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 85, 155, 0.45);
      }

      puffs.sort((a, b) => a.y - b.y);
    }

    buildPuffs();

    // Chunked bake: process a small batch per frame so the main thread
    // never blocks long enough to drop frames. renderClouds skips puffs
    // whose `baked` isn't ready yet, so the animation can start before
    // every puff is finished (they'll appear as they finish in the first
    // few frames — effectively invisible given the ~250ms hold phase).
    let bakeIdx = 0;
    const BAKE_PER_FRAME = 12;
    function bakeSlice() {
      const end = Math.min(puffs.length, bakeIdx + BAKE_PER_FRAME);
      for (; bakeIdx < end; bakeIdx++) bakePuff(puffs[bakeIdx]);
      if (bakeIdx < puffs.length) requestAnimationFrame(bakeSlice);
    }
    requestAnimationFrame(bakeSlice);

    function puffState(p: Puff, progress: number) {
      const span = 1 - p.delay;
      const pt = span <= 0 ? 1 : Math.max(0, Math.min(1, (progress - p.delay) / span));
      return {
        x: p.x + p.nx * p.travel * easeIO(pt),
        y: p.y + p.ny * p.travel * easeIO(pt),
        alpha: pt > 0.78 ? (1 - pt) / 0.22 : 1,
      };
    }

    function renderClouds(progress: number) {
      const w = W();
      const h = H();
      // Direct-to-main-canvas draw: no offscreen layer, no per-puff
      // save()/restore(). globalAlpha is set per puff and reset once at
      // the end — far cheaper than a full context snapshot per puff.
      for (const p of puffs) {
        if (!p.baked) continue;
        const { x, y, alpha } = puffState(p, progress);
        if (alpha <= 0) continue;
        const dx = x - p.bakedOX!;
        const dy = y - p.bakedOY!;
        if (dx + p.bakedSz! < 0 || dx > w || dy + p.bakedSz! < 0 || dy > h) continue;
        ctx!.globalAlpha = alpha;
        ctx!.drawImage(p.baked, dx, dy);
      }
      ctx!.globalAlpha = 1;
    }

    const t0 = performance.now();
    let doneAt = -1;
    let animRevealed = false;

    function frame(ts: number) {
      const el = ts - t0;
      let progress: number;
      if (el < holdMs) progress = 0;
      else if (el < holdMs + animMs) progress = (el - holdMs) / animMs;
      else progress = 1;

      const w = W();
      const h = H();
      // Clear to transparent each frame so cloud gaps can show the village —
      // but only AFTER the HOLD phase ends. During HOLD the wrapper stays
      // white so the screen is fully covered even before every puff has
      // finished baking in the chunked baker.
      ctx!.clearRect(0, 0, w, h);
      renderClouds(progress);

      if (!animRevealed && el >= holdMs) {
        animRevealed = true;
        if (wrapperRef.current) wrapperRef.current.style.background = "transparent";
        canvas!.style.background = "transparent";
      }

      // Once animation finishes, keep rendering one more frame then unmount
      if (progress >= 1 && doneAt < 0) doneAt = ts;
      if (doneAt > 0) {
        // Fade the wrapper out so the transition isn't abrupt
        const fadeEl = ts - doneAt;
        if (wrapperRef.current) {
          wrapperRef.current.style.opacity = `${Math.max(0, 1 - fadeEl / fadeMs)}`;
        }
        if (fadeEl >= fadeMs) {
          if (!doneCalledRef.current) {
            doneCalledRef.current = true;
            onDone?.();
          }
          return; // stop the loop
        }
      }

      rafRef.current = requestAnimationFrame(frame);
    }
    rafRef.current = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [onDone, holdMs, animMs, fadeMs]);

  return (
    <div
      ref={wrapperRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        pointerEvents: "none",
        transition: "opacity 0.1s linear",
        background: "#ffffff", // instant paint fallback — covers village before canvas is ready
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ width: "100%", height: "100%", display: "block", background: "#ffffff" }}
      />
    </div>
  );
}

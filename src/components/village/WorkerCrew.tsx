"use client";

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef, memo } from "react";

const WORKER_IMG = "/images/worker.png";
const COUNT = 5;
const STAGGER = 500;
const WALK_SPEED = 14;     // % per second
const APPEAR_MS = 400;
const DISAPPEAR_MS = 400;
const ROAD_Y = 68;         // Y level below all buildings — the "road"

export interface WorkerCrewHandle {
  startReturn: () => void;
}

interface Props {
  houseX: number;
  houseY: number;
  targetX: number;
  targetY: number;
  onArrive: () => void;
  onComplete: () => void;
}

type Phase = "hidden" | "appear" | "walk-to" | "waiting" | "walk-home" | "disappear" | "done";

// A point on the path
interface Pt { x: number; y: number }

interface W {
  phase: Phase;
  x: number;
  y: number;
  phaseStart: number;
  pathTo: Pt[];      // waypoints: house → road → target
  pathHome: Pt[];    // waypoints: target → road → house
  pathLen: number;   // total path length (for timing)
  homeLen: number;
}

function pathLength(pts: Pt[]): number {
  let len = 0;
  for (let i = 1; i < pts.length; i++) {
    len += Math.sqrt((pts[i].x - pts[i - 1].x) ** 2 + (pts[i].y - pts[i - 1].y) ** 2);
  }
  return len;
}

function posOnPath(pts: Pt[], t: number): Pt {
  if (t <= 0) return pts[0];
  if (t >= 1) return pts[pts.length - 1];
  const total = pathLength(pts);
  let target = total * t;
  for (let i = 1; i < pts.length; i++) {
    const segLen = Math.sqrt((pts[i].x - pts[i - 1].x) ** 2 + (pts[i].y - pts[i - 1].y) ** 2);
    if (target <= segLen) {
      const segT = target / segLen;
      return {
        x: pts[i - 1].x + (pts[i].x - pts[i - 1].x) * segT,
        y: pts[i - 1].y + (pts[i].y - pts[i - 1].y) * segT,
      };
    }
    target -= segLen;
  }
  return pts[pts.length - 1];
}

function dirOnPath(pts: Pt[], t: number): number {
  // Returns dx direction at point t (positive = going right)
  const a = posOnPath(pts, Math.max(0, t - 0.01));
  const b = posOnPath(pts, Math.min(1, t + 0.01));
  return b.x - a.x;
}

const WorkerCrewInner = forwardRef<WorkerCrewHandle, Props>(
  function WorkerCrew({ houseX, houseY, targetX, targetY, onArrive, onComplete }, ref) {
    const rafRef = useRef(0);
    const workersRef = useRef<W[]>([]);
    const [, setTick] = useState(0);
    const arrivedRef = useRef(false);
    const returnTriggeredRef = useRef(false);
    const completedRef = useRef(false);
    const initedRef = useRef(false);

    const onArriveRef = useRef(onArrive);
    onArriveRef.current = onArrive;
    const onCompleteRef = useRef(onComplete);
    onCompleteRef.current = onComplete;

    const offsets = [
      { dx: -2.5, dy: 1.5 }, { dx: -1.2, dy: 0.8 }, { dx: 0, dy: 0 },
      { dx: 1.2, dy: 0.8 }, { dx: 2.5, dy: 1.5 },
    ];

    useImperativeHandle(ref, () => ({
      startReturn: () => { returnTriggeredRef.current = true; },
    }));

    useEffect(() => {
      if (initedRef.current) return;
      initedRef.current = true;

      const now = performance.now();
      arrivedRef.current = false;
      returnTriggeredRef.current = false;
      completedRef.current = false;

      workersRef.current = Array.from({ length: COUNT }, (_, i) => {
        const tx = targetX + offsets[i].dx;
        const ty = targetY + offsets[i].dy;

        // Path: house → down to road → across to target X → up to target
        const pathTo: Pt[] = [
          { x: houseX, y: houseY },
        ];
        // If target is not directly below/above, go via the road
        if (Math.abs(tx - houseX) > 3 || ty < ROAD_Y) {
          pathTo.push({ x: houseX, y: ROAD_Y });  // down to road
          pathTo.push({ x: tx, y: ROAD_Y });       // across on road
        }
        pathTo.push({ x: tx, y: ty });              // up to target

        // Reverse path for going home
        const pathHome = [...pathTo].reverse();

        return {
          phase: "hidden" as Phase,
          x: houseX,
          y: houseY,
          phaseStart: now + i * STAGGER,
          pathTo,
          pathHome,
          pathLen: pathLength(pathTo),
          homeLen: pathLength(pathHome),
        };
      });

      function tick(time: number) {
        let anyActive = false;
        let arrivedCount = 0;
        let doneCount = 0;

        for (let i = 0; i < COUNT; i++) {
          const w = workersRef.current[i];
          const elapsed = time - w.phaseStart;

          if (w.phase === "hidden") {
            if (time >= w.phaseStart) { w.phase = "appear"; w.phaseStart = time; }
            anyActive = true;
          } else if (w.phase === "appear") {
            if (elapsed >= APPEAR_MS) { w.phase = "walk-to"; w.phaseStart = time; }
            anyActive = true;
          } else if (w.phase === "walk-to") {
            const totalMs = (w.pathLen / WALK_SPEED) * 1000;
            const t = Math.min(elapsed / totalMs, 1);
            const pos = posOnPath(w.pathTo, t);
            w.x = pos.x;
            w.y = pos.y;
            if (t >= 1) {
              w.phase = "waiting";
              const end = w.pathTo[w.pathTo.length - 1];
              w.x = end.x; w.y = end.y;
            }
            anyActive = true;
          } else if (w.phase === "waiting") {
            arrivedCount++;
            if (returnTriggeredRef.current) {
              w.phase = "walk-home";
              w.phaseStart = time + i * 300;
            }
            anyActive = true;
          } else if (w.phase === "walk-home") {
            if (time < w.phaseStart) { anyActive = true; continue; }
            const el = time - w.phaseStart;
            const totalMs = (w.homeLen / WALK_SPEED) * 1000;
            const t = Math.min(el / totalMs, 1);
            const pos = posOnPath(w.pathHome, t);
            w.x = pos.x; w.y = pos.y;
            if (t >= 1) {
              w.phase = "disappear"; w.phaseStart = time;
              w.x = houseX; w.y = houseY;
            }
            anyActive = true;
          } else if (w.phase === "disappear") {
            if (elapsed >= DISAPPEAR_MS) { w.phase = "done"; }
            anyActive = true;
          } else if (w.phase === "done") {
            doneCount++;
          }
        }

        if (arrivedCount >= COUNT && !arrivedRef.current) {
          arrivedRef.current = true;
          onArriveRef.current();
        }

        if (doneCount >= COUNT && !completedRef.current) {
          completedRef.current = true;
          onCompleteRef.current();
          return;
        }

        setTick(t => t + 1);
        if (anyActive || doneCount < COUNT) {
          rafRef.current = requestAnimationFrame(tick);
        }
      }

      rafRef.current = requestAnimationFrame(tick);
      return () => cancelAnimationFrame(rafRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const workers = workersRef.current;

    return (
      <>
        {workers.map((w, i) => {
          if (w.phase === "hidden" || w.phase === "done") return null;
          const elapsed = performance.now() - w.phaseStart;

          let opacity = 1, scale = 1;
          if (w.phase === "appear") {
            const t = Math.min(elapsed / APPEAR_MS, 1);
            opacity = t; scale = 0.3 + t * 0.7;
          } else if (w.phase === "disappear") {
            const t = Math.min(elapsed / DISAPPEAR_MS, 1);
            opacity = 1 - t; scale = 1 - t * 0.7;
          }

          const isWalking = w.phase === "walk-to" || w.phase === "walk-home";
          const bobY = isWalking ? Math.sin(elapsed * 0.012) * 2 : 0;
          const hammerRot = w.phase === "waiting" ? Math.sin(elapsed * 0.015 + i * 1.2) * 10 : 0;

          // Determine flip based on current walk direction
          let flip = false;
          if (w.phase === "walk-to") {
            const totalMs = (w.pathLen / WALK_SPEED) * 1000;
            const t = Math.min(elapsed / totalMs, 1);
            flip = dirOnPath(w.pathTo, t) < 0;
          } else if (w.phase === "walk-home" && elapsed >= 0) {
            const totalMs = (w.homeLen / WALK_SPEED) * 1000;
            const t = Math.min(elapsed / totalMs, 1);
            flip = dirOnPath(w.pathHome, t) < 0;
          }

          return (
            <div key={i} style={{
              position: "absolute", left: `${w.x}%`, top: `${w.y}%`,
              transform: `translate(-50%, -100%) scale(${scale}) translateY(${bobY}px) rotate(${hammerRot}deg)`,
              opacity, zIndex: 15, pointerEvents: "none" as const,
            }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={WORKER_IMG} alt="" draggable={false} style={{
                width: 24, height: 32, objectFit: "contain",
                transform: flip ? "scaleX(-1)" : "none",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
              }} />
              {w.phase === "waiting" && (
                <div style={{
                  position: "absolute", bottom: -2, left: "50%",
                  width: 6, height: 6, borderRadius: "50%",
                  background: "rgba(139,111,71,0.35)",
                  transform: `translateX(-50%) scale(${0.5 + Math.sin(elapsed * 0.01 + i) * 0.5})`,
                  opacity: 0.3 + Math.sin(elapsed * 0.008 + i) * 0.3,
                }} />
              )}
            </div>
          );
        })}
      </>
    );
  }
);

WorkerCrewInner.displayName = "WorkerCrew";
export default memo(WorkerCrewInner);

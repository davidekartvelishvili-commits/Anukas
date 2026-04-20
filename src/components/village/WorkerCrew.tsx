"use client";

import React, { useEffect, useState, memo } from "react";

// ============================================================================
// WORKER CREW — 5 tiny workers walk from house to build site and back
// Pure CSS animations, no animation library required
// ============================================================================

const WORKER_IMG = "/images/worker.png";
const WORKER_COUNT = 5;
const STAGGER_MS = 150;
const WALK_SPEED = 0.06; // percentage units per ms (~60px/s on 1000px screen)
const EXIT_DURATION = 200;
const ENTER_DURATION = 200;

// Small offsets so workers surround the target, not stack
const TARGET_OFFSETS = [
  { dx: -10, dy: -6 },
  { dx: 8, dy: -8 },
  { dx: -6, dy: 8 },
  { dx: 10, dy: 6 },
  { dx: 0, dy: -10 },
];

// Per-worker speed variation (±10%)
const SPEED_MULT = [1.0, 0.92, 1.08, 0.95, 1.05];

interface Props {
  houseX: number; // % position
  houseY: number; // % position
  targetX: number; // % position
  targetY: number; // % position
  taskDurationMs: number;
  onComplete: () => void;
}

type WorkerPhase = "idle" | "exiting" | "walking-to" | "building" | "walking-home" | "entering" | "done";

interface WorkerState {
  phase: WorkerPhase;
  x: number;
  y: number;
  flipX: boolean;
  buildPhaseOffset: number;
}

function WorkerCrewInner({ houseX, houseY, targetX, targetY, taskDurationMs, onComplete }: Props) {
  const [workers, setWorkers] = useState<WorkerState[]>(
    Array.from({ length: WORKER_COUNT }, () => ({
      phase: "idle" as WorkerPhase,
      x: houseX,
      y: houseY,
      flipX: false,
      buildPhaseOffset: Math.random() * 1000,
    }))
  );
  const [doneCount, setDoneCount] = useState(0);

  useEffect(() => {
    if (doneCount >= WORKER_COUNT) onComplete();
  }, [doneCount, onComplete]);

  // Start the sequence
  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    for (let i = 0; i < WORKER_COUNT; i++) {
      const offset = TARGET_OFFSETS[i];
      const tx = targetX + offset.dx * 0.3; // scale offsets to % units
      const ty = targetY + offset.dy * 0.3;
      const flipToTarget = tx < houseX;
      const flipToHome = houseX < tx;
      const speedMult = SPEED_MULT[i];

      const dist = Math.sqrt((tx - houseX) ** 2 + (ty - houseY) ** 2);
      const walkToMs = dist / (WALK_SPEED * speedMult);
      const walkHomeMs = walkToMs;

      const stagger = i * STAGGER_MS;

      // Phase 1: Exit house
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "exiting", x: houseX, y: houseY };
          return next;
        });
      }, stagger));

      // Phase 2: Walk to target
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "walking-to", x: tx, y: ty, flipX: flipToTarget };
          return next;
        });
      }, stagger + EXIT_DURATION));

      // Phase 3: Building
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "building" };
          return next;
        });
      }, stagger + EXIT_DURATION + walkToMs));

      // Phase 4: Walk home
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "walking-home", x: houseX, y: houseY, flipX: flipToHome };
          return next;
        });
      }, stagger + EXIT_DURATION + walkToMs + taskDurationMs));

      // Phase 5: Enter house
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "entering" };
          return next;
        });
      }, stagger + EXIT_DURATION + walkToMs + taskDurationMs + walkHomeMs));

      // Phase 6: Done
      timeouts.push(setTimeout(() => {
        setWorkers(prev => {
          const next = [...prev];
          next[i] = { ...next[i], phase: "done" };
          return next;
        });
        setDoneCount(c => c + 1);
      }, stagger + EXIT_DURATION + walkToMs + taskDurationMs + walkHomeMs + ENTER_DURATION));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [houseX, houseY, targetX, targetY, taskDurationMs]);

  return (
    <>
      <style>{css}</style>
      {workers.map((w, i) => {
        if (w.phase === "idle" || w.phase === "done") return null;

        const dist = Math.sqrt((w.x - houseX) ** 2 + (w.y - houseY) ** 2);
        const walkMs = w.phase === "walking-to" || w.phase === "walking-home"
          ? dist / (WALK_SPEED * SPEED_MULT[i])
          : 0;

        const style: React.CSSProperties = {
          position: "absolute",
          left: `${w.x}%`,
          top: `${w.y}%`,
          transform: "translate(-50%, -100%)",
          width: 24,
          height: 32,
          zIndex: 15,
          pointerEvents: "none" as const,
          transition: (w.phase === "walking-to" || w.phase === "walking-home")
            ? `left ${walkMs}ms linear, top ${walkMs}ms linear`
            : "none",
        };

        let className = "vcw-worker";
        if (w.phase === "exiting") className += " vcw-exit";
        if (w.phase === "entering") className += " vcw-enter";
        if (w.phase === "building") className += " vcw-building";
        if (w.phase === "walking-to" || w.phase === "walking-home") className += " vcw-walking";

        return (
          <div key={i} className={className} style={style}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WORKER_IMG}
              alt=""
              width={24}
              height={32}
              style={{
                objectFit: "contain",
                width: "100%",
                height: "100%",
                transform: w.flipX ? "scaleX(-1)" : "none",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
              }}
              draggable={false}
            />
            {/* Dust particles during building */}
            {w.phase === "building" && (
              <div className="vcw-dust" style={{ animationDelay: `${w.buildPhaseOffset}ms` }} />
            )}
          </div>
        );
      })}
    </>
  );
}

const css = `
.vcw-worker{will-change:transform,opacity,left,top}
.vcw-exit{animation:vcwAppear .2s ease-out forwards}
.vcw-enter{animation:vcwDisappear .2s ease-in forwards}
.vcw-walking{animation:vcwBob .4s ease-in-out infinite}
.vcw-building{animation:vcwHammer .5s ease-in-out infinite}
@keyframes vcwAppear{0%{opacity:0;transform:translate(-50%,-100%) scale(.3)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}
@keyframes vcwDisappear{0%{opacity:1;transform:translate(-50%,-100%) scale(1)}100%{opacity:0;transform:translate(-50%,-100%) scale(.3)}}
@keyframes vcwBob{0%,100%{transform:translate(-50%,-100%) translateY(0)}50%{transform:translate(-50%,-100%) translateY(-2px)}}
@keyframes vcwHammer{0%,100%{transform:translate(-50%,-100%) rotate(0deg)}25%{transform:translate(-50%,-100%) rotate(-12deg) translateY(-1px)}50%{transform:translate(-50%,-100%) rotate(8deg) translateY(1px)}75%{transform:translate(-50%,-100%) rotate(-5deg)}}
.vcw-dust{position:absolute;bottom:-2px;left:50%;width:8px;height:8px;border-radius:50%;background:rgba(139,111,71,.4);transform:translateX(-50%);animation:vcwDust .6s ease-out infinite}
@keyframes vcwDust{0%{opacity:.6;transform:translateX(-50%) scale(.5)}50%{opacity:.3;transform:translateX(-50%) scale(1.2) translateY(-4px)}100%{opacity:0;transform:translateX(-50%) scale(.8) translateY(-8px)}}
`;

export default memo(WorkerCrewInner);

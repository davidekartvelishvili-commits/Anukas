"use client";

import React, { useEffect, useState, memo } from "react";

// ============================================================================
// WORKER CREW — 5 tiny workers walk in a LINE from bottom to build site
// They walk single-file, build at the item, then walk back in line
// ============================================================================

const WORKER_IMG = "/images/worker.png";
const WORKER_COUNT = 5;
const STAGGER_MS = 400; // big stagger = clear single-file line
const WALK_DURATION = 2500; // 2.5s to walk to target (slow, visible)
const BUILD_DURATION = 2000; // 2s building at the item
const EXIT_MS = 300;
const ENTER_MS = 300;

interface Props {
  houseX: number;
  houseY: number;
  targetX: number;
  targetY: number;
  taskDurationMs: number;
  onComplete: () => void;
}

type Phase = "idle" | "exiting" | "walk-to" | "building" | "walk-home" | "entering" | "done";

function WorkerCrewInner({ houseX, houseY, targetX, targetY, taskDurationMs, onComplete }: Props) {
  const [phases, setPhases] = useState<Phase[]>(Array(WORKER_COUNT).fill("idle"));
  const [positions, setPositions] = useState(
    Array.from({ length: WORKER_COUNT }, () => ({ x: houseX, y: houseY }))
  );
  const [doneCount, setDoneCount] = useState(0);

  const flipX = targetX < houseX;
  const buildTime = taskDurationMs > 0 ? taskDurationMs : BUILD_DURATION;

  useEffect(() => {
    if (doneCount >= WORKER_COUNT) onComplete();
  }, [doneCount, onComplete]);

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Workers walk in a line to slightly offset positions around target
    const offsets = [
      { dx: -3, dy: 2 }, { dx: -1.5, dy: 1 }, { dx: 0, dy: 0 },
      { dx: 1.5, dy: 1 }, { dx: 3, dy: 2 },
    ];

    for (let i = 0; i < WORKER_COUNT; i++) {
      const stagger = i * STAGGER_MS;
      const tx = targetX + offsets[i].dx;
      const ty = targetY + offsets[i].dy;

      // Appear at house
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "exiting"; return n; });
      }, stagger));

      // Start walking to target
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "walk-to"; return n; });
        setPositions(p => { const n = [...p]; n[i] = { x: tx, y: ty }; return n; });
      }, stagger + EXIT_MS));

      // Arrive — start building
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "building"; return n; });
      }, stagger + EXIT_MS + WALK_DURATION));

      // Done building — walk home
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "walk-home"; return n; });
        setPositions(p => { const n = [...p]; n[i] = { x: houseX, y: houseY }; return n; });
      }, stagger + EXIT_MS + WALK_DURATION + buildTime));

      // Arrive home — enter
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "entering"; return n; });
      }, stagger + EXIT_MS + WALK_DURATION + buildTime + WALK_DURATION));

      // Done
      timeouts.push(setTimeout(() => {
        setPhases(p => { const n = [...p]; n[i] = "done"; return n; });
        setDoneCount(c => c + 1);
      }, stagger + EXIT_MS + WALK_DURATION + buildTime + WALK_DURATION + ENTER_MS));
    }

    return () => timeouts.forEach(clearTimeout);
  }, [houseX, houseY, targetX, targetY, buildTime]);

  return (
    <>
      <style>{css}</style>
      {phases.map((phase, i) => {
        if (phase === "idle" || phase === "done") return null;

        const pos = positions[i];
        const isWalking = phase === "walk-to" || phase === "walk-home";
        const goingLeft = phase === "walk-to" ? flipX : !flipX;

        return (
          <div
            key={i}
            className={`vcw-w ${phase === "exiting" ? "vcw-appear" : ""} ${phase === "entering" ? "vcw-disappear" : ""} ${isWalking ? "vcw-bob" : ""} ${phase === "building" ? "vcw-hammer" : ""}`}
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transition: isWalking ? `left ${WALK_DURATION}ms linear, top ${WALK_DURATION}ms linear` : "none",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={WORKER_IMG} alt="" draggable={false}
              style={{
                width: 24, height: 32, objectFit: "contain",
                transform: goingLeft ? "scaleX(-1)" : "none",
                filter: "drop-shadow(0 2px 3px rgba(0,0,0,0.4))",
              }}
            />
            {phase === "building" && (
              <div className="vcw-dust" style={{ animationDelay: `${i * 200}ms` }} />
            )}
          </div>
        );
      })}
    </>
  );
}

const css = `
.vcw-w{position:absolute;transform:translate(-50%,-100%);z-index:15;pointer-events:none;will-change:left,top,transform,opacity}
.vcw-appear{animation:vcwIn .3s ease-out forwards}
.vcw-disappear{animation:vcwOut .3s ease-in forwards}
.vcw-bob{animation:vcwBob .35s ease-in-out infinite}
.vcw-hammer{animation:vcwHammer .45s ease-in-out infinite}
@keyframes vcwIn{0%{opacity:0;transform:translate(-50%,-100%) scale(.2)}100%{opacity:1;transform:translate(-50%,-100%) scale(1)}}
@keyframes vcwOut{0%{opacity:1;transform:translate(-50%,-100%) scale(1)}100%{opacity:0;transform:translate(-50%,-100%) scale(.2)}}
@keyframes vcwBob{0%,100%{transform:translate(-50%,-100%) translateY(0)}50%{transform:translate(-50%,-100%) translateY(-2px)}}
@keyframes vcwHammer{0%,100%{transform:translate(-50%,-100%) rotate(0)}30%{transform:translate(-50%,-100%) rotate(-10deg) translateY(-1px)}60%{transform:translate(-50%,-100%) rotate(6deg) translateY(1px)}}
.vcw-dust{position:absolute;bottom:-2px;left:50%;width:6px;height:6px;border-radius:50%;background:rgba(139,111,71,.35);transform:translateX(-50%);animation:vcwDust .5s ease-out infinite}
@keyframes vcwDust{0%{opacity:.5;transform:translateX(-50%) scale(.4)}60%{opacity:.2;transform:translateX(-50%) scale(1) translateY(-3px)}100%{opacity:0;transform:translateX(-50%) scale(.6) translateY(-6px)}}
`;

export default memo(WorkerCrewInner);

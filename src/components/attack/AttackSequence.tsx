"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { apiFetch } from "@/services/api";
import type {
  AttackSequenceState,
  AttackInitResponse,
  AttackAttemptResponse,
  AttackAttemptSummary,
  VillageItem,
} from "@/shared/types/attack";
import AttackClouds from "./AttackClouds";
import EnemyVillageView from "./EnemyVillageView";
import AttackImpact from "./AttackImpact";
import AttackResultModal from "./AttackResultModal";

interface Props {
  onComplete: () => void;
}

export default function AttackSequence({ onComplete }: Props) {
  const [state, setState] = useState<AttackSequenceState>("CLOUDS_CLOSING");
  const stateRef = useRef<AttackSequenceState>("CLOUDS_CLOSING");
  const [sessionId, setSessionId] = useState("");
  const [defenderUsername, setDefenderUsername] = useState("");
  const [defenderLevel, setDefenderLevel] = useState(1);
  const [shieldActive, setShieldActive] = useState(false);
  const [villageItems, setVillageItems] = useState<VillageItem[]>([]);
  const [attackNumber, setAttackNumber] = useState(1);
  const [pickedPositions, setPickedPositions] = useState<number[]>([]);
  const [selectedPosition, setSelectedPosition] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<AttackAttemptSummary[]>([]);
  const [totalCoinsStolen, setTotalCoinsStolen] = useState(0);
  const [totalItemsBurned, setTotalItemsBurned] = useState(0);
  const [currentImpact, setCurrentImpact] = useState<AttackAttemptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Keep stateRef in sync
  const setStateTracked = useCallback((newState: AttackSequenceState) => {
    console.log(`[attack-state] ${stateRef.current} → ${newState}`);
    stateRef.current = newState;
    setState(newState);
  }, []);

  // Clouds transition end — use ref to read current state
  const handleCloudsTransitionEnd = useCallback(() => {
    const s = stateRef.current;
    console.log(`[attack-state] clouds transition end, current=${s}`);
    if (s === "CLOUDS_CLOSING") {
      setStateTracked("TRAVELING");
    } else if (s === "RETURNING") {
      onComplete();
    }
  }, [onComplete, setStateTracked]);

  // Fetch attack session when traveling
  useEffect(() => {
    if (state !== "TRAVELING") return;
    let cancelled = false;

    apiFetch<AttackInitResponse>("/attacks/initialize", {
      method: "POST",
      body: JSON.stringify({}),
    }).then((data: any) => {
      if (cancelled) return;
      console.log(`[attack-state] initialize response: items=${data?.villageItems?.length}, session=${data?.attackSessionId}`);
      if (!data?.success || !data?.attackSessionId) {
        setError(data?.message || "No valid targets found");
        setTimeout(() => { if (!cancelled) setStateTracked("RETURNING"); }, 2000);
        return;
      }
      setSessionId(data.attackSessionId);
      setDefenderUsername(data.defenderUsername);
      setDefenderLevel(data.defenderVillageLevel);
      setShieldActive(data.defenderShieldActive);
      setVillageItems(data.villageItems);
      setTimeout(() => {
        if (!cancelled) setStateTracked("CLOUDS_OPENING");
      }, 800);
    }).catch((err: any) => {
      if (!cancelled) {
        console.error("[attack-state] initialize error:", err?.message);
        setError(err?.message || "Attack failed");
        setTimeout(() => { if (!cancelled) setStateTracked("RETURNING"); }, 2000);
      }
    });

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Clouds opened → show village after delay
  useEffect(() => {
    if (state === "CLOUDS_OPENING") {
      const t = setTimeout(() => setStateTracked("ATTACK_SELECT"), 700);
      return () => clearTimeout(t);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const handleSelectItem = useCallback((position: number) => {
    setSelectedPosition(position);
  }, []);

  const handleConfirmAttack = useCallback(async () => {
    if (selectedPosition === null || !sessionId) return;
    setStateTracked("ATTACK_IMPACT");

    try {
      const result = await apiFetch<AttackAttemptResponse>("/attacks/attempt", {
        method: "POST",
        body: JSON.stringify({ attackSessionId: sessionId, pickedPosition: selectedPosition }),
      });

      console.log(`[attack-state] attempt result: outcome=${result.outcome}, coins=${result.coinsTransferred}`);
      setCurrentImpact(result);
      if (result.shieldConsumed) setShieldActive(false);

      setAttempts(prev => [...prev, {
        attemptNumber: attackNumber,
        pickedPosition: selectedPosition,
        outcome: result.outcome,
        coinsTransferred: result.coinsTransferred,
        shieldConsumed: result.shieldConsumed,
        itemBurned: result.itemBurned,
      }]);

      if (result.coinsTransferred > 0) setTotalCoinsStolen(prev => prev + result.coinsTransferred);
      if (result.itemBurned) setTotalItemsBurned(prev => prev + 1);
      setPickedPositions(prev => [...prev, selectedPosition]);
    } catch {
      setStateTracked("SUMMARY");
    }
  }, [selectedPosition, sessionId, attackNumber, setStateTracked]);

  const handleImpactDone = useCallback(() => {
    setCurrentImpact(null);
    setSelectedPosition(null);
    if (attackNumber >= 2) {
      setStateTracked("SUMMARY");
    } else {
      setAttackNumber(2);
      setStateTracked("ATTACK_SELECT");
    }
  }, [attackNumber, setStateTracked]);

  const handleSummaryClose = useCallback(() => {
    setStateTracked("RETURNING");
  }, [setStateTracked]);

  // Cloud state
  const showClouds = state === "CLOUDS_CLOSING" || state === "TRAVELING" || state === "CLOUDS_OPENING" || state === "RETURNING";
  let cloudState: "closing" | "open" | "opening" = "open";
  if (state === "CLOUDS_CLOSING" || state === "TRAVELING") cloudState = "closing";
  else if (state === "CLOUDS_OPENING") cloudState = "opening";
  else if (state === "RETURNING") cloudState = "closing";

  return (
    <div className="fixed inset-0 z-[190]" style={{ overflow: "hidden" }}>
      {/* Clouds — always render during transitions */}
      {showClouds && (
        <AttackClouds state={cloudState} onTransitionEnd={handleCloudsTransitionEnd} />
      )}

      {/* Traveling text */}
      {state === "TRAVELING" && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center" style={{ background: "rgba(10,10,20,0.95)" }}>
          <div className="text-center">
            <div className="text-[20px] font-bold text-white animate-pulse" style={{ fontFamily: "var(--font-outfit)" }}>
              Finding target...
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && state === "RETURNING" && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center" style={{ background: "rgba(10,10,20,0.95)" }}>
          <div className="text-[16px] font-bold text-white/60" style={{ fontFamily: "var(--font-outfit)" }}>{error}</div>
        </div>
      )}

      {/* Enemy village */}
      {(state === "ATTACK_SELECT" || state === "ATTACK_IMPACT") && (
        <EnemyVillageView
          defenderUsername={defenderUsername}
          defenderLevel={defenderLevel}
          shieldActive={shieldActive}
          villageItems={villageItems}
          attackNumber={attackNumber}
          pickedPositions={pickedPositions}
          onSelectItem={handleSelectItem}
          selectedPosition={selectedPosition}
          onConfirmAttack={handleConfirmAttack}
        />
      )}

      {/* Impact */}
      {state === "ATTACK_IMPACT" && currentImpact && (
        <AttackImpact
          outcome={currentImpact.outcome}
          coinsTransferred={currentImpact.coinsTransferred}
          onDone={handleImpactDone}
        />
      )}

      {/* Summary */}
      {state === "SUMMARY" && (
        <AttackResultModal
          attempts={attempts}
          totalCoinsStolen={totalCoinsStolen}
          totalItemsBurned={totalItemsBurned}
          onClose={handleSummaryClose}
        />
      )}
    </div>
  );
}

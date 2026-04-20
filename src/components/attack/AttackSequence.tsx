"use client";

import React, { useState, useCallback, useEffect } from "react";
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

  // Phase: CLOUDS_CLOSING → TRAVELING (fetch) → CLOUDS_OPENING → ATTACK_SELECT
  const handleCloudsTransitionEnd = useCallback(() => {
    if (state === "CLOUDS_CLOSING") {
      setState("TRAVELING");
    } else if (state === "RETURNING") {
      onComplete();
    }
  }, [state, onComplete]);

  // Fetch attack session when traveling
  useEffect(() => {
    if (state !== "TRAVELING") return;
    let cancelled = false;

    apiFetch<AttackInitResponse>("/attacks/initialize", {
      method: "POST",
      body: JSON.stringify({}),
    }).then((data) => {
      if (cancelled) return;
      if (!data.success) {
        setError("No valid targets found");
        setState("RETURNING");
        return;
      }
      setSessionId(data.attackSessionId);
      setDefenderUsername(data.defenderUsername);
      setDefenderLevel(data.defenderVillageLevel);
      setShieldActive(data.defenderShieldActive);
      setVillageItems(data.villageItems);
      // Brief pause then open clouds
      setTimeout(() => {
        if (!cancelled) setState("CLOUDS_OPENING");
      }, 800);
    }).catch(() => {
      if (!cancelled) {
        setError("Attack failed — no target found");
        setState("RETURNING");
      }
    });

    return () => { cancelled = true; };
  }, [state]);

  // Clouds opened → show enemy village
  useEffect(() => {
    if (state === "CLOUDS_OPENING") {
      const t = setTimeout(() => setState("ATTACK_SELECT"), 700);
      return () => clearTimeout(t);
    }
  }, [state]);

  const handleSelectItem = useCallback((position: number) => {
    setSelectedPosition(position);
  }, []);

  const handleConfirmAttack = useCallback(async () => {
    if (selectedPosition === null || !sessionId) return;
    setState("ATTACK_IMPACT");

    try {
      const result = await apiFetch<AttackAttemptResponse>("/attacks/attempt", {
        method: "POST",
        body: JSON.stringify({ attackSessionId: sessionId, pickedPosition: selectedPosition }),
      });

      setCurrentImpact(result);

      // Update shield state if consumed
      if (result.shieldConsumed) setShieldActive(false);

      // Track attempt
      setAttempts(prev => [...prev, {
        attemptNumber: attackNumber,
        pickedPosition: selectedPosition,
        outcome: result.outcome,
        coinsTransferred: result.coinsTransferred,
        shieldConsumed: result.shieldConsumed,
        itemBurned: result.itemBurned,
      }]);

      if (result.coinsTransferred > 0) {
        setTotalCoinsStolen(prev => prev + result.coinsTransferred);
      }
      if (result.itemBurned) {
        setTotalItemsBurned(prev => prev + 1);
      }

      setPickedPositions(prev => [...prev, selectedPosition]);
    } catch {
      // On error, skip to summary
      setState("SUMMARY");
    }
  }, [selectedPosition, sessionId, attackNumber]);

  const handleImpactDone = useCallback(() => {
    setCurrentImpact(null);
    setSelectedPosition(null);

    if (attackNumber >= 2) {
      setState("SUMMARY");
    } else {
      setAttackNumber(2);
      setState("ATTACK_SELECT");
    }
  }, [attackNumber]);

  const handleSummaryClose = useCallback(() => {
    setState("RETURNING");
  }, []);

  // Determine cloud state
  let cloudState: "closing" | "open" | "opening" = "open";
  if (state === "CLOUDS_CLOSING" || state === "TRAVELING") cloudState = "closing";
  else if (state === "CLOUDS_OPENING") cloudState = "opening";
  else if (state === "RETURNING") cloudState = "closing";

  return (
    <div className="fixed inset-0 z-[190]">
      {/* Clouds */}
      {(state === "CLOUDS_CLOSING" || state === "TRAVELING" || state === "CLOUDS_OPENING" || state === "RETURNING") && (
        <AttackClouds state={cloudState} onTransitionEnd={handleCloudsTransitionEnd} />
      )}

      {/* Traveling text */}
      {state === "TRAVELING" && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center">
          <div className="text-center">
            <div className="text-[20px] font-bold text-white animate-pulse" style={{ fontFamily: "var(--font-outfit)" }}>
              Finding target...
            </div>
            <div className="text-[12px] text-white/40 mt-2" style={{ fontFamily: "var(--font-dm-sans)" }}>
              სამიზნის ძებნა...
            </div>
          </div>
        </div>
      )}

      {/* Error fallback */}
      {error && state === "RETURNING" && (
        <div className="fixed inset-0 z-[310] flex items-center justify-center">
          <div className="text-center px-6">
            <div className="text-[16px] font-bold text-white/60" style={{ fontFamily: "var(--font-outfit)" }}>
              {error}
            </div>
          </div>
        </div>
      )}

      {/* Enemy village view */}
      {state === "ATTACK_SELECT" && (
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

      {/* Impact animation */}
      {state === "ATTACK_IMPACT" && currentImpact && (
        <AttackImpact
          outcome={currentImpact.outcome}
          coinsTransferred={currentImpact.coinsTransferred}
          onDone={handleImpactDone}
        />
      )}

      {/* Summary modal */}
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

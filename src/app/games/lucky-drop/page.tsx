"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MULTIPLIERS, SLOT_COLORS, BET_COST, type RiskLevel, type DropResult } from "./drop-config";
import { playGame, ensureActiveTransaction } from "@/services/games";
import { setCoinBalance as storeCoin, setCashBalance as storeCash } from "@/services/balance";
import WinAnimation from "@/components/WinAnimation";
import ShieldJackpotReveal from "@/components/ShieldJackpotReveal";
import AttackCardReveal from "@/components/AttackCardReveal";
import AttackSequence from "@/components/attack/AttackSequence";

const ROWS = 12;

interface Peg { x: number; y: number; r: number; glow: number }
interface Slot { x: number; y: number; w: number; h: number; mult: number; color: string; glow: number; sprite?: HTMLCanvasElement }
interface TrailPoint { x: number; y: number; a: number }

// Physics-based ball that tracks a path (path guarantees the predetermined slot)
interface Ball {
  x: number; y: number;
  vx: number; vy: number;
  segIdx: number;
  r: number; alive: boolean; settled: boolean;
  trail: TrailPoint[];
  targetSlot: number;
  data: DropResult;
  rotation: number;
  spin: number;
  squash: number;
  trailCounter: number;
  // True until the API responds with the verdict. While awaiting, the
  // ball free-falls under pure physics (gravity + peg bounces) with no
  // target attractor, and is capped above the lock zone so it never
  // commits to a slot before the server has decided.
  awaiting: boolean;
  path: { x: number; y: number }[];
}

// Generate a natural path from top to target slot
function generateBallPath(
  startX: number, startY: number,
  targetSlotIdx: number, pegs: Peg[], slots: Slot[],
  gapX: number, gapY: number, rows: number
): { x: number; y: number }[] {
  const path: { x: number; y: number }[] = [];
  path.push({ x: startX, y: startY - 30 });

  // Build peg grid: for each row, get the peg positions
  const pegRows: { x: number; y: number }[][] = [];
  let pegIdx = 0;
  for (let row = 0; row < rows; row++) {
    const count = row + 3;
    pegRows.push(pegs.slice(pegIdx, pegIdx + count));
    pegIdx += count;
  }

  // Calculate target X from target slot
  const targetSlot = slots[targetSlotIdx];
  const targetX = targetSlot ? targetSlot.x + targetSlot.w / 2 : startX;

  // Work backwards: determine which column we need at each row to reach target
  // At row N, there are N+3 pegs. The ball falls between pegs.
  // Between peg i and peg i+1, the ball can go left (toward i) or right (toward i+1)

  // Forward approach: start at center, bias toward target
  let currentX = startX;

  for (let row = 0; row < rows; row++) {
    const rowPegs = pegRows[row];
    if (!rowPegs || rowPegs.length === 0) continue;

    // Find closest peg in this row
    let closestPeg = rowPegs[0];
    let closestDist = Infinity;
    for (const p of rowPegs) {
      const d = Math.abs(p.x - currentX);
      if (d < closestDist) { closestDist = d; closestPeg = p; }
    }

    // Decide: go left or right of this peg, biased toward target
    const biasToTarget = (targetX - currentX) * 0.15;
    const randomOffset = (Math.random() - 0.5) * gapX * 0.4;
    const goRight = (biasToTarget + randomOffset) > 0;

    const offsetX = (goRight ? 1 : -1) * gapX * (0.3 + Math.random() * 0.2);
    currentX = closestPeg.x + offsetX;

    // Add slight wobble point above the peg (ball approaching)
    const wobbleX = currentX + (Math.random() - 0.5) * gapX * 0.1;
    path.push({ x: wobbleX, y: closestPeg.y - gapY * 0.15 });

    // Add the bounce point (at peg level)
    path.push({ x: currentX, y: closestPeg.y + gapY * 0.3 });
  }

  // Final: land in the target slot
  path.push({ x: targetX, y: targetSlot ? targetSlot.y + targetSlot.h * 0.3 : startY + rows * gapY });

  return path;
}

export default function LuckyDropPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    balls: [] as Ball[],
    pegs: [] as Peg[],
    slots: [] as Slot[],
    W: 0, H: 0,
    gapX: 0, gapY: 0, startY: 0, slotH: 0, pegR: 0,
    leftWall: [] as { x1: number; y1: number; x2: number; y2: number }[],
    rightWall: [] as { x1: number; y1: number; x2: number; y2: number }[],
  });

  const [balance, setBalance] = useState(0);
  const risk: RiskLevel = "low";
  const [result, setResult] = useState<{ text: string; isJP: boolean } | null>(null);
  const [showWin, setShowWin] = useState(false);
  const [winAmount, setWinAmount] = useState(0);
  const [betAmount, setBetAmount] = useState(0);
  const [showBetPicker, setShowBetPicker] = useState(true);
  const pendingBallsRef = useRef(0);
  const lastServerCoinsRef = useRef(-1);

  // Peg-hit SFX — programmatic WebAudio pop, no file I/O. A tiny pre-
  // synthesized AudioBuffer (60ms, 8kHz, single sine with exponential
  // decay) is created once and replayed via BufferSource on each hit.
  // Zero decoding overhead on every play — the original 33KB MP3 was
  // causing mobile stutter even when the file itself was tiny because
  // every Audio.play() call invoked the audio engine's decode pipeline.
  const audioContextRef = useRef<AudioContext | null>(null);
  const clickBufferRef = useRef<AudioBuffer | null>(null);
  const lastPegSoundRef = useRef(0);
  const pegSfxMuted = useRef(false); // silenced while win audio is playing

  // Win audio: main music (loud) + coin sound (quieter) that fire in
  // parallel when a win animation starts. Pop SFX is silenced during.
  const winMusicRef = useRef<HTMLAudioElement | null>(null);
  const winCoinRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const music = new Audio("/audio/win-music.mp3");
    music.preload = "auto";
    music.volume = 0.85;
    const coin = new Audio("/audio/win-coin.mp3");
    coin.preload = "auto";
    coin.volume = 0.35; // quieter than the music
    winMusicRef.current = music;
    winCoinRef.current = coin;
    return () => {
      music.pause(); music.src = "";
      coin.pause(); coin.src = "";
      winMusicRef.current = null;
      winCoinRef.current = null;
    };
  }, []);
  const playWinAudio = () => {
    pegSfxMuted.current = true;
    const m = winMusicRef.current;
    const c = winCoinRef.current;
    if (m) { try { m.currentTime = 0; m.play().catch(() => {}); } catch {} }
    if (c) { try { c.currentTime = 0; c.play().catch(() => {}); } catch {} }
  };
  const stopWinAudio = () => {
    const m = winMusicRef.current;
    const c = winCoinRef.current;
    if (m) { try { m.pause(); m.currentTime = 0; } catch {} }
    if (c) { try { c.pause(); c.currentTime = 0; } catch {} }
    pegSfxMuted.current = false;
  };
  useEffect(() => {
    // One-time: create a single AudioContext + pre-synthesize a 60ms
    // pop into an AudioBuffer. This is the entire audio pipeline —
    // every hit replays this in-memory buffer, zero file I/O, zero
    // decoder invocation.
    if (typeof window === "undefined") return;
    const AC = (window.AudioContext || (window as any).webkitAudioContext);
    if (!AC) return;
    const ac = new AC();
    audioContextRef.current = ac;

    const sampleRate = 8000;
    const duration = 0.06; // 60ms
    const samples = Math.floor(sampleRate * duration);
    const buffer = ac.createBuffer(1, samples, sampleRate);
    const channelData = buffer.getChannelData(0);
    for (let i = 0; i < samples; i++) {
      const t = i / samples;
      const envelope = Math.exp(-t * 12);           // quick decay
      const freq = 900 + (1 - t) * 300;              // downward sweep
      channelData[i] = envelope * Math.sin(2 * Math.PI * freq * t) * 0.2;
    }
    clickBufferRef.current = buffer;

    return () => {
      try { ac.close(); } catch {}
      audioContextRef.current = null;
      clickBufferRef.current = null;
    };
  }, []);

  const playPegSfx = useCallback(() => {
    if (pegSfxMuted.current) return;
    const ac = audioContextRef.current;
    const buf = clickBufferRef.current;
    if (!ac || !buf) return;
    const now = performance.now();
    if (now - lastPegSoundRef.current < 80) return; // max ~12 pops/sec
    // Resume context lazily on first play (iOS requires a user gesture
    // to unlock, which the Drop button tap already provides)
    if (ac.state === "suspended") { try { ac.resume(); } catch {} }
    const source = ac.createBufferSource();
    const gainNode = ac.createGain();
    source.buffer = buf;
    gainNode.gain.value = 0.15;
    source.connect(gainNode);
    gainNode.connect(ac.destination);
    source.start(0);
    lastPegSoundRef.current = now;
  }, []);

  useEffect(() => {
    // Fetch coin balance from server (sum of ALL active transactions — matches home page)
    import("@/services/auth").then(({ getMe }) => {
      getMe().then((data: any) => {
        if (data?.user?.coinBalance !== undefined) {
          setBalance(data.user.coinBalance);
          storeCoin(data.user.coinBalance);
        }
      }).catch(() => {});
    });
    // Also ensure active transaction exists
    ensureActiveTransaction().catch(() => {});
    // Fetch village profile for attack cards + shield count
    import("@/services/api").then(({ apiFetch }) => {
      apiFetch("/village/profile").then((data: any) => {
        if (data?.success) {
          setVillageActive(!!data.villageActive);
          setAttackCards(data.profile.attackCharges ?? data.profile.cardCount ?? 0);
          setShieldCount(data.profile.shieldCount ?? (data.profile.shieldActive ? 1 : 0));
        }
      }).catch(() => {});
    });
  }, []);
  // bigWinText: imperative DOM update via ref instead of useState, so
  // transient error text doesn't re-render the whole LuckyDropPage tree
  // while balls are mid-flight.
  const bigWinRef = useRef<HTMLDivElement>(null);
  const setBigWinText = (t: string) => {
    const el = bigWinRef.current;
    if (el) el.textContent = t || "";
  };
  const [showWinAnim, setShowWinAnim] = useState(false);
  const showWinAnimRef = useRef(false);
  useEffect(() => { showWinAnimRef.current = showWinAnim; }, [showWinAnim]);
  const [winAnimAmount, setWinAnimAmount] = useState(0);
  const [bonusRoundInfo, setBonusRoundInfo] = useState<{ coins: number; gamesLeft: number } | null>(null);
  const [showShieldAnim, setShowShieldAnim] = useState(false);
  const [showCardAnim, setShowCardAnim] = useState(false);
  const animQueueRef = useRef<("shield" | "card")[]>([]);
  const animPlayingRef = useRef(false);
  const [attackCards, setAttackCards] = useState(0);
  const [shieldCount, setShieldCount] = useState(0);
  const [villageActive, setVillageActive] = useState(false);
  const [showAttackSequence, setShowAttackSequence] = useState(false);
  const attackTriggeredRef = useRef(false);
  const anyAnimPlayingRef = useRef(false); // blocks ball drops during ANY animation
  const dropCount = useRef(0);

  // Sync anyAnimPlayingRef whenever any animation state changes.
  // Also respect animPlayingRef which stays true during the gap
  // between queued animations (e.g. 3s delay between shield/card).
  useEffect(() => {
    anyAnimPlayingRef.current = showWinAnim || showShieldAnim || showCardAnim || showAttackSequence || animPlayingRef.current;
  }, [showWinAnim, showShieldAnim, showCardAnim, showAttackSequence]);

  // Auto-trigger attack when charges reach 3 — wait for all animations to finish
  useEffect(() => {
    if (attackCards >= 3 && !showAttackSequence && !attackTriggeredRef.current
        && !showWinAnim && !showShieldAnim && !showCardAnim) {
      const t = setTimeout(() => {
        if (!attackTriggeredRef.current && !anyAnimPlayingRef.current) {
          attackTriggeredRef.current = true;
          setShowAttackSequence(true);
        }
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [attackCards, showAttackSequence, showWinAnim, showShieldAnim, showCardAnim]);

  const animDelayTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const playNextAnim = useCallback(() => {
    if (animQueueRef.current.length === 0) {
      animPlayingRef.current = false;
      // Let the useEffect sync anyAnimPlayingRef from show-states
      return;
    }
    // 3 second gap between animations — keep the blocking ref locked
    // so no new ball drops (and their win animations) can sneak in
    // during the gap between queued animations.
    animPlayingRef.current = true;
    anyAnimPlayingRef.current = true;
    if (animDelayTimer.current) clearTimeout(animDelayTimer.current);
    animDelayTimer.current = setTimeout(() => {
      animDelayTimer.current = null;
      const next = animQueueRef.current.shift();
      if (!next) { animPlayingRef.current = false; anyAnimPlayingRef.current = false; return; }
      if (next === "shield") setShowShieldAnim(true);
      else setShowCardAnim(true);
    }, 3000);
  }, []);

  const queueAnim = useCallback((type: "shield" | "card") => {
    animQueueRef.current.push(type);
    // Only start if nothing is playing at all
    if (!animPlayingRef.current && !anyAnimPlayingRef.current) {
      animPlayingRef.current = true;
      const next = animQueueRef.current.shift()!;
      if (next === "shield") setShowShieldAnim(true);
      else setShowCardAnim(true);
    }
  }, []);

  // Canvas-rendered confetti particles. Replaces the old DOM-div-per-particle
  // approach which was creating 20-50 <div>s per win, each running a 4s CSS
  // transform animation — severe jank on mobile.
  type CanvasParticle = {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number;
    color: string; size: number;
    g?: number; fr?: number; glow?: boolean;
  };
  const particlesRef = useRef<CanvasParticle[]>([]);
  // Screen shake on landing — intensity decays linearly until `until`
  const shakeRef = useRef({ intensity: 0, until: 0 });
  const BET_OPTIONS = [10, 25, 50, 100, 250, 500];

  const riskRef = useRef(risk);

  const calcLayout = useCallback(() => {
    const W = document.documentElement.clientWidth;
    const H = document.documentElement.clientHeight;
    const scale = Math.min(W / 430, 1); // Scale relative to iPhone size
    const pegR = Math.max(3, W * 0.008);
    const cols = ROWS + 2;
    const sidePad = Math.max(20, W * 0.05);
    const gapX = (W - sidePad * 2) / cols;
    const gapY = (H * 0.40) / ROWS;
    const startY = H * 0.20;
    const slotH = H * 0.06;

    const pegs: Peg[] = [];
    const rowEdges: { left: number; right: number; y: number }[] = [];

    for (let row = 0; row < ROWS; row++) {
      const c = row + 3;
      const totalW = (c - 1) * gapX;
      const sx = (W - totalW) / 2;
      for (let col = 0; col < c; col++) {
        pegs.push({ x: sx + col * gapX, y: startY + row * gapY, r: pegR, glow: 0 });
      }
      rowEdges.push({ left: sx, right: sx + totalW, y: startY + row * gapY });
    }

    // Build angled walls from peg edges
    const leftWall: { x1: number; y1: number; x2: number; y2: number }[] = [];
    const rightWall: { x1: number; y1: number; x2: number; y2: number }[] = [];
    for (let i = 0; i < rowEdges.length - 1; i++) {
      leftWall.push({ x1: rowEdges[i].left, y1: rowEdges[i].y, x2: rowEdges[i + 1].left, y2: rowEdges[i + 1].y });
      rightWall.push({ x1: rowEdges[i].right, y1: rowEdges[i].y, x2: rowEdges[i + 1].right, y2: rowEdges[i + 1].y });
    }

    const mults = MULTIPLIERS[riskRef.current];
    const count = mults.length;
    const totalW2 = cols * gapX;
    const sx2 = sidePad;
    const slotW = totalW2 / count;
    const sy = startY + ROWS * gapY + gapY * 0.6;
    const colors = SLOT_COLORS[riskRef.current];

    const slots: Slot[] = mults.map((m, i) => ({
      x: sx2 + i * slotW, y: sy, w: slotW, h: slotH,
      mult: m, color: colors[i], glow: 0,
    }));

    // Bake each slot as a static sprite once. Per-frame rendering then
    // becomes a single drawImage — no text, no multiple fillRects, no
    // font-metric lookups. The glow overlay is applied on top at runtime.
    for (const sl of slots) {
      const sw = Math.max(1, Math.round(sl.w));
      const sh = Math.max(1, Math.round(sl.h));
      const sp = document.createElement("canvas");
      sp.width = sw;
      sp.height = sh;
      const sctx = sp.getContext("2d")!;
      const isWin = sl.mult > 0;
      // Serious neon palette — emerald for win, ember crimson for lose
      const baseColor = isWin ? "#10D389" : "#E5354A";
      const tipColor = isWin ? "#A6FFE0" : "#FFB4BD";
      const darkColor = isWin ? "#07291E" : "#3A0B14";
      const r = Math.min(8, sh * 0.30);
      // Rounded LED bar
      const x0 = 1.5, y0 = 1.5;
      const w = sw - 3, h = sh - 3;
      sctx.beginPath();
      sctx.moveTo(x0 + r, y0);
      sctx.lineTo(x0 + w - r, y0);
      sctx.arcTo(x0 + w, y0, x0 + w, y0 + r, r);
      sctx.lineTo(x0 + w, y0 + h - r);
      sctx.arcTo(x0 + w, y0 + h, x0 + w - r, y0 + h, r);
      sctx.lineTo(x0 + r, y0 + h);
      sctx.arcTo(x0, y0 + h, x0, y0 + h - r, r);
      sctx.lineTo(x0, y0 + r);
      sctx.arcTo(x0, y0, x0 + r, y0, r);
      sctx.closePath();
      const g = sctx.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, tipColor);
      g.addColorStop(0.45, baseColor);
      g.addColorStop(1, darkColor);
      sctx.fillStyle = g;
      sctx.fill();
      // Top sheen
      sctx.fillStyle = "rgba(255,255,255,0.40)";
      sctx.fillRect(x0 + r, y0 + 1.5, w - r * 2, Math.max(1, h * 0.10));
      // Glowing rim — shadowBlur paid ONCE at bake time, not per frame
      sctx.shadowBlur = 10;
      sctx.shadowColor = baseColor;
      sctx.strokeStyle = baseColor;
      sctx.lineWidth = 1.5;
      sctx.stroke();
      sctx.shadowBlur = 0;
      // LED label — binary WIN / LOSE in uppercase for a more refined read
      const label = isWin ? "WIN" : "LOSE";
      const fontSize = Math.min(sw * 0.36, 15);
      sctx.font = `800 ${fontSize}px sans-serif`;
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.shadowBlur = 6;
      sctx.shadowColor = tipColor;
      sctx.fillStyle = "#FFFFFF";
      sctx.fillText(label, sw / 2, sh / 2 + 1);
      sctx.shadowBlur = 0;
      sl.sprite = sp;
    }

    const s = stateRef.current;
    s.W = W; s.H = H; s.pegs = pegs; s.slots = slots;
    s.gapX = gapX; s.gapY = gapY; s.startY = startY; s.slotH = slotH; s.pegR = pegR;
    s.leftWall = leftWall; s.rightWall = rightWall;
  }, []);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d")!;

    // ── Pre-baked sprites — all gradient/shadowBlur cost paid ONCE ──

    // White additive halo — used over the neon background for hit bursts
    const GLOW_SIZE = 128;
    const glowSprite = document.createElement("canvas");
    glowSprite.width = glowSprite.height = GLOW_SIZE;
    {
      const gctx = glowSprite.getContext("2d")!;
      const cx = GLOW_SIZE / 2;
      const g = gctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
      g.addColorStop(0, "rgba(255,255,255,0.95)");
      g.addColorStop(0.40, "rgba(255,255,255,0.30)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      gctx.fillStyle = g;
      gctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
    }

    // Neon peg — white-hot core wrapped in cyan→magenta halo. Halo bleeds
    // out so even the static state has a constant soft glow.
    const PEG_SPRITE_SIZE = 64;
    const pegSprite = document.createElement("canvas");
    pegSprite.width = pegSprite.height = PEG_SPRITE_SIZE;
    {
      const pctx = pegSprite.getContext("2d")!;
      const c = PEG_SPRITE_SIZE / 2;
      const halo = pctx.createRadialGradient(c, c, 0, c, c, c);
      halo.addColorStop(0, "rgba(0,229,255,0.85)");
      halo.addColorStop(0.18, "rgba(0,229,255,0.55)");
      halo.addColorStop(0.45, "rgba(60,120,200,0.28)");
      halo.addColorStop(1, "rgba(20,50,120,0)");
      pctx.fillStyle = halo;
      pctx.fillRect(0, 0, PEG_SPRITE_SIZE, PEG_SPRITE_SIZE);
      const core = pctx.createRadialGradient(c, c, 0, c, c, c * 0.22);
      core.addColorStop(0, "#FFFFFF");
      core.addColorStop(0.5, "rgba(220,250,255,0.95)");
      core.addColorStop(1, "rgba(0,229,255,0)");
      pctx.fillStyle = core;
      pctx.fillRect(0, 0, PEG_SPRITE_SIZE, PEG_SPRITE_SIZE);
    }

    // Plasma orb ball — hot white center, cyan/magenta plasma halo, with
    // an asymmetric specular highlight + energy arc so rotation reads.
    const BALL_SPRITE_SIZE = 96;
    const ballSprite = document.createElement("canvas");
    ballSprite.width = ballSprite.height = BALL_SPRITE_SIZE;
    {
      const bctx = ballSprite.getContext("2d")!;
      const c = BALL_SPRITE_SIZE / 2;
      const halo = bctx.createRadialGradient(c, c, 0, c, c, c);
      halo.addColorStop(0, "rgba(255,255,255,0)");
      halo.addColorStop(0.30, "rgba(0,229,255,0.55)");
      halo.addColorStop(0.55, "rgba(64,120,255,0.45)");
      halo.addColorStop(1, "rgba(20,40,140,0)");
      bctx.fillStyle = halo;
      bctx.fillRect(0, 0, BALL_SPRITE_SIZE, BALL_SPRITE_SIZE);
      const body = bctx.createRadialGradient(c, c, 0, c, c, c * 0.42);
      body.addColorStop(0, "#FFFFFF");
      body.addColorStop(0.55, "rgba(210,250,255,0.95)");
      body.addColorStop(1, "rgba(0,180,255,0.45)");
      bctx.fillStyle = body;
      bctx.beginPath();
      bctx.arc(c, c, c * 0.42, 0, Math.PI * 2);
      bctx.fill();
      const hi = bctx.createRadialGradient(c - c * 0.16, c - c * 0.20, 0, c - c * 0.16, c - c * 0.20, c * 0.16);
      hi.addColorStop(0, "rgba(255,255,255,0.95)");
      hi.addColorStop(1, "rgba(255,255,255,0)");
      bctx.fillStyle = hi;
      bctx.fillRect(0, 0, BALL_SPRITE_SIZE, BALL_SPRITE_SIZE);
      bctx.strokeStyle = "rgba(255,255,255,0.65)";
      bctx.lineWidth = 1.4;
      bctx.beginPath();
      bctx.arc(c, c, c * 0.32, -0.35, 0.35);
      bctx.stroke();
    }

    // Idle "drop here" indicator — glowing downward chevron + halo, baked
    const IDLE_SPRITE_W = 72;
    const IDLE_SPRITE_H = 60;
    const idleGlowSprite = document.createElement("canvas");
    idleGlowSprite.width = IDLE_SPRITE_W;
    idleGlowSprite.height = IDLE_SPRITE_H;
    {
      const ictx = idleGlowSprite.getContext("2d")!;
      const cx = IDLE_SPRITE_W / 2;
      const halo = ictx.createRadialGradient(cx, IDLE_SPRITE_H / 2, 0, cx, IDLE_SPRITE_H / 2, IDLE_SPRITE_W / 2);
      halo.addColorStop(0, "rgba(0,229,255,0.55)");
      halo.addColorStop(0.6, "rgba(0,229,255,0.10)");
      halo.addColorStop(1, "rgba(0,229,255,0)");
      ictx.fillStyle = halo;
      ictx.fillRect(0, 0, IDLE_SPRITE_W, IDLE_SPRITE_H);
      ictx.shadowBlur = 14;
      ictx.shadowColor = "#00E5FF";
      ictx.strokeStyle = "#FFFFFF";
      ictx.lineWidth = 3;
      ictx.lineCap = "round";
      ictx.lineJoin = "round";
      ictx.beginPath();
      ictx.moveTo(cx - 12, IDLE_SPRITE_H / 2 - 4);
      ictx.lineTo(cx, IDLE_SPRITE_H / 2 + 8);
      ictx.lineTo(cx + 12, IDLE_SPRITE_H / 2 - 4);
      ictx.stroke();
      ictx.shadowBlur = 0;
    }

    // Neon background — deep midnight, magenta top wash, cyan bottom
    // wash near slot row, glowing arcade rails along the peg triangle.
    const bgSprite = document.createElement("canvas");
    function bakeBackground() {
      const w = cvs!.width;
      const h = cvs!.height;
      bgSprite.width = w;
      bgSprite.height = h;
      const bctx = bgSprite.getContext("2d")!;
      const bg = bctx.createRadialGradient(w / 2, h * 0.30, 0, w / 2, h * 0.50, h * 1.0);
      bg.addColorStop(0, "#0A1530");
      bg.addColorStop(0.35, "#050B22");
      bg.addColorStop(0.7, "#020615");
      bg.addColorStop(1, "#01030A");
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, w, h);
      // Faint cyan grid overlay (perspective hint)
      bctx.strokeStyle = "rgba(0,229,255,0.04)";
      bctx.lineWidth = 1;
      const gap = Math.max(40, w * 0.09);
      for (let x = gap / 2; x < w; x += gap) {
        bctx.beginPath(); bctx.moveTo(x, 0); bctx.lineTo(x, h); bctx.stroke();
      }
      for (let y = gap / 2; y < h; y += gap) {
        bctx.beginPath(); bctx.moveTo(0, y); bctx.lineTo(w, y); bctx.stroke();
      }
      // Top amber wash — warm casino-cabinet lighting overhead
      const top = bctx.createLinearGradient(0, 0, 0, h * 0.35);
      top.addColorStop(0, "rgba(255,180,80,0.14)");
      top.addColorStop(1, "rgba(255,180,80,0)");
      bctx.fillStyle = top;
      bctx.fillRect(0, 0, w, h * 0.35);
      // Bottom cyan wash near slot row
      const s = stateRef.current;
      if (s.slots.length > 0) {
        const slotTopY = s.slots[0].y;
        const bot = bctx.createLinearGradient(0, slotTopY - h * 0.15, 0, h);
        bot.addColorStop(0, "rgba(0,229,255,0)");
        bot.addColorStop(0.7, "rgba(0,229,255,0.12)");
        bot.addColorStop(1, "rgba(0,229,255,0.20)");
        bctx.fillStyle = bot;
        bctx.fillRect(0, slotTopY - h * 0.15, w, h);
      }
      // Glowing arcade rails along the peg-field triangle
      if (s.leftWall.length) {
        bctx.shadowBlur = 10;
        bctx.shadowColor = "#00E5FF";
        bctx.strokeStyle = "rgba(0,229,255,0.55)";
        bctx.lineWidth = 2;
        bctx.beginPath();
        for (const seg of s.leftWall) {
          bctx.moveTo(seg.x1, seg.y1);
          bctx.lineTo(seg.x2, seg.y2);
        }
        bctx.stroke();
        // Right rail — warm amber to balance the cool cyan left rail.
        // Cyan + amber is the classic premium casino duotone (cool/warm
        // depth) without ever drifting into pink.
        bctx.shadowColor = "#FFB627";
        bctx.strokeStyle = "rgba(255,182,39,0.55)";
        bctx.beginPath();
        for (const seg of s.rightWall) {
          bctx.moveTo(seg.x1, seg.y1);
          bctx.lineTo(seg.x2, seg.y2);
        }
        bctx.stroke();
        bctx.shadowBlur = 0;
      }
      // Vignette
      const vg = bctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.80);
      vg.addColorStop(0, "rgba(0,0,0,0)");
      vg.addColorStop(1, "rgba(0,0,0,0.55)");
      bctx.fillStyle = vg;
      bctx.fillRect(0, 0, w, h);
    }

    function resize() {
      cvs!.width = document.documentElement.clientWidth;
      cvs!.height = document.documentElement.clientHeight;
      calcLayout();
      bakeBackground();
    }
    resize();
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", debouncedResize);

    // Spark spawner — adds additive-blended micro particles for peg/landing
    function spawnSparks(x: number, y: number, count: number) {
      const arr = particlesRef.current;
      const cols = ["#00E5FF", "#FFB627", "#FFFFFF", "#7FE3FF"];
      for (let i = 0; i < count; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 1.4;
        const sp = 1.5 + Math.random() * 3.5;
        arr.push({
          x, y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 14 + Math.random() * 12,
          maxLife: 26,
          color: cols[Math.floor(Math.random() * cols.length)],
          size: 1.5 + Math.random() * 2,
          g: 0.05, fr: 0.92, glow: true,
        });
      }
    }

    let animId: number;

    function loop() {
      animId = requestAnimationFrame(loop);
      const now = performance.now();
      const s = stateRef.current;
      const { W, H } = s;
      const frozen = anyAnimPlayingRef.current;

      // ── Screen shake (applied via translate, wraps all draws) ──
      const sh = shakeRef.current;
      let shakeX = 0, shakeY = 0;
      if (sh.until > now) {
        const t = Math.max(0, (sh.until - now) / 480);
        const mag = sh.intensity * t;
        shakeX = (Math.random() - 0.5) * mag * 2;
        shakeY = (Math.random() - 0.5) * mag * 2;
      }
      ctx.save();
      if (shakeX || shakeY) ctx.translate(shakeX, shakeY);

      // Background — baked once per resize
      ctx.drawImage(bgSprite, 0, 0);

      // ── Marquee chase lights around slot row (idle attractor) ──
      if (s.balls.length === 0 && s.slots.length > 0) {
        const first = s.slots[0];
        const last = s.slots[s.slots.length - 1];
        const ly = first.y - 8;
        const lx0 = first.x;
        const lx1 = last.x + last.w;
        const lw = lx1 - lx0;
        const lights = 16;
        const phase = (now * 0.003) % lights;
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < lights; i++) {
          let d = (i - phase) % lights;
          if (d < 0) d += lights;
          const dd = Math.min(d, lights - d);
          const intensity = Math.max(0, 1 - dd / 2.5);
          if (intensity < 0.05) continue;
          ctx.globalAlpha = intensity * 0.85;
          ctx.fillStyle = (i % 2 === 0) ? "#00E5FF" : "#FFB627";
          const rL = 2.4 + intensity * 1.8;
          ctx.beginPath();
          ctx.arc(lx0 + (i + 0.5) * (lw / lights), ly, rL, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      // Idle drop indicator
      if (s.balls.length === 0) {
        const pulse = Math.sin(now * 0.004) * 0.3 + 0.7;
        ctx.globalAlpha = pulse * 0.85;
        ctx.drawImage(idleGlowSprite, W / 2 - IDLE_SPRITE_W / 2, s.startY - 60);
        ctx.globalAlpha = 1;
      }

      // ── Pegs — base draw + additive hit-glow pass ──
      for (const peg of s.pegs) {
        if (!frozen) peg.glow *= 0.9;
        const visR = peg.r + 0.5;
        const hitR = visR + peg.glow * 2.2;
        const drawSize = hitR * 5;
        ctx.drawImage(pegSprite, peg.x - drawSize / 2, peg.y - drawSize / 2, drawSize, drawSize);
      }
      ctx.globalCompositeOperation = "lighter";
      for (const peg of s.pegs) {
        if (peg.glow <= 0.05) continue;
        const visR = peg.r + 0.5;
        const haloR = visR * 5;
        ctx.globalAlpha = peg.glow * 0.85;
        ctx.drawImage(glowSprite, peg.x - haloR, peg.y - haloR, haloR * 2, haloR * 2);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // ── Slots — base draw + additive flash/beam pass ──
      for (let i = 0; i < s.slots.length; i++) {
        const sl = s.slots[i];
        if (!frozen) sl.glow *= 0.94;
        if (sl.sprite) ctx.drawImage(sl.sprite, Math.round(sl.x), Math.round(sl.y));
      }
      ctx.globalCompositeOperation = "lighter";
      for (let i = 0; i < s.slots.length; i++) {
        const sl = s.slots[i];
        if (sl.glow <= 0.05) continue;
        const sx = Math.round(sl.x);
        const sy = Math.round(sl.y);
        const sw2 = Math.round(sl.w);
        const sh2 = Math.round(sl.h);
        const cx2 = sx + sw2 / 2;
        const cy2 = sy + sh2 / 2;
        const haloR = Math.max(sw2, sh2) * 2.4;
        const a = Math.min(1, sl.glow);
        ctx.globalAlpha = a * 0.85;
        ctx.drawImage(glowSprite, cx2 - haloR, cy2 - haloR, haloR * 2, haloR * 2);
        // Upward light beam on winning landings
        if (a > 0.4) {
          const beamH = sh2 * 4.5;
          const beamGrad = ctx.createLinearGradient(cx2, sy, cx2, sy - beamH);
          beamGrad.addColorStop(0, `rgba(255,255,255,${a * 0.55})`);
          beamGrad.addColorStop(1, "rgba(255,255,255,0)");
          ctx.fillStyle = beamGrad;
          ctx.fillRect(cx2 - sw2 * 0.42, sy - beamH, sw2 * 0.84, beamH);
        }
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;

      // ── Balls — physics + render ──
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (!b.alive) { s.balls.splice(i, 1); continue; }

        // Anticipation ring — pulsing amber outline around the destined
        // slot while the ball is in the slow-mo zone. Only visible once
        // the target is known (post-API).
        if (!b.awaiting && !b.settled && b.y > s.startY + (ROWS - 2.0) * s.gapY && b.y < s.startY + ROWS * s.gapY) {
          const ts = s.slots[b.data.slotIndex];
          if (ts) {
            const pulse = 0.5 + 0.5 * Math.sin(now * 0.014);
            const padX = ts.w * 0.10;
            const padY = ts.h * 0.30;
            const rx = ts.x - padX;
            const ry = ts.y - padY;
            const rw = ts.w + padX * 2;
            const rh = ts.h + padY * 2;
            const rr = Math.min(10, rh * 0.3);
            ctx.globalCompositeOperation = "lighter";
            ctx.strokeStyle = `rgba(255,200,80,${0.45 * pulse + 0.20})`;
            ctx.lineWidth = 2 + pulse * 1.5;
            ctx.beginPath();
            ctx.moveTo(rx + rr, ry);
            ctx.lineTo(rx + rw - rr, ry);
            ctx.arcTo(rx + rw, ry, rx + rw, ry + rr, rr);
            ctx.lineTo(rx + rw, ry + rh - rr);
            ctx.arcTo(rx + rw, ry + rh, rx + rw - rr, ry + rh, rr);
            ctx.lineTo(rx + rr, ry + rh);
            ctx.arcTo(rx, ry + rh, rx, ry + rh - rr, rr);
            ctx.lineTo(rx, ry + rr);
            ctx.arcTo(rx, ry, rx + rr, ry, rr);
            ctx.closePath();
            ctx.stroke();
            ctx.globalCompositeOperation = "source-over";
          }
        }

        if (!b.settled && !frozen) {
          const GRAVITY = 0.35;
          const MAX_VY = 7.5;
          const RESTITUTION = 0.30;
          const MAX_BOUNCE_UP = 2.5;
          const AIR = 0.995;
          const WALL_BOUNCE = 0.40;
          const JITTER_X = 0.45;
          const JITTER_Y = 0.18;
          const lastWp = b.path[b.path.length - 1];
          const targetSlot = s.slots[b.data.slotIndex] || null;
          const topY = s.startY;
          const bottomY = s.startY + ROWS * s.gapY;

          // Anticipation slow-mo — visual time-warp during the final
          // approach. Only kicks in once the target is known (post-API).
          const slowZoneStart = s.startY + (ROWS - 2.0) * s.gapY;
          const inSlowMo = !b.awaiting && b.y > slowZoneStart && b.y < bottomY;
          const dt = inSlowMo ? 0.55 : 1.0;

          b.vy = Math.min(MAX_VY, b.vy + GRAVITY * dt);
          b.vx *= AIR;

          const fallFrac = Math.max(0, Math.min(1, (b.y - topY) / (bottomY - topY)));

          if (b.awaiting) {
            // Free-fall under pure physics — no target attractor. Cap
            // depth so the ball can't reach the lock zone before the
            // server has decided. Soft bounce keeps motion alive.
            const awaitingFloor = s.startY + (ROWS - 4) * s.gapY;
            if (b.y > awaitingFloor) {
              b.y = awaitingFloor;
              if (b.vy > 0) b.vy = -b.vy * 0.4;
            }
          } else {
            const dxToTarget = lastWp.x - b.x;
            if (b.y < bottomY) {
              const pull = 0.004 + fallFrac * 0.030;
              b.vx += dxToTarget * pull * dt;
              const maxVx = 1.4 + fallFrac * 1.6;
              if (b.vx > maxVx) b.vx = maxVx;
              else if (b.vx < -maxVx) b.vx = -maxVx;
            } else {
              if (targetSlot) {
                const minX = targetSlot.x + b.r;
                const maxX = targetSlot.x + targetSlot.w - b.r;
                if (b.x < minX) b.x = minX;
                else if (b.x > maxX) b.x = maxX;
              }
              b.vx = 0;
              if (b.vy > 4.5) b.vy = 4.5;
            }
            // Telegraph the destination during slow-mo
            if (inSlowMo && targetSlot) {
              targetSlot.glow = Math.max(targetSlot.glow, 0.35 + 0.30 * Math.sin(now * 0.014));
            }
          }

          // Integrate
          b.x += b.vx * dt;
          b.y += b.vy * dt;

          // Triangle walls
          if (s.leftWall.length && b.y >= s.leftWall[0].y1 && b.y <= s.leftWall[s.leftWall.length - 1].y2) {
            for (const seg of s.leftWall) {
              if (b.y >= seg.y1 && b.y <= seg.y2) {
                const t = (b.y - seg.y1) / (seg.y2 - seg.y1 || 1);
                const wx = seg.x1 + (seg.x2 - seg.x1) * t;
                if (b.x < wx + b.r) {
                  b.x = wx + b.r;
                  b.vx = Math.abs(b.vx) * WALL_BOUNCE;
                }
                break;
              }
            }
            for (const seg of s.rightWall) {
              if (b.y >= seg.y1 && b.y <= seg.y2) {
                const t = (b.y - seg.y1) / (seg.y2 - seg.y1 || 1);
                const wx = seg.x1 + (seg.x2 - seg.x1) * t;
                if (b.x > wx - b.r) {
                  b.x = wx - b.r;
                  b.vx = -Math.abs(b.vx) * WALL_BOUNCE;
                }
                break;
              }
            }
          }

          // Peg collisions
          for (const peg of s.pegs) {
            const dx = b.x - peg.x;
            const dy = b.y - peg.y;
            const distSq = dx * dx + dy * dy;
            const minDist = b.r + peg.r;
            const minDistSq = minDist * minDist;
            if (distSq >= minDistSq || distSq < 0.00000001) continue;
            const dist = Math.sqrt(distSq);
            const nx = dx / dist;
            const ny = dy / dist;
            const overlap = minDist - dist + 0.5;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const vDotN = b.vx * nx + b.vy * ny;
            if (vDotN < 0) {
              b.vx -= (1 + RESTITUTION) * vDotN * nx;
              b.vy -= (1 + RESTITUTION) * vDotN * ny;
              b.vx += (Math.random() - 0.5) * 2 * JITTER_X * dt;
              b.vy += (Math.random() - 0.5) * 2 * JITTER_Y * dt;
              if (b.vy < -MAX_BOUNCE_UP) b.vy = -MAX_BOUNCE_UP;
              peg.glow = 1;
              b.squash = Math.max(b.squash, 0.32);
              b.spin += (Math.random() - 0.5) * 0.25;
              spawnSparks(b.x, b.y, inSlowMo ? 8 : 5);
              playPegSfx();
            }
          }

          // Rotation + squash decay
          b.rotation += b.vx * 0.06 + b.spin;
          b.spin *= 0.92;
          b.squash *= 0.85;

          // Trail (every 2nd frame, cap at 10 points)
          b.trailCounter = (b.trailCounter + 1) % 2;
          if (b.trailCounter === 0) {
            b.trail.push({ x: b.x, y: b.y, a: 1 });
            if (b.trail.length > 10) b.trail.shift();
          }
          for (let ti = 0; ti < b.trail.length; ti++) b.trail[ti].a *= 0.88;

          // Settle — only once the API has resolved (b.awaiting === false)
          const last = b.path[b.path.length - 1];
          if (!b.awaiting && b.y >= last.y) {
            b.y = last.y;
            b.vy = 0;
            b.x += (last.x - b.x) * 0.28;
            if (Math.abs(b.x - last.x) < 1.2) {
              b.x = last.x;
              b.settled = true;
              for (const sl of s.slots) {
                if (b.x >= sl.x && b.x <= sl.x + sl.w) {
                  sl.glow = Math.min(1.6, sl.glow + 1.4);
                  break;
                }
              }
              // Casino landing impact — shake + spark burst tuned to win size
              if (b.data.multiplier >= 5) {
                shakeRef.current = { intensity: 16, until: now + 520 };
                spawnSparks(b.x, b.y - b.r * 0.5, 28);
              } else if (b.data.multiplier >= 2) {
                shakeRef.current = { intensity: 6, until: now + 240 };
                spawnSparks(b.x, b.y - b.r * 0.5, 14);
              } else {
                spawnSparks(b.x, b.y - b.r * 0.5, 6);
              }
              if (typeof (b as any)._onSettle === "function") (b as any)._onSettle();
              setTimeout(() => { b.alive = false; }, 500);
            }
          }
        }

        // Trail render — additive plasma echoes behind the ball
        if (b.trail.length) {
          ctx.globalCompositeOperation = "lighter";
          for (let ti = 0; ti < b.trail.length; ti++) {
            const tp = b.trail[ti];
            if (tp.a < 0.04) continue;
            const rt = b.r * (0.55 + (ti / b.trail.length) * 0.55);
            ctx.globalAlpha = tp.a * 0.45;
            ctx.drawImage(ballSprite, tp.x - rt, tp.y - rt, rt * 2, rt * 2);
          }
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = 1;
        }

        // Ball render — rotated + squashed plasma orb
        ctx.save();
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rotation);
        const sxq = 1 + b.squash * 0.25;
        const syq = 1 - b.squash * 0.45;
        ctx.scale(sxq, syq);
        const drawR = b.r * 2.6;
        ctx.drawImage(ballSprite, -drawR, -drawR, drawR * 2, drawR * 2);
        ctx.restore();
      }

      // ── Particles — one physics pass, two render passes (normal + additive) ──
      const pList = particlesRef.current;
      if (pList.length) {
        let writeIdx = 0;
        for (let i = 0; i < pList.length; i++) {
          const p = pList[i];
          if (!frozen) {
            const gp = p.g ?? 0.18;
            const fr = p.fr ?? 1;
            p.vy += gp;
            if (fr !== 1) { p.vx *= fr; p.vy *= fr; }
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 1;
          }
          if (p.life <= 0 || p.y > s.H + 20) continue;
          pList[writeIdx++] = p;
        }
        pList.length = writeIdx;
        // Confetti (normal blend)
        for (let i = 0; i < pList.length; i++) {
          const p = pList[i];
          if (p.glow) continue;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        // Sparks (additive)
        ctx.globalCompositeOperation = "lighter";
        for (let i = 0; i < pList.length; i++) {
          const p = pList[i];
          if (!p.glow) continue;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = 1;
      }

      ctx.restore();
    }
    loop();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
    };
  }, [calcLayout, playPegSfx]);

  useEffect(() => { calcLayout(); }, [calcLayout]);

  function spawnParticles(count: number, isJP: boolean) {
    const colors = isJP
      ? ["#FFD700", "#FF6D00", "#FF3D00", "#FFAB00", "#fff"]
      : ["#FFD700", "#FFC107", "#00E676", "#fff"];
    const W = stateRef.current.W || window.innerWidth;
    const H = stateRef.current.H || window.innerHeight;
    const arr = particlesRef.current;
    for (let i = 0; i < count; i++) {
      arr.push({
        x: W * (0.1 + Math.random() * 0.8),
        y: H * (-0.05 + Math.random() * 0.25),
        vx: (Math.random() - 0.5) * 1.6,
        vy: 1 + Math.random() * 1.5,
        life: 60 * (1.5 + Math.random() * 2),
        maxLife: 60 * 2.5,
        color: colors[Math.floor(Math.random() * colors.length)],
        // Vary size to compensate for the removed rotation variety
        size: 3 + Math.random() * 12,
      });
    }
  }

  const handleDrop = useCallback(() => {
    if (betAmount <= 0 || balance < betAmount) return;
    // Block drops while ANY animation is playing
    if (anyAnimPlayingRef.current) return;

    // Deduct locally for instant UI feedback
    setBalance((prev) => prev - betAmount);
    pendingBallsRef.current++;
    dropCount.current++;

    const currentRisk = risk;
    const currentBet = betAmount;
    const mults = MULTIPLIERS[currentRisk];

    // ── Spawn the ball IMMEDIATELY on click — zero perceived latency. ──
    // The ball starts free-falling under pure physics (no target attractor).
    // The API runs in parallel; when it returns, we set the ball's target
    // slot and the existing path-based pull smoothly redirects it. While
    // awaiting, the ball is soft-capped above the lock zone so it can't
    // commit to a slot before the server decides.
    const s = stateRef.current;
    const ballR = Math.max(8, s.W * 0.015);
    const startX = s.W / 2 + (Math.random() - 0.5) * s.gapX * 0.4;
    const ball: Ball = {
      x: startX,
      y: s.startY - 30,
      vx: 0,
      vy: 2 + Math.random() * 1,
      segIdx: 0,
      r: ballR,
      alive: true, settled: false,
      trail: [], targetSlot: 0,
      // Placeholder data — replaced when API responds. Multiplier 0 so
      // settle effects can't accidentally fire jackpot shake before the
      // verdict arrives.
      data: { slotIndex: 0, multiplier: 0, winAmount: 0, risk: currentRisk },
      rotation: 0,
      spin: 0,
      squash: 0,
      trailCounter: 0,
      awaiting: true,
      path: [{ x: startX, y: s.startY + ROWS * s.gapY * 2 }], // dummy far below
    };
    s.balls.push(ball);

    // Fire API in parallel — ball is already falling
    playGame("plinko").then((serverResult: any) => {
      // Always keep the LOWEST server balance (most up-to-date after all deductions)
      if (lastServerCoinsRef.current < 0 || serverResult.coinsRemaining < lastServerCoinsRef.current) {
        lastServerCoinsRef.current = serverResult.coinsRemaining;
      }

      // Handle bonus round: coins hit 0, then bonus coins added after a delay
      if (serverResult.bonusRound && serverResult.freeCoins) {
        // Balance should show 0 first, then bonus coins appear after notification
        lastServerCoinsRef.current = 0;
        setTimeout(() => {
          setBonusRoundInfo({ coins: serverResult.freeCoins, gamesLeft: serverResult.bonusGamesLeft || 0 });
          // Update balance to bonus coins after showing notification
          setTimeout(() => {
            setBalance(serverResult.freeCoins);
            storeCoin(serverResult.freeCoins);
            lastServerCoinsRef.current = serverResult.freeCoins;
          }, 800);
        }, 500);
      } else if (serverResult.transactionComplete) {
        setBonusRoundInfo(null);
      }

      // Map server verdict to slot: WIN → random green slot, LOSE → random red slot
      const won = serverResult.totalWin > 0;
      let closestIdx: number;
      if (won) {
        const winSlots = mults.map((m, i) => ({ m, i })).filter(slt => slt.m > 0);
        closestIdx = winSlots[Math.floor(Math.random() * winSlots.length)].i;
      } else {
        const loseSlots = mults.map((m, i) => ({ m, i })).filter(slt => slt.m === 0);
        closestIdx = loseSlots[Math.floor(Math.random() * loseSlots.length)].i;
      }

      const data: DropResult = {
        slotIndex: closestIdx,
        multiplier: mults[closestIdx],
        winAmount: serverResult.totalWin,
        risk: currentRisk,
      };

      // ── Redirect the in-flight ball toward the correct slot ──
      const targetSlot = s.slots[data.slotIndex];
      if (targetSlot) {
        ball.path = [{
          x: targetSlot.x + targetSlot.w / 2,
          y: targetSlot.y + targetSlot.h * 0.3,
        }];
      }
      ball.data = data;
      ball.targetSlot = data.slotIndex;
      ball.awaiting = false;

      (ball as any)._onSettle = () => {
        pendingBallsRef.current--;
        // Show win effects
        if (serverResult.totalWin > 0) {
          storeCash(serverResult.newBalance);
        }
        if (serverResult.totalWin > 0 && serverResult.won) {
          setWinAmount(serverResult.totalWin);
          spawnParticles(serverResult.bonusWin > 20 ? 50 : 20, serverResult.bonusWin > 20);
          // Trigger the new fancy win animation overlay + audio.
          // Set the blocking ref synchronously BEFORE queueAnim runs below,
          // so queued shield/card animations wait for the win anim to finish
          // instead of playing on top of it (React batches setShowWinAnim,
          // so the useEffect that syncs anyAnimPlayingRef hasn't fired yet).
          anyAnimPlayingRef.current = true;
          setWinAnimAmount(serverResult.totalWin);
          setShowWinAnim(true);
          playWinAudio();
        }
        // Queue reward animations — they play one at a time, after win anim
        if (serverResult.rewards?.shield) {
          const sc = (serverResult.rewards.shield as any).shieldCount;
          if (sc !== undefined && sc !== null) {
            setShieldCount(sc);
          } else {
            setShieldCount((c) => Math.min(c + 1, 3));
          }
          queueAnim("shield");
        }
        if (serverResult.rewards?.card) {
          const serverCharges = serverResult.rewards.card.attackCharges;
          if (serverCharges !== undefined && serverCharges !== null) {
            setAttackCards(serverCharges);
          } else {
            // Backend didn't return count — increment optimistically
            setAttackCards((c) => Math.min(c + 1, 3));
          }
          queueAnim("card");
        }
        // Coalesced balance update — ONE setBalance per ball settle
        // instead of two. If parallel balls are still in flight, clamp to
        // the lowest known server value; if this is the last ball, snap
        // to the exact server value and reset bookkeeping.
        setBalance((prev) => {
          if (pendingBallsRef.current === 0) {
            const final = lastServerCoinsRef.current;
            storeCoin(final);
            lastServerCoinsRef.current = -1;
            return final;
          }
          return Math.min(prev, serverResult.coinsRemaining);
        });
      };

      // Rare race: ball might already be settled (very slow API). Fire now.
      if (ball.settled) {
        (ball as any)._onSettle();
      }
    }).catch((err: any) => {
      // API failed — kill the in-flight ball and restore the deduction
      console.error("Drop API error:", err.message);
      ball.alive = false;
      pendingBallsRef.current--;
      setBalance((prev) => prev + currentBet);
      if (pendingBallsRef.current === 0 && lastServerCoinsRef.current >= 0) {
        setBalance(lastServerCoinsRef.current);
        storeCoin(lastServerCoinsRef.current);
        lastServerCoinsRef.current = -1;
      }
      // Show error briefly
      setBigWinText(err.message || "\u10E8\u10D4\u10EA\u10D3\u10DD\u10DB\u10D0");
      setTimeout(() => setBigWinText(""), 2000);
    });
  }, [balance, betAmount]);

  // Memoized bottom UI — only re-renders when these props actually change.
  // Unrelated state (showWinAnim, winAnimAmount, bonusRoundInfo, result,
  // winAmount) changing won't force the bottom buttons / balance pill to
  // re-reconcile during gameplay.
  const bottomUI = useMemo(() => (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center z-10 pointer-events-none gap-3" style={{ paddingBottom: "max(18px, calc(env(safe-area-inset-bottom, 0px) + 12px))" }}>
      <div className="min-h-[4px]" />

      {showBetPicker && (
        <p className="text-white/50 text-[14px] font-medium" style={{ fontFamily: "var(--font-dm-sans)" }}>
          Pick amount to play
        </p>
      )}

      {showBetPicker && (
        <div className="pointer-events-auto flex gap-2.5 overflow-x-auto px-4 pb-1 scrollbar-hide w-full max-w-[420px]">
          {BET_OPTIONS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setBetAmount(amt); setShowBetPicker(false); }}
              className="shrink-0 px-8 py-5 rounded-full text-[20px] font-bold active:scale-[0.95] transition-transform"
              style={{ background: "#FFD700", color: "#1a1a2e", fontFamily: "var(--font-outfit)" }}
            >
              {amt}
            </button>
          ))}
        </div>
      )}

      {!showBetPicker && betAmount > 0 && (
        <button
          onClick={handleDrop}
          disabled={balance < betAmount}
          className="pointer-events-auto px-12 py-6 rounded-full text-[19px] font-black tracking-wide transition-all duration-150 active:scale-[0.97] disabled:bg-[#3a3a4a] disabled:text-[#777] disabled:cursor-not-allowed"
          style={{
            background: balance < betAmount ? "#3a3a4a" : "#FFD700",
            color: balance < betAmount ? "#777" : "#1a1a2e",
            boxShadow: balance < betAmount ? "none" : "0 4px 24px rgba(255,215,0,.25), inset 0 1px 0 rgba(255,255,255,.3)",
            fontFamily: "var(--font-outfit)",
          }}
        >
          Drop
        </button>
      )}

      <button
        onClick={() => setShowBetPicker(true)}
        className="pointer-events-auto px-8 py-4 rounded-full active:scale-[0.97] transition-transform"
        style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="flex flex-col items-center gap-0.5">
          {betAmount > 0 && (
            <div className="flex items-center gap-1.5">
              <img src="/images/coin-icon.png" alt="coin" width={15} height={15} style={{ objectFit: "contain" }} />
              <span className="text-[15px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                {betAmount}
              </span>
              <span className="text-white/30 text-[13px]">&rsaquo;</span>
            </div>
          )}
          <span className="text-[11px] text-white/40" style={{ fontFamily: "var(--font-dm-sans)" }}>
            {betAmount > 0 ? "Balance " : "Pick amount to play"}
            {betAmount > 0 && (
              <span className="text-white font-bold">
                {balance.toLocaleString("en-US", { maximumFractionDigits: 1 })}
              </span>
            )}
          </span>
        </div>
      </button>
    </div>
  ), [balance, betAmount, showBetPicker, handleDrop]);

  return (
    <div
      className="relative w-full h-[100dvh] bg-[#050a1a] overflow-hidden"
      style={{ overscrollBehavior: "none", touchAction: "none" }}
    >
      <canvas ref={canvasRef} className="absolute inset-0 z-[1]" />

      {/* Transient error text (updated imperatively via ref — never triggers a React re-render) */}
      <div
        ref={bigWinRef}
        className="absolute z-20 text-center text-[13px] font-medium pointer-events-none"
        style={{ top: "calc(env(safe-area-inset-top, 0px) + 80px)", left: 0, right: 0, color: "#ffb4b4", fontFamily: "var(--font-outfit)" }}
      />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 flex justify-between items-start p-3.5 z-10" style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 14px)" }}>
        <button
          onClick={() => window.history.back()}
          className="w-9 h-9 rounded-full bg-white/10 border border-white/[0.12] flex items-center justify-center text-white/60 backdrop-blur-lg active:scale-[0.95] transition-transform"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4l8 8M12 4L4 12" />
          </svg>
        </button>
        {/* Swords + Shields with counters — only visible when village is active */}
        {villageActive && (
          <div className="flex items-center gap-2">
            {/* Swords pill */}
            <div
              className="flex items-center gap-1.5 px-3 py-2 rounded-full backdrop-blur-lg border"
              style={{
                background: attackCards >= 3 ? "rgba(249,231,65,0.2)" : "rgba(255,255,255,0.1)",
                borderColor: attackCards >= 3 ? "rgba(249,231,65,0.5)" : "rgba(255,255,255,0.12)",
                boxShadow: attackCards >= 3 ? "0 0 12px rgba(249,231,65,0.4)" : "none",
                animation: attackCards >= 3 ? "ld-pulse 1.5s ease-in-out infinite" : "none",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/sword.png" alt="" width={24} height={24} style={{ objectFit: "contain" }} />
              <span className="text-[14px] font-bold" style={{
                color: attackCards >= 3 ? "#F9E741" : "#fff",
                fontFamily: "var(--font-outfit)",
              }}>
                {attackCards}/3
              </span>
            </div>
            {/* Shields pill */}
            <div className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-white/10 border border-white/[0.12] backdrop-blur-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/images/shield.png" alt="" width={22} height={22} style={{ objectFit: "contain" }} />
              <span className="text-[14px] font-bold text-white" style={{ fontFamily: "var(--font-outfit)" }}>
                {shieldCount}/3
              </span>
            </div>
          </div>
        )}
        <style>{`@keyframes ld-pulse{0%,100%{box-shadow:0 0 12px rgba(249,231,65,0.4)}50%{box-shadow:0 0 24px rgba(249,231,65,0.7)}}`}</style>
      </div>

      {/* Risk selector removed — single mode */}

      {/* Win animation overlay — coin/bill rain + slot counter ramping to winAmount */}
      <WinAnimation
        show={showWinAnim}
        amount={winAnimAmount}
        onDone={() => { setShowWinAnim(false); stopWinAudio(); playNextAnim(); }}
      />
      {/* Block interaction during any animation overlay */}
      {(showWinAnim || showShieldAnim || showCardAnim || showAttackSequence) && (
        <div className="fixed inset-0 z-[180]" style={{ pointerEvents: "auto" }} />
      )}

      {/* Shield jackpot reveal animation */}
      {showShieldAnim && (
        <ShieldJackpotReveal onDone={() => { setShowShieldAnim(false); playNextAnim(); /* 3s delay inside playNextAnim */ }} />
      )}

      {showCardAnim && (
        <AttackCardReveal onDone={() => {
          setShowCardAnim(false);
          if (attackCards >= 3 && !attackTriggeredRef.current) {
            attackTriggeredRef.current = true;
            setTimeout(() => setShowAttackSequence(true), 3000);
          } else {
            playNextAnim();
          }
        }} />
      )}

      {/* Attack sequence — triggered when 3 swords collected */}
      {showAttackSequence && (
        <AttackSequence onComplete={() => {
          setShowAttackSequence(false);
          attackTriggeredRef.current = false;
          // Reset attack charges (backend already set to 0)
          setAttackCards(0);
          // Refresh coin balance
          ensureActiveTransaction().then((tx) => {
            setBalance(tx.coinsRemaining);
            storeCoin(tx.coinsRemaining);
          }).catch(() => {});
          // Continue any remaining queued animations
          playNextAnim();
        }} />
      )}

      {/* Bonus round banner */}
      {bonusRoundInfo && (
        <div className="absolute left-0 right-0 z-20 flex justify-center" style={{ top: "calc(env(safe-area-inset-top, 0px) + 70px)" }}>
          <div className="px-5 py-3 rounded-[16px] text-center" style={{ background: "rgba(255,215,0,0.15)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,215,0,0.3)" }}>
            <p className="text-[14px] font-bold" style={{ color: "#FFD700", fontFamily: "var(--font-outfit)" }}>
              {"\uD83C\uDF89 \u10D1\u10DD\u10DC\u10E3\u10E1 \u10E0\u10D0\u10E3\u10DC\u10D3\u10D8!"}
            </p>
            <p className="text-[12px] mt-1" style={{ color: "rgba(255,215,0,0.7)", fontFamily: "var(--font-dm-sans)" }}>
              {"\u10E3\u10E4\u10D0\u10E1\u10DD \u10E5\u10DD\u10D8\u10DC\u10D4\u10D1\u10D8: "}{bonusRoundInfo.coins} {bonusRoundInfo.gamesLeft > 0 && ` \u2022 \u10D3\u10D0\u10E0\u10E9\u10D0: ${bonusRoundInfo.gamesLeft}`}
            </p>
          </div>
        </div>
      )}

      {bottomUI}
    </div>
  );
}

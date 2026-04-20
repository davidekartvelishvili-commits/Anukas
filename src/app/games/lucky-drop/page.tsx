"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { MULTIPLIERS, SLOT_COLORS, BET_COST, type RiskLevel, type DropResult } from "./drop-config";
import { playGame, ensureActiveTransaction } from "@/services/games";
import { setCoinBalance as storeCoin, setCashBalance as storeCash } from "@/services/balance";
import WinAnimation from "@/components/WinAnimation";
import ShieldJackpotReveal from "@/components/ShieldJackpotReveal";
import AttackCardReveal from "@/components/AttackCardReveal";

const ROWS = 12;

interface Peg { x: number; y: number; r: number; glow: number }
interface Slot { x: number; y: number; w: number; h: number; mult: number; color: string; glow: number; sprite?: HTMLCanvasElement }
interface TrailPoint { x: number; y: number; a: number }

// Physics-based ball that tracks a path (path guarantees the predetermined slot)
interface Ball {
  x: number; y: number;
  vx: number; vy: number;
  segIdx: number; // which path segment we're currently traversing
  r: number; alive: boolean; settled: boolean;
  trail: TrailPoint[];
  targetSlot: number;
  data: DropResult;
  // Path is used only as a spine of waypoints so the ball reaches the
  // correct slot. Vertical motion is real gravity; horizontal is a damped
  // spring pulling toward the next waypoint's X.
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
    ensureActiveTransaction().then((tx) => {
      setBalance(tx.coinsRemaining);
      storeCoin(tx.coinsRemaining);
    }).catch(() => {});
    // Fetch village profile for attack cards + shield count
    import("@/services/api").then(({ apiFetch }) => {
      apiFetch("/village/profile").then((data: any) => {
        if (data?.success) {
          setAttackCards(data.profile.cardCount || 0);
          setShieldCount(data.profile.shieldActive ? 1 : 0);
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
  const pendingShieldRef = useRef(false);
  const pendingCardRef = useRef(false);
  const [attackCards, setAttackCards] = useState(0);
  const [shieldCount, setShieldCount] = useState(0);
  const dropCount = useRef(0);

  // Canvas-rendered confetti particles. Replaces the old DOM-div-per-particle
  // approach which was creating 20-50 <div>s per win, each running a 4s CSS
  // transform animation — severe jank on mobile.
  type CanvasParticle = {
    x: number; y: number; vx: number; vy: number;
    life: number; maxLife: number;
    color: string; size: number;
  };
  const particlesRef = useRef<CanvasParticle[]>([]);
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
      // base card
      sctx.fillStyle = sl.color;
      sctx.fillRect(1, 0, sw - 2, sh);
      // top accent
      sctx.fillStyle = "rgba(255,255,255,0.35)";
      sctx.fillRect(2, 0, sw - 4, 2);
      // label
      sctx.font = `${sl.mult >= 10 ? "900" : "700"} ${Math.min(sl.w * 0.38, 18)}px sans-serif`;
      sctx.textAlign = "center";
      sctx.textBaseline = "middle";
      sctx.fillStyle = "#FFFFFF";
      sctx.fillText(sl.mult === 0 ? "0" : "WIN", sw / 2, sh / 2);
      // right divider
      sctx.fillStyle = "rgba(0,0,0,0.15)";
      sctx.fillRect(sw - 1, 0, 1, sh);
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

    // Pre-baked white-radial glow sprite — used for both peg hits and
    // slot landings. Rendered once, then drawn per-frame via drawImage
    // (MUCH cheaper than createRadialGradient + fillRect per hit per frame).
    const GLOW_SIZE = 128;
    const glowSprite = document.createElement("canvas");
    glowSprite.width = glowSprite.height = GLOW_SIZE;
    {
      const gctx = glowSprite.getContext("2d")!;
      const cx = GLOW_SIZE / 2;
      const g = gctx.createRadialGradient(cx, cx, 0, cx, cx, cx);
      g.addColorStop(0, "rgba(255,255,255,0.85)");
      g.addColorStop(0.45, "rgba(255,255,255,0.25)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      gctx.fillStyle = g;
      gctx.fillRect(0, 0, GLOW_SIZE, GLOW_SIZE);
    }

    // Pre-baked peg dot sprite. 60 arc+fill calls per frame was adding up
    // to ~6-12ms on mobile; one drawImage per peg is ~free.
    const PEG_SPRITE_SIZE = 24; // generous, high-res; scaled down by drawImage
    const pegSprite = document.createElement("canvas");
    pegSprite.width = pegSprite.height = PEG_SPRITE_SIZE;
    {
      const pctx = pegSprite.getContext("2d")!;
      pctx.fillStyle = "#FFFFFF";
      pctx.beginPath();
      pctx.arc(PEG_SPRITE_SIZE / 2, PEG_SPRITE_SIZE / 2, PEG_SPRITE_SIZE / 2 - 0.5, 0, Math.PI * 2);
      pctx.fill();
    }

    // Pre-baked idle-pulse triangle with shadowBlur baked IN. Replaces a
    // per-frame shadowBlur=15 operation that was costing 3-8ms/frame on
    // mobile whenever no balls were in flight.
    const IDLE_SPRITE_W = 60;
    const IDLE_SPRITE_H = 48;
    const idleGlowSprite = document.createElement("canvas");
    idleGlowSprite.width = IDLE_SPRITE_W;
    idleGlowSprite.height = IDLE_SPRITE_H;
    {
      const ictx = idleGlowSprite.getContext("2d")!;
      // Translate so the triangle center sits at (IDLE_SPRITE_W/2, 35 within
      // the sprite) — matches the original triangle height from tip at y=35
      // down to base at y=47 in the original coords (12px tall).
      const cx = IDLE_SPRITE_W / 2;
      const tipY = 24; // some padding above so blur has room
      const baseY = 36;
      ictx.shadowBlur = 15;
      ictx.shadowColor = "#FFD700";
      ictx.fillStyle = "#FFD700";
      ictx.beginPath();
      ictx.moveTo(cx, tipY);
      ictx.lineTo(cx - 8, baseY);
      ictx.lineTo(cx + 8, baseY);
      ictx.closePath();
      ictx.fill();
    }

    // Pre-baked background — radial gradient rebuilt every frame was a
    // major mobile hit. Bake once per resize, drawImage each frame.
    const bgSprite = document.createElement("canvas");
    function bakeBackground() {
      const w = cvs!.width;
      const h = cvs!.height;
      bgSprite.width = w;
      bgSprite.height = h;
      const bctx = bgSprite.getContext("2d")!;
      const bg = bctx.createRadialGradient(w / 2, h * 0.3, 50, w / 2, h * 0.5, h * 0.8);
      bg.addColorStop(0, "#1a237e");
      bg.addColorStop(0.35, "#0d1254");
      bg.addColorStop(0.7, "#070b2e");
      bg.addColorStop(1, "#030612");
      bctx.fillStyle = bg;
      bctx.fillRect(0, 0, w, h);
    }

    function resize() {
      cvs!.width = document.documentElement.clientWidth;
      cvs!.height = document.documentElement.clientHeight;
      calcLayout();
      bakeBackground();
    }
    resize();
    // Debounce so iOS URL-bar/pull-to-refresh gestures (which fire rapid
    // resize events) don't cause the board to visibly stretch.
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;
    const debouncedResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", debouncedResize);

    let animId: number;

    function loop() {
      animId = requestAnimationFrame(loop);
      const now = performance.now();
      const s = stateRef.current;
      const { W, H } = s;

      // Background — baked once per resize, cheap bitmap copy per frame
      ctx.drawImage(bgSprite, 0, 0);

      if (s.balls.length === 0) {
        const pulse = Math.sin(now * 0.004) * 0.3 + 0.7;
        // Pre-baked sprite — drawImage + globalAlpha instead of per-frame
        // shadowBlur=15 which was forcing a full-canvas GPU blur pass
        // every single frame while idle.
        ctx.globalAlpha = pulse * 0.6;
        ctx.drawImage(idleGlowSprite, W / 2 - IDLE_SPRITE_W / 2, s.startY - 47 - 6);
        ctx.globalAlpha = 1;
      }

      // Pegs — two-pass draw to minimize globalAlpha thrashing:
      //   pass 1: draw every peg dot at alpha=1
      //   pass 2: draw only glowing pegs' halos (alpha varies)
      // globalAlpha is set at most 3 times total (start of each pass + reset)
      // instead of 2× per glowing peg per frame.
      for (const peg of s.pegs) {
        peg.glow *= 0.9;
        const visR = peg.r + 0.5;
        const hitR = visR + peg.glow * 1.5;
        ctx.drawImage(pegSprite, peg.x - hitR, peg.y - hitR, hitR * 2, hitR * 2);
      }
      for (const peg of s.pegs) {
        if (peg.glow <= 0.05) continue;
        const visR = peg.r + 0.5;
        const haloR = visR * 4;
        ctx.globalAlpha = peg.glow;
        ctx.drawImage(glowSprite, peg.x - haloR, peg.y - haloR, haloR * 2, haloR * 2);
      }
      ctx.globalAlpha = 1;

      // Slots — two-pass draw to minimize globalAlpha thrashing
      for (let i = 0; i < s.slots.length; i++) {
        const sl = s.slots[i];
        sl.glow *= 0.94;
        if (sl.sprite) ctx.drawImage(sl.sprite, Math.round(sl.x), Math.round(sl.y));
      }
      for (let i = 0; i < s.slots.length; i++) {
        const sl = s.slots[i];
        if (sl.glow <= 0.05) continue;
        const sx = Math.round(sl.x);
        const sy = Math.round(sl.y);
        const sw = Math.round(sl.w);
        const sh = Math.round(sl.h);
        const cx2 = sx + sw / 2;
        const cy2 = sy + sh / 2;
        const haloR = Math.max(sw, sh) * 1.8;
        ctx.globalAlpha = sl.glow * 0.8;
        ctx.drawImage(glowSprite, cx2 - haloR, cy2 - haloR, haloR * 2, haloR * 2);
        ctx.globalAlpha = sl.glow * 0.55;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(sx + 1, sy, sw - 2, sh);
      }
      ctx.globalAlpha = 1;

      // Balls — path-based animation. Ball fillStyle is constant, hoisted
      // out of the per-ball draw loop to skip redundant state writes.
      if (s.balls.length > 0) ctx.fillStyle = "#FFE500";
      for (let i = s.balls.length - 1; i >= 0; i--) {
        const b = s.balls[i];
        if (!b.alive) { s.balls.splice(i, 1); continue; }

        if (!b.settled) {
          // Plinko physics: ball falls under real gravity, bounces off pegs
          // with energy-retained reflection + random scatter. The generated
          // `path`'s FINAL waypoint is the server-determined slot, used only
          // as a gentle attractor in the bottom approach zone so the ball
          // eventually arrives where it has to — but across most of its
          // flight it's free to bounce chaotically like a real Plinko ball.
          const GRAVITY = 0.35;       // gentler gravity — less bullet-like
          const MAX_VY = 7.5;         // slower terminal speed (was 10)
          const RESTITUTION = 0.30;   // low bounce energy so hits barely deflect (was 0.42)
          const MAX_BOUNCE_UP = 2.5;
          const AIR = 0.995;
          const WALL_BOUNCE = 0.40;
          const JITTER_X = 0.45;      // much less random scatter (was 1.2)
          const JITTER_Y = 0.18;
          const lastWp = b.path[b.path.length - 1];
          const targetSlot = s.slots[b.data.slotIndex] || null;

          // Vertical gravity
          b.vy = Math.min(MAX_VY, b.vy + GRAVITY);

          // Gentle air resistance — lets bounces preserve most of their energy
          b.vx *= AIR;

          // Guidance — continuous pull toward target column throughout
          // the entire fall (ramped by depth) so the ball trends toward
          // its slot from early on, not zigzagging across the board.
          const topY = s.startY;
          const bottomY = s.startY + ROWS * s.gapY;
          const fallFrac = Math.max(0, Math.min(1, (b.y - topY) / (bottomY - topY)));
          const dxToTarget = lastWp.x - b.x;

          if (b.y < bottomY) {
            // In-triangle: constant pull with depth-ramped strength.
            // Pegs still deflect via collision reflection below.
            const pull = 0.004 + fallFrac * 0.030;     // 0.004 at top → 0.034 at bottom
            b.vx += dxToTarget * pull;
            // Cap vx so even a far-off ball can't dart across sideways.
            // Allowed speed grows slightly with depth for the final approach.
            const maxVx = 1.4 + fallFrac * 1.6;        // 1.4 → 3.0 px/frame
            if (b.vx > maxVx) b.vx = maxVx;
            else if (b.vx < -maxVx) b.vx = -maxVx;
          } else {
            // LOCK ZONE — below last peg row, ball MUST stay within its
            // target slot's column. Clamp x strictly, zero vx, cap vy.
            // No more bouncing, no more peg deflections (peg collisions
            // are spatially above this zone anyway). Ball falls straight.
            if (targetSlot) {
              const minX = targetSlot.x + b.r;
              const maxX = targetSlot.x + targetSlot.w - b.r;
              if (b.x < minX) b.x = minX;
              else if (b.x > maxX) b.x = maxX;
            }
            b.vx = 0;
            if (b.vy > 4.5) b.vy = 4.5;
          }

          // Integrate velocity
          b.x += b.vx;
          b.y += b.vy;

          // Triangle-wall containment — ball cannot escape out the angled
          // sides of the peg field. Interpolates the wall X at current Y
          // and bounces if the ball crosses it.
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

          // ── Peg collisions (circle vs circle) ──
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
            // Push ball outside the peg with a tiny cushion so it can't re-collide next frame
            const overlap = minDist - dist + 0.5;
            b.x += nx * overlap;
            b.y += ny * overlap;
            const vDotN = b.vx * nx + b.vy * ny;
            if (vDotN < 0) {
              // Reflect with restitution (energy loss)
              b.vx -= (1 + RESTITUTION) * vDotN * nx;
              b.vy -= (1 + RESTITUTION) * vDotN * ny;
              // Scatter
              b.vx += (Math.random() - 0.5) * 2 * JITTER_X;
              b.vy += (Math.random() - 0.5) * 2 * JITTER_Y;
              // Cap upward bounce so the ball doesn't pop too high
              if (b.vy < -MAX_BOUNCE_UP) b.vy = -MAX_BOUNCE_UP;
              peg.glow = 1;
              playPegSfx();
            }
          }

          // Settle: once Y reaches the final waypoint, lock Y and ease X
          // to the exact slot center so the outcome is guaranteed.
          const last = b.path[b.path.length - 1];
          if (b.y >= last.y) {
            b.y = last.y;
            b.vy = 0;
            b.x += (last.x - b.x) * 0.28;
            if (Math.abs(b.x - last.x) < 1.2) {
              b.x = last.x;
              b.settled = true;
              for (const sl of s.slots) {
                if (b.x >= sl.x && b.x <= sl.x + sl.w) { sl.glow = 1; break; }
              }
              if (typeof (b as any)._onSettle === "function") (b as any)._onSettle();
              setTimeout(() => { b.alive = false; }, 500);
            }
          }

        }

        // Draw ball — flat welcome-page yellow (fillStyle hoisted above)
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Particles — plain circles, no transform matrix math per particle
      const pList = particlesRef.current;
      if (pList.length) {
        const GRAVITY = 0.18;
        let writeIdx = 0;
        for (let i = 0; i < pList.length; i++) {
          const p = pList[i];
          p.vy += GRAVITY;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= 1;
          if (p.life <= 0 || p.y > s.H + 20) continue;
          pList[writeIdx++] = p;
          ctx.globalAlpha = Math.max(0, Math.min(1, p.life / p.maxLife));
          ctx.fillStyle = p.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
          ctx.fill();
        }
        pList.length = writeIdx;
        ctx.globalAlpha = 1;
      }
    }
    loop();

    return () => {
      window.removeEventListener("resize", debouncedResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      cancelAnimationFrame(animId);
    };
  }, [calcLayout]);

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
    // Block drops while win animation is playing (ref — reading this
    // from the showWinAnimRef instead of state so handleDrop stays
    // stable when showWinAnim toggles, letting the memoized bottom UI
    // skip re-renders on win-animation transitions).
    if (showWinAnimRef.current) return;

    // Deduct locally for instant UI feedback
    setBalance((prev) => prev - betAmount);
    pendingBallsRef.current++;
    dropCount.current++;

    const currentRisk = risk;
    const currentBet = betAmount;

    // Fire API immediately (parallel — no queue)
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

      // Map server result to slot: WIN → random green slot, LOSE → random red slot
      const mults = MULTIPLIERS[currentRisk];
      const won = serverResult.totalWin > 0;
      let closestIdx: number;
      if (won) {
        // Pick a random WIN slot (indices where mult > 0)
        const winSlots = mults.map((m, i) => ({ m, i })).filter(s => s.m > 0);
        closestIdx = winSlots[Math.floor(Math.random() * winSlots.length)].i;
      } else {
        // Pick a random LOSE slot (indices where mult === 0), prefer ones near center
        const loseSlots = mults.map((m, i) => ({ m, i })).filter(s => s.m === 0);
        closestIdx = loseSlots[Math.floor(Math.random() * loseSlots.length)].i;
      }

      const data: DropResult = {
        slotIndex: closestIdx,
        multiplier: mults[closestIdx],
        winAmount: serverResult.totalWin,
        risk: currentRisk,
      };

      const s = stateRef.current;
      const ballR = Math.max(8, s.W * 0.015);
      const startX = s.W / 2 + (Math.random() - 0.5) * s.gapX * 0.4;
      const path = generateBallPath(startX, s.startY, data.slotIndex, s.pegs, s.slots, s.gapX, s.gapY, ROWS);
      const ball: Ball = {
        x: startX,
        y: s.startY - 30,
        vx: 0,
        vy: 2 + Math.random() * 1, // small initial drop velocity
        segIdx: 0,
        r: ballR,
        alive: true, settled: false,
        trail: [], targetSlot: data.slotIndex,
        data,
        path,
      };

      (ball as any)._onSettle = () => {
        pendingBallsRef.current--;
        // Show win effects
        if (serverResult.totalWin > 0) {
          storeCash(serverResult.newBalance);
        }
        if (serverResult.totalWin > 0 && serverResult.won) {
          setWinAmount(serverResult.totalWin);
          spawnParticles(serverResult.bonusWin > 20 ? 50 : 20, serverResult.bonusWin > 20);
          // Trigger the new fancy win animation overlay + audio
          setWinAnimAmount(serverResult.totalWin);
          setShowWinAnim(true);
          playWinAudio();
        }
        // Shield milestone reward — queue for next settle if win is playing
        if (serverResult.rewards?.shield) {
          setShieldCount((c) => c + 1);
          if (serverResult.won) {
            pendingShieldRef.current = true;
          } else {
            setShowShieldAnim(true);
          }
        }
        // Attack card milestone reward — queue similarly
        if (serverResult.rewards?.card) {
          setAttackCards((c) => c + 1);
          if (serverResult.won || serverResult.rewards?.shield) {
            pendingCardRef.current = true;
          } else {
            setShowCardAnim(true);
          }
        }
        // Show queued animations if no win animation this time
        if (!serverResult.won && pendingShieldRef.current) {
          pendingShieldRef.current = false;
          setShowShieldAnim(true);
        }
        if (!serverResult.won && !pendingShieldRef.current && pendingCardRef.current) {
          pendingCardRef.current = false;
          setShowCardAnim(true);
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

      s.balls.push(ball);
    }).catch((err: any) => {
      // API failed — restore the local deduction
      console.error("Drop API error:", err.message);
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
        <div className="bg-white/[0.08] backdrop-blur-2xl border border-white/10 rounded-[22px] px-5 py-2 flex flex-col items-center gap-px">
          <div className="flex items-center gap-1.5 font-bold text-[17px] text-white" style={{ fontFamily: "var(--font-outfit)" }}>
            <img src="/images/coin-icon.png" alt="coin" width={16} height={16} style={{ objectFit: "contain" }} />
            {betAmount > 0 ? betAmount : "—"}
          </div>
          <span className="text-[10px] text-white/[0.45] font-medium uppercase tracking-wider" style={{ fontFamily: "var(--font-dm-sans)" }}>Lucky Drop</span>
        </div>
        <div className="flex items-center gap-1.5">
          {/* Attack cards */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 border border-white/[0.08]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FF6B6B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
            <span className="text-white text-[12px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{attackCards}</span>
          </div>
          {/* Shields */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 border border-white/[0.08]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/shield.png" alt="" width={14} height={14} style={{ objectFit: "contain" }} />
            <span className="text-white text-[12px] font-bold" style={{ fontFamily: "var(--font-outfit)" }}>{shieldCount}</span>
          </div>
        </div>
      </div>

      {/* Risk selector removed — single mode */}

      {/* Win animation overlay — coin/bill rain + slot counter ramping to winAmount */}
      <WinAnimation
        show={showWinAnim}
        amount={winAnimAmount}
        onDone={() => { setShowWinAnim(false); stopWinAudio(); }}
      />

      {/* Shield jackpot reveal animation */}
      {showShieldAnim && (
        <ShieldJackpotReveal onDone={() => {
          setShowShieldAnim(false);
          // Show queued card animation after shield finishes
          if (pendingCardRef.current) {
            pendingCardRef.current = false;
            setShowCardAnim(true);
          }
        }} />
      )}

      {showCardAnim && (
        <AttackCardReveal onDone={() => setShowCardAnim(false)} />
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

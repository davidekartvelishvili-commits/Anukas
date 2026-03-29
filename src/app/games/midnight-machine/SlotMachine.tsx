// ============================================
// Covrd 3D Slot Machine — Three.js Component
// File: app/spin/SlotMachine.tsx
// ============================================
"use client";

import { useEffect, useRef, useCallback } from "react";
import * as THREE from "three";
import { SYMBOLS, type SlotSymbol } from "./slot-config";

// ── Types ──
interface SlotMachineProps {
  onSpinStart?: () => void;
  onSpinEnd?: (result: { symbols: string[]; winType: string; winAmount: number }) => void;
  spinTrigger: number; // Increment to trigger spin
  targetSymbols: [string, string, string] | null;
}

// ── Helpers ──
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Reel Texture Generator ──
function createReelTexture(symbolOrder: SlotSymbol[]): THREE.CanvasTexture {
  const cellH = 256;
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = cellH * symbolOrder.length;
  const ctx = canvas.getContext("2d")!;

  symbolOrder.forEach((sym, i) => {
    const y = i * cellH;

    // Cell background
    const bg = ctx.createLinearGradient(0, y, 0, y + cellH);
    bg.addColorStop(0, "#161636");
    bg.addColorStop(0.3, "#0e0e28");
    bg.addColorStop(0.7, "#0e0e28");
    bg.addColorStop(1, "#161636");
    ctx.fillStyle = bg;
    ctx.fillRect(0, y, 256, cellH);

    // Separator lines
    ctx.strokeStyle = "rgba(90,110,240,0.22)";
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(8, y + 1); ctx.lineTo(248, y + 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, y + cellH - 1); ctx.lineTo(248, y + cellH - 1); ctx.stroke();

    // Radial glow
    const glow = ctx.createRadialGradient(128, y + cellH / 2, 8, 128, y + cellH / 2, 100);
    glow.addColorStop(0, sym.color + "44");
    glow.addColorStop(0.5, sym.color + "18");
    glow.addColorStop(1, "transparent");
    ctx.fillStyle = glow;
    ctx.fillRect(0, y, 256, cellH);

    // Draw symbol
    ctx.save();
    if (sym.name === "Covrd") {
      ctx.font = "900 82px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = sym.glowColor;
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#FFD700";
      ctx.fillText("C", 128, y + cellH / 2);
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(128, y + cellH / 2, 50, 0, Math.PI * 2);
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = "#FFD700";
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(128, y + cellH / 2, 30, 0.5, Math.PI * 1.5);
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = "#FFA000";
      ctx.stroke();
    } else if (sym.name === "Seven") {
      ctx.font = "900 90px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = sym.glowColor;
      ctx.shadowBlur = 25;
      ctx.fillStyle = sym.color;
      ctx.fillText("7", 128, y + cellH / 2);
      ctx.shadowBlur = 12;
      ctx.strokeStyle = sym.color + "99";
      ctx.lineWidth = 2;
      ctx.strokeText("7", 128, y + cellH / 2);
      ctx.font = "700 28px sans-serif";
      ctx.fillStyle = sym.color + "88";
      ctx.fillText("$", 128, y + cellH / 2 + 48);
    } else {
      ctx.font = "82px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = sym.glowColor;
      ctx.shadowBlur = 20;
      ctx.fillText(sym.emoji, 128, y + cellH / 2);
    }
    ctx.restore();

    // Neon box border
    ctx.save();
    ctx.shadowColor = sym.color;
    ctx.shadowBlur = 8;
    ctx.strokeStyle = sym.color + "30";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(20, y + 12, 216, cellH - 24);
    ctx.restore();
  });

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.LinearFilter;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.needsUpdate = true;
  return tex;
}

// ── Reel Class ──
class Reel {
  mesh: THREE.Mesh;
  order: SlotSymbol[];
  spinning = false;
  settled = false;
  curOff = 0;
  tgtOff = 0;
  stOff = 0;
  spinStart = 0;
  dur: number;
  delay: number;
  idx: number;
  tgtIdx = 0;

  constructor(scene: THREE.Scene, xPos: number, delay: number, idx: number) {
    this.delay = delay;
    this.idx = idx;
    this.dur = 2200 + delay;
    this.order = shuffleArray(SYMBOLS);

    const geo = new THREE.CylinderGeometry(1.05, 1.05, 1.15, 48, 1, true);
    const tex = createReelTexture(this.order);

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      metalness: 0.55,
      roughness: 0.35,
      side: THREE.DoubleSide,
      emissiveMap: tex,
      emissive: new THREE.Color(0x1a1a40),
      emissiveIntensity: 0.35,
    });

    this.mesh = new THREE.Mesh(geo, mat);
    this.mesh.rotation.z = Math.PI / 2;
    this.mesh.position.set(xPos, 0, 0);
    scene.add(this.mesh);

    // End caps + neon rings
    const capMat = new THREE.MeshStandardMaterial({ color: 0x141430, metalness: 0.85, roughness: 0.15 });
    const capGeo = new THREE.CircleGeometry(1.05, 48);
    const ringMat = new THREE.MeshStandardMaterial({ color: 0x5c6bc0, emissive: 0x3d5afe, emissiveIntensity: 2.5 });
    const innerRingMat = new THREE.MeshStandardMaterial({ color: 0x7c4dff, emissive: 0x7c4dff, emissiveIntensity: 1.5, transparent: true, opacity: 0.5 });

    ([-0.59, 0.59] as const).forEach((offset) => {
      const rotY = offset < 0 ? -Math.PI / 2 : Math.PI / 2;
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(xPos + offset, 0, 0);
      cap.rotation.y = rotY;
      scene.add(cap);

      const ring = new THREE.Mesh(new THREE.TorusGeometry(1.06, 0.018, 8, 64), ringMat);
      ring.position.copy(cap.position);
      ring.rotation.y = Math.PI / 2;
      scene.add(ring);

      const innerRing = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.012, 8, 48), innerRingMat);
      innerRing.position.set(xPos + offset, 0, 0);
      innerRing.rotation.y = Math.PI / 2;
      scene.add(innerRing);
    });
  }

  spin(targetName: string) {
    this.tgtIdx = this.order.findIndex((s) => s.name === targetName);
    if (this.tgtIdx === -1) this.tgtIdx = 0;
    this.spinning = true;
    this.settled = false;
    this.spinStart = performance.now();
    this.stOff = this.curOff;
    const extraSpins = 3 + this.idx + Math.random() * 1.5;
    this.tgtOff = this.stOff + extraSpins + this.tgtIdx / this.order.length;
  }

  update(now: number) {
    if (!this.spinning) return;
    const elapsed = now - this.spinStart;
    if (elapsed < this.delay) return;

    const t = Math.min((elapsed - this.delay) / (this.dur - this.delay), 1);

    // Back-ease-out (slight overshoot then settle)
    const c1 = 1.15;
    const c3 = c1 + 1;
    const eased = t < 1 ? 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2) : 1;

    this.curOff = this.stOff + (this.tgtOff - this.stOff) * eased;
    const uv = this.curOff % 1;

    const mat = this.mesh.material as THREE.MeshStandardMaterial;
    if (mat.map) mat.map.offset.y = uv;
    if (mat.emissiveMap) mat.emissiveMap.offset.y = uv;

    if (t >= 1 && !this.settled) {
      this.settled = true;
      this.spinning = false;
      const finalUV = (this.tgtIdx / this.order.length) % 1;
      this.curOff = this.tgtOff;
      if (mat.map) mat.map.offset.y = finalUV;
      if (mat.emissiveMap) mat.emissiveMap.offset.y = finalUV;
    }
  }
}

// ═══════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════
export default function SlotMachine({ spinTrigger, targetSymbols, onSpinStart, onSpinEnd }: SlotMachineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    reels: Reel[];
    leverGroup: THREE.Group;
    leverAngle: number;
    leverTarget: number;
    neonMat: THREE.MeshStandardMaterial;
    cyanMat: THREE.MeshStandardMaterial;
    paylineMat: THREE.MeshStandardMaterial;
    purpleLight: THREE.PointLight;
    cyanLight: THREE.PointLight;
    isSpinning: boolean;
    animId: number;
  } | null>(null);

  const prevTrigger = useRef(0);

  // ── Initialize Scene ──
  useEffect(() => {
    if (!containerRef.current) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 0.15, 6);
    camera.lookAt(0, -0.1, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.3;
    renderer.outputEncoding = THREE.sRGBEncoding;
    containerRef.current.appendChild(renderer.domElement);

    // Background
    const bgCanvas = document.createElement("canvas");
    bgCanvas.width = bgCanvas.height = 512;
    const bgCtx = bgCanvas.getContext("2d")!;
    const bgGrad = bgCtx.createRadialGradient(256, 170, 30, 256, 300, 420);
    bgGrad.addColorStop(0, "#1a237e");
    bgGrad.addColorStop(0.35, "#0d1254");
    bgGrad.addColorStop(0.7, "#070b2e");
    bgGrad.addColorStop(1, "#030612");
    bgCtx.fillStyle = bgGrad;
    bgCtx.fillRect(0, 0, 512, 512);
    scene.background = new THREE.CanvasTexture(bgCanvas);

    // Lighting
    scene.add(new THREE.AmbientLight(0x2a3050, 0.5));
    const keyLight = new THREE.DirectionalLight(0xeeeeff, 0.7);
    keyLight.position.set(1, 3, 4);
    scene.add(keyLight);

    const purpleLight = new THREE.PointLight(0x7c4dff, 2, 12);
    purpleLight.position.set(-3.5, 0.5, 2.5);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x00e5ff, 2, 12);
    cyanLight.position.set(3.5, 0.5, 2.5);
    scene.add(cyanLight);

    scene.add(new THREE.PointLight(0x304ffe, 1, 8).translateX(0).translateY(-2.5).translateZ(2));

    const spot = new THREE.SpotLight(0xffffff, 0.4, 10, Math.PI / 6, 0.5);
    spot.position.set(0, 5, 3);
    spot.target.position.set(0, 0, 0);
    scene.add(spot);
    scene.add(spot.target);

    // Reels
    const reels = [
      new Reel(scene, -1.3, 0, 0),
      new Reel(scene, 0, 250, 1),
      new Reel(scene, 1.3, 500, 2),
    ];

    // Frame
    const frameMat = new THREE.MeshStandardMaterial({ color: 0x12122e, metalness: 0.9, roughness: 0.1 });
    [1.25, -1.25].forEach((y) => {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.14, 0.35), frameMat);
      bar.position.set(0, y, 0);
      scene.add(bar);
    });
    [-2.45, 2.45].forEach((x) => {
      const pillar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.64, 0.35), frameMat);
      pillar.position.set(x, 0, 0);
      scene.add(pillar);
    });

    // Neon strips
    const neonMat = new THREE.MeshStandardMaterial({ color: 0x7c4dff, emissive: 0x7c4dff, emissiveIntensity: 3 });
    const cyanMat = new THREE.MeshStandardMaterial({ color: 0x00e5ff, emissive: 0x00e5ff, emissiveIntensity: 2.5 });

    [1.38, -1.38].forEach((y) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(5, 0.035, 0.36), neonMat);
      strip.position.set(0, y, 0);
      scene.add(strip);
    });
    [-2.53, 2.53].forEach((x) => {
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.035, 2.8, 0.36), cyanMat);
      strip.position.set(x, 0, 0);
      scene.add(strip);
    });

    // Payline
    const paylineMat = new THREE.MeshStandardMaterial({
      color: 0x00e676, emissive: 0x00e676, emissiveIntensity: 2, transparent: true, opacity: 0.5,
    });
    const payline = new THREE.Mesh(new THREE.BoxGeometry(5, 0.025, 0.38), paylineMat);
    payline.position.set(0, 0, 0.18);
    scene.add(payline);

    // Lever
    const leverGroup = new THREE.Group();
    leverGroup.position.set(2.9, 0.3, 0);
    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.05, 0.05, 1.6, 16),
      new THREE.MeshStandardMaterial({ color: 0x888899, metalness: 0.9, roughness: 0.2 })
    );
    pole.position.y = 0.3;
    leverGroup.add(pole);
    const ball = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 24, 24),
      new THREE.MeshStandardMaterial({ color: 0x222233, metalness: 0.95, roughness: 0.05 })
    );
    ball.position.y = 1.15;
    leverGroup.add(ball);
    const leverBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.12, 0.2, 16),
      new THREE.MeshStandardMaterial({ color: 0x12122e, metalness: 0.8, roughness: 0.2 })
    );
    leverBase.position.y = -0.5;
    leverGroup.add(leverBase);
    scene.add(leverGroup);

    // Reflective floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 30),
      new THREE.MeshStandardMaterial({ color: 0x060a1e, metalness: 0.98, roughness: 0.1, transparent: true, opacity: 0.45 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -2.8;
    scene.add(floor);

    // Store refs
    const state = {
      scene, camera, renderer, reels, leverGroup,
      leverAngle: 0, leverTarget: 0,
      neonMat, cyanMat, paylineMat,
      purpleLight, cyanLight,
      isSpinning: false, animId: 0,
    };
    sceneRef.current = state;

    // Animation loop
    function animate() {
      state.animId = requestAnimationFrame(animate);
      const now = performance.now();

      state.reels.forEach((r) => r.update(now));

      // Lever
      state.leverAngle += (state.leverTarget - state.leverAngle) * 0.12;
      state.leverGroup.rotation.z = state.leverAngle;

      // Idle sway
      const sway = state.isSpinning ? 0.02 : 0.1;
      state.camera.position.x = Math.sin(now * 0.00025) * sway;
      state.camera.position.y = 0.15 + Math.sin(now * 0.0004) * 0.04;

      // Pulse lights
      state.purpleLight.intensity = 2 + Math.sin(now * 0.0018) * 0.4;
      state.cyanLight.intensity = 2 + Math.cos(now * 0.0018) * 0.4;

      // Payline pulse
      if (!state.isSpinning) {
        state.paylineMat.opacity = 0.35 + Math.sin(now * 0.003) * 0.15;
      }

      renderer.render(scene, camera);
    }
    animate();

    // Resize
    const onResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(state.animId);
      renderer.dispose();
      containerRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // ── Handle Spin Trigger ──
  useEffect(() => {
    const state = sceneRef.current;
    if (!state || !targetSymbols || spinTrigger === prevTrigger.current) return;
    prevTrigger.current = spinTrigger;

    if (state.isSpinning) return;
    state.isSpinning = true;
    onSpinStart?.();

    // Animate lever
    state.leverTarget = -0.6;
    setTimeout(() => { state.leverTarget = 0; }, 400);

    // Spin reels toward server-determined targets
    state.reels.forEach((reel, i) => {
      reel.spin(targetSymbols[i]);
    });

    // After animation completes
    setTimeout(() => {
      state.isSpinning = false;

      // Flash neon
      let flashCount = 0;
      const interval = setInterval(() => {
        const bright = flashCount % 2 === 0;
        state.neonMat.emissiveIntensity = bright ? 8 : 3;
        state.cyanMat.emissiveIntensity = bright ? 7 : 2.5;
        state.paylineMat.emissiveIntensity = bright ? 6 : 2;
        state.paylineMat.opacity = bright ? 0.9 : 0.5;
        flashCount++;
        if (flashCount >= 8) {
          clearInterval(interval);
          state.neonMat.emissiveIntensity = 3;
          state.cyanMat.emissiveIntensity = 2.5;
          state.paylineMat.emissiveIntensity = 2;
          state.paylineMat.opacity = 0.5;
        }
      }, 130);

      onSpinEnd?.({
        symbols: targetSymbols,
        winType: "none", // Parent determines this from API response
        winAmount: 0,
      });
    }, 3300);
  }, [spinTrigger, targetSymbols, onSpinStart, onSpinEnd]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{ touchAction: "none" }}
    />
  );
}

"use client";

import { useMemo, useRef, useEffect, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, RoundedBox } from "@react-three/drei";
import * as THREE from "three";

// Patch a known @react-three/fiber 8 + React 18 StrictMode bug:
// OrbitControls calls releasePointerCapture(id) on cleanup for a pointer
// that was never captured, raising "NotFoundError: Invalid pointer id".
// Swallow that specific case once at module load.
if (typeof window !== "undefined") {
  const proto = Element.prototype as Element & {
    __rpcPatched?: boolean;
    releasePointerCapture: (pointerId: number) => void;
  };
  if (!proto.__rpcPatched) {
    const orig = proto.releasePointerCapture;
    proto.releasePointerCapture = function (pointerId: number) {
      try {
        return orig.call(this, pointerId);
      } catch (e) {
        if (e instanceof DOMException && e.name === "NotFoundError") return;
        throw e;
      }
    };
    proto.__rpcPatched = true;
  }
}

const ROTATION_SPEED = 0.005;

// Resolve the real font-family that var(--font-outfit) maps to (Next.js
// generates a hashed name). Canvas 2D doesn't understand CSS variables, so
// without this probe ctx.font falls back to a system font that may not
// contain the Georgian Lari glyph (₾, U+20BE), rendering it as a tofu/?.
function resolveOutfitFontFamily(): string {
  if (typeof document === "undefined") {
    return '"Outfit", system-ui, "Segoe UI", sans-serif';
  }
  const probe = document.createElement("div");
  probe.style.cssText =
    "position:absolute;left:-9999px;top:-9999px;visibility:hidden;font-family:var(--font-outfit);";
  document.body.appendChild(probe);
  const resolved = getComputedStyle(probe).fontFamily;
  probe.remove();
  // Append fallbacks that ship with most OSes and contain ₾
  return `${resolved || '"Outfit"'}, system-ui, "Segoe UI", "Helvetica Neue", Arial, sans-serif`;
}

type FaceOpts = {
  bg: string;
  bgEnd?: string;
  color: string;
  symbol: string;
  glow: string;
  borderColor: string;
  fontFamily: string;
};

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function makeFaceTexture(opts: FaceOpts): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  if (opts.bgEnd) {
    const g = ctx.createLinearGradient(0, 0, size, size);
    g.addColorStop(0, opts.bg);
    g.addColorStop(1, opts.bgEnd);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = opts.bg;
  }
  ctx.fillRect(0, 0, size, size);

  const pad = 32;
  ctx.strokeStyle = opts.borderColor;
  ctx.lineWidth = 6;
  roundRect(ctx, pad, pad, size - pad * 2, size - pad * 2, 44);
  ctx.stroke();

  ctx.fillStyle = opts.color;
  ctx.shadowColor = opts.glow;
  ctx.shadowBlur = 70;
  ctx.font = `900 320px ${opts.fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(opts.symbol, size / 2, size / 2 + 16);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

function CubeMesh() {
  const ref = useRef<THREE.Mesh>(null);
  // Bumped after document.fonts.ready resolves so textures regenerate using
  // the now-loaded Outfit web font.
  const [fontVersion, setFontVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const ready = (document as Document & { fonts?: { ready: Promise<unknown> } }).fonts?.ready;
    if (ready) {
      ready
        .then(() => {
          if (!cancelled) setFontVersion((v) => v + 1);
        })
        .catch(() => {});
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const materials = useMemo(() => {
    const fontFamily = resolveOutfitFontFamily();

    const front = makeFaceTexture({
      bg: "#1A1A1A",
      bgEnd: "#2D2D2D",
      color: "#FFE500",
      glow: "rgba(255,229,0,0.85)",
      symbol: "₾",
      borderColor: "#3A3A3A",
      fontFamily,
    });
    const back = makeFaceTexture({
      bg: "#1A1A1A",
      color: "#00E88F",
      glow: "rgba(0,232,143,0.7)",
      symbol: "₾",
      borderColor: "#333",
      fontFamily,
    });
    const right = makeFaceTexture({
      bg: "#1A1A1A",
      bgEnd: "#222",
      color: "#FFB800",
      glow: "rgba(255,184,0,0.7)",
      symbol: "?",
      borderColor: "#333",
      fontFamily,
    });
    const left = makeFaceTexture({
      bg: "#222",
      bgEnd: "#1A1A1A",
      color: "#A855F7",
      glow: "rgba(168,85,247,0.7)",
      symbol: "?",
      borderColor: "#333",
      fontFamily,
    });

    return [
      new THREE.MeshBasicMaterial({ map: right }),
      new THREE.MeshBasicMaterial({ map: left }),
      new THREE.MeshBasicMaterial({ color: "#222" }),
      new THREE.MeshBasicMaterial({ color: "#111" }),
      new THREE.MeshBasicMaterial({ map: front }),
      new THREE.MeshBasicMaterial({ map: back }),
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fontVersion]);

  useEffect(() => {
    return () => {
      materials.forEach((m) => {
        if (m.map) m.map.dispose();
        m.dispose();
      });
    };
  }, [materials]);

  useFrame(() => {
    if (ref.current) {
      ref.current.rotation.x += ROTATION_SPEED * 0.4;
      ref.current.rotation.y += ROTATION_SPEED;
    }
  });

  return (
    <RoundedBox
      ref={ref}
      args={[1.25, 1.25, 1.25]}
      radius={0.18}
      smoothness={6}
      bevelSegments={6}
      creaseAngle={0.4}
      material={materials}
    />
  );
}

export default function MysteryCube({ interactive = true }: { interactive?: boolean }) {
  return (
    <div
      className="w-full h-full"
      style={interactive ? undefined : { pointerEvents: "none" }}
      onClick={interactive ? (e) => e.stopPropagation() : undefined}
      onPointerDown={interactive ? (e) => e.stopPropagation() : undefined}
    >
      <Canvas
        camera={{ position: [2.2, 1.6, 3], fov: 32 }}
        dpr={[1, 2]}
        gl={{ alpha: true, antialias: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={1} />
        <CubeMesh />
        {interactive && (
          <OrbitControls
            enableZoom={false}
            enablePan={false}
            enableDamping
            dampingFactor={0.12}
            rotateSpeed={0.8}
          />
        )}
      </Canvas>
    </div>
  );
}

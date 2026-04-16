"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const Y = "#F9E741";

function Stripes() {
  return (
    <svg width="100%" height="12" style={{ display: "block" }}>
      <defs>
        <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="14" height="12" patternTransform="rotate(-45)">
          <rect width="7" height="12" fill={Y} opacity="0.9" />
        </pattern>
      </defs>
      <rect width="100%" height="12" fill="url(#stripe-pattern)" />
    </svg>
  );
}

function Notch({ side }: { side: "left" | "right" }) {
  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        [side]: -13,
        transform: "translateY(-50%)",
        width: 26,
        height: 26,
        borderRadius: "50%",
        background: "#000000",
        zIndex: 5,
      }}
    />
  );
}

export interface TicketData {
  id: string;
  // ── Front (public info) ──
  emoji: string;
  logoUrl?: string | null;
  category: string;
  title: string;
  titleKa: string;
  brand: string;
  validity: string;
  type: string;
  price: string;
  bonus: string;
  personName: string;
  // ── Back (sensitive — only revealed after activation) ──
  screen?: string;
  row?: string;
  seat?: string;
  serial: string;
  social?: string;
  terms: string[];
  website: string;
}

const TICKET_HEIGHT = 420;

export default function Ticket({
  data,
  qrCode,
  used,
  onActivate,
}: {
  data: TicketData;
  /** Real QR payload to encode. Supplied by the backend after activation. */
  qrCode?: string;
  /** True when the merchant has redeemed this ticket — renders the
   *  bent/torn used-state visual. */
  used?: boolean;
  onActivate?: () => void;
}) {
  const [back, setBack] = useState(!!used); // used tickets default to back
  const [activated, setActivated] = useState(!!qrCode || !!used);
  const [qrDataUrl, setQrDataUrl] = useState<string>("");

  // Generate real QR image from the payload whenever it changes
  useEffect(() => {
    if (!qrCode) { setQrDataUrl(""); return; }
    let cancelled = false;
    QRCode.toDataURL(qrCode, { margin: 0, width: 200, color: { dark: "#111111", light: "#ffffff" } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(""); });
    return () => { cancelled = true; };
  }, [qrCode]);

  const handleActivate = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (activated) return;
    setActivated(true);
    setBack(true); // flip to reveal the back after activation
    onActivate?.();
  };

  return (
    <div style={{ width: 290 }}>
      {/* Ticket card (fixed height) */}
      <div
        onClick={() => setBack((b) => !b)}
        style={{
          width: 290,
          height: TICKET_HEIGHT,
          background: "#fff",
          borderRadius: 16,
          overflow: "hidden",
          cursor: "pointer",
          position: "relative",
          boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
          userSelect: "none",
          WebkitUserSelect: "none",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {!back ? (
          /* ───── FRONT — public info only ───── */
          <>
            <Stripes />
            <div style={{ padding: "18px 24px 12px", flex: 1, display: "flex", flexDirection: "column" }}>
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 10,
                    border: "1.5px solid #e8e8e8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 26,
                    background: "#fafafa",
                    overflow: "hidden",
                  }}
                >
                  {data.logoUrl ? (
                    <img
                      src={data.logoUrl}
                      alt=""
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      draggable={false}
                    />
                  ) : (
                    data.emoji
                  )}
                </div>
                <div
                  style={{
                    background: Y,
                    color: "#000",
                    fontSize: 9,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    padding: "4px 9px",
                    borderRadius: 4,
                    fontFamily: "'DM Mono', monospace",
                    textTransform: "uppercase",
                  }}
                >
                  {data.brand}
                </div>
              </div>

              <div style={{ fontSize: 10, color: "#aaa", letterSpacing: "0.18em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                {data.category}
              </div>

              <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 14 }}>
                {data.title}
                <br />
                <span style={{ fontSize: 15, fontWeight: 600 }}>{data.titleKa}</span>
              </div>

              {/* Validity + Type grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px 0", marginTop: "auto" }}>
                <div>
                  <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>მოქმედებს</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{data.validity}</div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>ტიპი</div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>{data.type}</div>
                </div>
              </div>

              {/* "Person" line (public — name as cardholder) */}
              <div style={{ marginTop: 10, fontSize: 10, color: "#bbb", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em", textAlign: "center" }}>
                {data.personName.toUpperCase()}
              </div>
            </div>

            {/* Tear line */}
            <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center", flexShrink: 0 }}>
              <Notch side="left" />
              <Notch side="right" />
              <div
                style={{
                  flex: 1,
                  marginLeft: 13,
                  marginRight: 13,
                  height: 1,
                  backgroundImage: "repeating-linear-gradient(90deg,#ddd 0,#ddd 6px,transparent 6px,transparent 13px)",
                }}
              />
            </div>

            {/* Stub */}
            <div style={{ background: Y, padding: "14px 24px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.45)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 4 }}>
                ფასი
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#000", letterSpacing: "-0.03em", lineHeight: 1 }}>{data.price}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.45)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>Cash</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#000", letterSpacing: "-0.01em", lineHeight: 1 }}>{data.bonus}</span>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* ───── BACK — sensitive info, locked until activated ───── */
          <div style={{ position: "relative", flex: 1, display: "flex", flexDirection: "column" }}>
            <Stripes />

            {/* Content wrapper — blurred until activated. Sensitive strings are also REDACTED,
                so even if somebody removes the filter via devtools, only placeholders are present in the DOM. */}
            <div
              style={{
                flex: 1,
                display: "flex",
                flexDirection: "column",
                filter: activated ? "none" : "blur(10px)",
                transition: "filter 0.4s ease",
                pointerEvents: activated ? "auto" : "none",
              }}
            >
              <div style={{ padding: "16px 24px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>
                  <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", fontFamily: "'DM Mono', monospace" }}>
                    {activated ? (data.social || "@SHANSIAPP") : "••••• ••••• •••••"}
                  </div>
                  <div style={{ fontSize: 9, fontWeight: 600, color: "#aaa", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>FOLLOW US</div>
                </div>

                {/* Sensitive seat info */}
                {(data.screen || data.row || data.seat) && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 10 }}>
                    {data.screen && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Screen</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{activated ? data.screen : "••"}</div>
                      </div>
                    )}
                    {data.row && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Row</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{activated ? data.row : "••"}</div>
                      </div>
                    )}
                    {data.seat && (
                      <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 2 }}>Seat</div>
                        <div style={{ fontSize: 15, fontWeight: 700, color: "#111" }}>{activated ? data.seat : "••"}</div>
                      </div>
                    )}
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  {(activated
                    ? data.terms
                    : Array.from({ length: Math.max(2, data.terms.length) }, () => "•••••••••••••••••••••••••••")
                  ).map((t, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#555", padding: "5px 0", borderBottom: "1px solid #f5f5f5", display: "flex", gap: 10, alignItems: "center" }}>
                      <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#111", flexShrink: 0 }} />
                      {t}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 8, fontSize: 9, color: "#ccc", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                  {activated ? data.website : "•••••••••••"}
                </div>
              </div>

              <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center", flexShrink: 0 }}>
                <Notch side="left" />
                <Notch side="right" />
                <div style={{ flex: 1, marginLeft: 13, marginRight: 13, height: 1, backgroundImage: "repeating-linear-gradient(90deg,#ddd 0,#ddd 6px,transparent 6px,transparent 13px)" }} />
              </div>

              <div style={{ background: Y, padding: "12px 24px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                    Serial
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#000", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>
                    {activated ? data.serial : "••••••••••••"}
                  </div>
                </div>
                <div style={{ width: 54, height: 54, background: "#fff", borderRadius: 8, padding: 4, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                  {activated && qrDataUrl ? (
                    // Real QR code — decoded by the merchant scanner
                    <img
                      src={qrDataUrl}
                      alt="QR"
                      style={{ width: "100%", height: "100%", display: "block", imageRendering: "pixelated" as const }}
                      draggable={false}
                    />
                  ) : (
                    // Generic placeholder pattern — NOT the real QR
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1.5, width: "100%" }}>
                      {Array.from({ length: 49 }, (_, i) => ((i * 13) % 3 === 0 ? 1 : 0)).map((v, i) => (
                        <div key={i} style={{ aspectRatio: "1", borderRadius: 1, background: v ? "#999" : "transparent" }} />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Lock overlay — shown when NOT activated */}
            {!activated && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 10,
                  background: "rgba(255,255,255,0.15)",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    width: 62,
                    height: 62,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.7)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
                  }}
                >
                  <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#FFE500" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="4" y="11" width="16" height="10" rx="2" />
                    <path d="M8 11V7a4 4 0 018 0v4" />
                    <circle cx="12" cy="16" r="1.2" fill="#FFE500" />
                  </svg>
                </div>
                <div
                  style={{
                    background: "rgba(0,0,0,0.75)",
                    color: "#FFE500",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.14em",
                    padding: "6px 12px",
                    borderRadius: 16,
                    textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  Activate to reveal
                </div>
              </div>
            )}
          </div>
        )}

        {/* USED state overlay — bottom stub appears torn off with a
            skewed perforation line + "USED" stamp. Visual only, does
            not change layout height. */}
        {used && (
          <>
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: 0,
                height: 120, // covers the yellow stub area
                pointerEvents: "none",
                overflow: "hidden",
                transform: "rotate(-1.5deg) translateY(6px)",
                transformOrigin: "left top",
                filter: "grayscale(0.55) brightness(0.85)",
              }}
            >
              {/* Faux-torn top edge */}
              <svg
                width="100%"
                height="10"
                viewBox="0 0 290 10"
                preserveAspectRatio="none"
                style={{ display: "block" }}
              >
                <path
                  d="M0,2 L8,6 L16,1 L24,7 L32,3 L40,8 L48,2 L56,6 L64,1 L72,7 L80,3 L88,8 L96,2 L104,6 L112,1 L120,7 L128,3 L136,8 L144,2 L152,6 L160,1 L168,7 L176,3 L184,8 L192,2 L200,6 L208,1 L216,7 L224,3 L232,8 L240,2 L248,6 L256,1 L264,7 L272,3 L280,8 L290,2 L290,10 L0,10 Z"
                  fill="#e6e6e6"
                />
              </svg>
              {/* Diagonal "USED" stamp */}
              <div
                style={{
                  position: "absolute",
                  top: 30,
                  left: "50%",
                  transform: "translate(-50%, 0) rotate(-14deg)",
                  color: "#b11e1e",
                  border: "3px solid #b11e1e",
                  padding: "4px 18px",
                  borderRadius: 6,
                  fontSize: 24,
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  fontFamily: "'DM Mono', monospace",
                  opacity: 0.85,
                  background: "rgba(255,255,255,0.35)",
                  textShadow: "0 0 2px rgba(255,255,255,0.4)",
                }}
              >
                USED
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activate button — hidden once the ticket has been redeemed */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleActivate}
          disabled={activated || !!used}
          className="w-[170px] h-[58px] rounded-[29px] text-[16px] font-bold active:scale-[0.96] transition-transform duration-150"
          style={{
            background: used ? "#6B7280" : activated ? "#22C55E" : "#FFE500",
            color: used ? "#E5E7EB" : "#1A1A1A",
            fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif",
            boxShadow: used
              ? "none"
              : activated
              ? "0 4px 20px rgba(34,197,94,0.35)"
              : "0 4px 20px rgba(255,229,0,0.35)",
            opacity: used ? 0.65 : activated ? 0.9 : 1,
            cursor: activated || used ? "default" : "pointer",
          }}
        >
          {used ? "Used" : activated ? "Activated ✓" : "Activate"}
        </button>
      </div>
    </div>
  );
}

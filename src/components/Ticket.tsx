"use client";

import { useState } from "react";

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
  emoji: string;
  category: string;
  title: string;
  titleKa: string;
  brand: string;
  screen?: string;
  row?: string;
  seat?: string;
  validity: string;
  type: string;
  price: string; // e.g. "2.50"
  bonus: string; // e.g. "+ 1₾"
  personName: string;
  serial: string;
  social?: string;
  terms: string[];
  website: string;
}

const TICKET_HEIGHT = 420; // Fixed height for ALL tickets (matches back side)

export default function Ticket({ data, onActivate }: { data: TicketData; onActivate?: () => void }) {
  const [back, setBack] = useState(false);

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
          /* ───── FRONT — compact, no barcode/seat grid, fills same height as back ───── */
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
                  }}
                >
                  {data.emoji}
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

              {/* Seat/row/screen as a compact text line (only if data exists) */}
              {(data.screen || data.row || data.seat) && (
                <div style={{ fontSize: 12, color: "#666", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em", marginBottom: 10 }}>
                  {[
                    data.screen && `SCREEN ${data.screen}`,
                    data.row && `ROW ${data.row}`,
                    data.seat && `SEAT ${data.seat}`,
                  ].filter(Boolean).join(" · ")}
                </div>
              )}

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

              <div style={{ fontSize: 9, color: "#ccc", fontFamily: "'DM Mono', monospace", letterSpacing: "0.25em", textAlign: "center", marginTop: 10 }}>
                SERIAL · {data.serial}
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
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: "#000", letterSpacing: "-0.03em", lineHeight: 1 }}>{data.price}</span>
                <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.45)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>Cash</span>
                  <span style={{ fontSize: 15, fontWeight: 800, color: "#000", letterSpacing: "-0.01em", lineHeight: 1 }}>{data.bonus}</span>
                </div>
              </div>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>{data.personName}</div>
            </div>
          </>
        ) : (
          /* ───── BACK ───── */
          <>
            <Stripes />
            <div style={{ padding: "16px 24px 10px", flex: 1, display: "flex", flexDirection: "column" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid #f0f0f0" }}>
                <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", fontFamily: "'DM Mono', monospace" }}>{data.social || "@SHANSIAPP"}</div>
                <div style={{ fontSize: 9, fontWeight: 600, color: "#aaa", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>FOLLOW US</div>
              </div>

              <div style={{ textAlign: "center", marginBottom: 10 }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{data.emoji}</div>
                <div style={{ fontSize: 18, fontWeight: 700, color: "#111", letterSpacing: "-0.03em" }}>{data.title.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", marginTop: 3 }}>{data.category.toUpperCase()}</div>
              </div>

              <div style={{ flex: 1 }}>
                {data.terms.map((t, i) => (
                  <div key={i} style={{ fontSize: 11, color: "#555", padding: "5px 0", borderBottom: "1px solid #f5f5f5", display: "flex", gap: 10, alignItems: "center" }}>
                    <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#111", flexShrink: 0 }} />
                    {t}
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8, fontSize: 9, color: "#ccc", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
                {data.website}
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
                  Scan to redeem
                </div>
                <div style={{ fontSize: 9, color: "rgba(0,0,0,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>Powered by SHANSI</div>
              </div>
              <div style={{ width: 54, height: 54, background: "#fff", borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1.5, width: "100%" }}>
                  {[1,1,1,1,1,1,1,1,0,0,0,0,0,1,1,0,1,0,1,0,1,1,0,0,1,0,0,1,1,0,1,0,1,0,1,1,0,0,0,0,0,1,1,1,1,1,1,1,1].map((v, i) => (
                    <div key={i} style={{ aspectRatio: "1", borderRadius: 1, background: v ? "#111" : "transparent" }} />
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Activate button — narrower, taller, centered pill like the welcome sign-up button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onActivate?.();
          }}
          className="w-[170px] h-[58px] rounded-[29px] text-[16px] font-bold active:scale-[0.96] transition-transform duration-150"
          style={{
            background: "#FFE500",
            color: "#1A1A1A",
            fontFamily: "var(--font-outfit), system-ui, -apple-system, sans-serif",
            boxShadow: "0 4px 20px rgba(255,229,0,0.35)",
          }}
        >
          Activate
        </button>
      </div>
    </div>
  );
}

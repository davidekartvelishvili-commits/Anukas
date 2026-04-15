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

export default function Ticket({ data }: { data: TicketData }) {
  const [back, setBack] = useState(false);

  return (
    <div
      onClick={() => setBack((b) => !b)}
      style={{
        width: "100%",
        maxWidth: 290,
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        cursor: "pointer",
        position: "relative",
        boxShadow: "0 12px 40px rgba(0,0,0,0.25)",
        userSelect: "none",
        WebkitUserSelect: "none",
      }}
    >
      {!back ? (
        /* ───── FRONT ───── */
        <>
          <Stripes />
          <div style={{ padding: "22px 24px 20px" }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
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

            <div style={{ fontSize: 22, fontWeight: 700, color: "#111", letterSpacing: "-0.03em", lineHeight: 1.2, marginBottom: 20 }}>
              {data.title}
              <br />
              <span style={{ fontSize: 16, fontWeight: 600 }}>{data.titleKa}</span>
            </div>

            {(data.screen || data.row || data.seat) && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px 0", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid #f0f0f0" }}>
                {data.screen && (
                  <div>
                    <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Screen</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{data.screen}</div>
                  </div>
                )}
                {data.row && (
                  <div>
                    <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Row</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{data.row}</div>
                  </div>
                )}
                {data.seat && (
                  <div>
                    <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>Seat</div>
                    <div style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>{data.seat}</div>
                  </div>
                )}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 0" }}>
              <div>
                <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>მოქმედებს</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{data.validity}</div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 3 }}>ტიპი</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#111" }}>{data.type}</div>
              </div>
            </div>
          </div>

          {/* Barcode area */}
          <div style={{ padding: "0 24px 16px", display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1.5, marginBottom: 6 }}>
              {Array.from({ length: 40 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    width: i % 5 === 0 ? 3 : i % 3 === 0 ? 1 : 2,
                    height: 40,
                    background: `rgba(17,17,17,${0.25 + (i % 7) * 0.1})`,
                    borderRadius: 1,
                  }}
                />
              ))}
            </div>
            <div style={{ fontSize: 9, color: "#ccc", fontFamily: "'DM Mono', monospace", letterSpacing: "0.25em", textAlign: "center" }}>
              SERIAL · {data.serial}
            </div>
          </div>

          {/* Tear line */}
          <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
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
          <div style={{ background: Y, borderRadius: "0 0 16px 16px", padding: "16px 24px 20px" }}>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.45)", letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: "'DM Mono', monospace", marginBottom: 5 }}>
              ფასი
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: "#000", letterSpacing: "-0.03em", lineHeight: 1 }}>{data.price}</span>
              <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(0,0,0,0.45)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.05em" }}>Cash</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#000", letterSpacing: "-0.01em", lineHeight: 1 }}>{data.bonus}</span>
              </div>
            </div>
            <div style={{ fontSize: 9, color: "rgba(0,0,0,0.3)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.08em" }}>{data.personName}</div>
          </div>
        </>
      ) : (
        /* ───── BACK ───── */
        <>
          <Stripes />
          <div style={{ padding: "18px 24px 10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, paddingBottom: 12, borderBottom: "1px solid #f0f0f0" }}>
              <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.18em", fontFamily: "'DM Mono', monospace" }}>{data.social || "@SHANSIAPP"}</div>
              <div style={{ fontSize: 9, fontWeight: 600, color: "#aaa", letterSpacing: "0.12em", fontFamily: "'DM Mono', monospace" }}>FOLLOW US</div>
            </div>

            <div style={{ textAlign: "center", marginBottom: 12 }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{data.emoji}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: "#111", letterSpacing: "-0.03em" }}>{data.title.toUpperCase()}</div>
              <div style={{ fontSize: 10, color: "#bbb", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", marginTop: 3 }}>{data.category.toUpperCase()}</div>
            </div>

            {data.terms.map((t, i) => (
              <div key={i} style={{ fontSize: 11, color: "#555", padding: "6px 0", borderBottom: "1px solid #f5f5f5", display: "flex", gap: 10, alignItems: "center" }}>
                <div style={{ width: 3, height: 3, borderRadius: "50%", background: "#111", flexShrink: 0 }} />
                {t}
              </div>
            ))}

            <div style={{ marginTop: 10, fontSize: 9, color: "#ccc", letterSpacing: "0.15em", fontFamily: "'DM Mono', monospace", textAlign: "center" }}>
              {data.website}
            </div>
          </div>

          <div style={{ position: "relative", height: 24, display: "flex", alignItems: "center" }}>
            <Notch side="left" />
            <Notch side="right" />
            <div style={{ flex: 1, marginLeft: 13, marginRight: 13, height: 1, backgroundImage: "repeating-linear-gradient(90deg,#ddd 0,#ddd 6px,transparent 6px,transparent 13px)" }} />
          </div>

          <div style={{ background: Y, borderRadius: "0 0 16px 16px", padding: "14px 24px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.4)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 4 }}>
                Scan to redeem
              </div>
              <div style={{ fontSize: 9, color: "rgba(0,0,0,0.35)", fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}>Powered by SHANSI</div>
            </div>
            <div style={{ width: 58, height: 58, background: "#fff", borderRadius: 8, padding: 6, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, boxShadow: "0 2px 6px rgba(0,0,0,0.1)" }}>
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
  );
}

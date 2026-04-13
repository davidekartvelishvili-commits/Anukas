"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import BackHeader from "@/components/BackHeader";
import BottomNav from "@/components/BottomNav";
import { getMe, getStoredToken } from "@/services/auth";
import { requestWithdrawal, getWithdrawals } from "@/services/wallet";
import AuthGuard from "@/components/AuthGuard";

/* ── BANKS ── */
const BANKS = [
  { value: "bog", label: "BOG (საქართველოს ბანკი)" },
  { value: "tbc", label: "TBC ბანკი" },
  { value: "liberty", label: "Liberty ბანკი" },
  { value: "credo", label: "Credo ბანკი" },
  { value: "basis", label: "Basis Bank" },
];

/* ── STATUS ── */
type WStatus = "pending" | "approved" | "completed" | "rejected";

const STATUS_CONFIG: Record<WStatus, { label: string; bg: string; text: string }> = {
  pending:   { label: "მოლოდინში",    bg: "rgba(255,215,0,0.15)",  text: "#FFD700" },
  approved:  { label: "დამტკიცებული", bg: "rgba(59,130,246,0.15)", text: "#3B82F6" },
  completed: { label: "დასრულებული",  bg: "rgba(34,197,94,0.15)",  text: "#22C55E" },
  rejected:  { label: "უარყოფილი",    bg: "rgba(239,68,68,0.15)",  text: "#EF4444" },
};

interface Withdrawal {
  id: string;
  amount: number;
  status: WStatus;
  createdAt: string;
  created_at?: string;
  adminNote?: string;
  admin_note?: string;
  iban?: string;
  bank_name?: string;
}

/* ── MAIN ── */
export default function WalletPage() {
  const router = useRouter();

  const [cashBalance, setCashBalance] = useState(0);
  const [coinBalance, setCoinBalance] = useState(0);
  const [balanceLoading, setBalanceLoading] = useState(true);

  const [amount, setAmount] = useState("");
  const [iban, setIban] = useState("");
  const [bank, setBank] = useState("");
  const [holderName, setHolderName] = useState("");
  const [formError, setFormError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState("");

  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const [visible, setVisible] = useState(false);

  /* ── Auth + fetch ── */
  useEffect(() => {
    if (!getStoredToken()) { router.replace("/auth"); return; }

    getMe().then((data: any) => {
      if (data.success && data.user) {
        setCashBalance(data.user.balance || 0);
        setCoinBalance(data.user.coinBalance || 0);
      }
    }).catch(() => {}).finally(() => setBalanceLoading(false));

    getWithdrawals().then((data: any) => {
      setWithdrawals(data.withdrawals || []);
    }).catch(() => {}).finally(() => setHistoryLoading(false));

    setTimeout(() => setVisible(true), 50);
  }, [router]);

  /* ── Toast auto-hide ── */
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  /* ── Validate + submit ── */
  const validate = (): string | null => {
    const amt = Number(amount);
    if (!amount || isNaN(amt) || amt <= 0) return "თანხა არასწორია";
    if (amt < 1) return "მინიმუმი: 1₾";
    if (amt > 100) return "დღიური ლიმიტი: 100₾";
    if (amt > cashBalance) return "არასაკმარისი ბალანსი";
    if (!iban || !iban.startsWith("GE") || iban.length < 22) return "IBAN არასწორია (GE...)";
    if (!bank) return "აირჩიეთ ბანკი";
    if (!holderName.trim()) return "შეიყვანეთ ანგარიშის მფლობელი";
    return null;
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setFormError(err); return; }
    setFormError("");
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    try {
      const data = await requestWithdrawal(Number(amount), iban, bank, holderName.trim()) as any;
      if (data.success) {
        setToast("განაცხადი გაგზავნილია");
        setAmount(""); setIban(""); setBank(""); setHolderName("");
        setCashBalance((b) => b - Number(amount));
        // Refresh history
        const hist = await getWithdrawals() as any;
        setWithdrawals(hist.withdrawals || []);
      } else {
        setFormError(data.error || "შეცდომა");
      }
    } catch (e: any) { setFormError(e.message || "შეცდომა"); }
    finally { setSubmitting(false); }
  };

  const inputStyle: React.CSSProperties = {
    background: "#1C1C1E", border: "1px solid #333", borderRadius: 8,
    color: "#FFF", padding: "12px 14px", fontSize: 15, width: "100%",
    outline: "none", fontFamily: "var(--font-dm-sans), system-ui, sans-serif",
  };

  return (
    <AuthGuard>
    <div className="min-h-[100dvh] flex flex-col" style={{ background: "#000000" }}>
      <BackHeader title="საფულე" />

      <div className={`flex-1 px-4 pb-24 pt-4 transition-all duration-300 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
        {/* Balance */}
        <div className="rounded-[16px] p-5 mb-6 text-center" style={{ background: "linear-gradient(135deg, #1C1C1E 0%, #2A2A2E 100%)", border: "1px solid #333" }}>
          {balanceLoading ? (
            <div className="flex justify-center py-4">
              <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#FFD700", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <>
              <p className="text-[13px] mb-1" style={{ color: "#999", fontFamily: "var(--font-dm-sans), system-ui" }}>ხელმისაწვდომი ბალანსი</p>
              <p className="text-[36px] font-bold" style={{ color: "#FFD700", fontFamily: "var(--font-outfit), system-ui" }}>
                {cashBalance.toFixed(2)} <span className="text-[18px]">₾</span>
              </p>
              <p className="text-[14px] mt-1" style={{ color: "#999" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="#FFD700" className="inline mr-1 -mt-0.5"><circle cx="7" cy="7" r="6" fill="none" stroke="#FFD700" strokeWidth="1.5" /><text x="7" y="10.5" textAnchor="middle" fontSize="8" fill="#FFD700" fontWeight="bold">C</text></svg>
                {coinBalance} ქოინი
              </p>
            </>
          )}
        </div>

        {/* Withdrawal Form */}
        <div className="rounded-[16px] p-5 mb-6" style={{ background: "#1C1C1E", border: "1px solid #333" }}>
          <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#FFF", fontFamily: "var(--font-outfit), system-ui" }}>თანხის გატანა</h2>

          <div className="space-y-3">
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: "#999" }}>თანხა ₾</label>
              <input value={amount} onChange={(e) => setAmount(e.target.value)} type="number" placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: "#999" }}>IBAN</label>
              <input value={iban} onChange={(e) => setIban(e.target.value.toUpperCase())} placeholder="GE..." maxLength={22} style={inputStyle} />
            </div>
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: "#999" }}>ბანკი</label>
              <select value={bank} onChange={(e) => setBank(e.target.value)} style={{ ...inputStyle, appearance: "none" as const }}>
                <option value="">აირჩიეთ ბანკი</option>
                {BANKS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[12px] block mb-1.5" style={{ color: "#999" }}>ანგარიშის მფლობელი</label>
              <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="სახელი გვარი" style={inputStyle} />
            </div>
          </div>

          <p className="text-[12px] mt-3 mb-4" style={{ color: "#666" }}>მინიმუმი: 1₾ | ლიმიტი: 100₾/დღე</p>

          {formError && <p className="text-[13px] mb-3" style={{ color: "#EF4444" }}>{formError}</p>}

          <button onClick={handleSubmit} disabled={submitting} className="w-full py-3.5 rounded-[12px] text-[15px] font-semibold transition-all duration-200 active:scale-[0.98] disabled:opacity-40" style={{ background: "#FFD700", color: "#000" }}>
            {submitting ? "იგზავნება..." : "გატანა"}
          </button>
        </div>

        {/* History */}
        <div className="rounded-[16px] p-5" style={{ background: "#1C1C1E", border: "1px solid #333" }}>
          <h2 className="text-[16px] font-semibold mb-4" style={{ color: "#FFF", fontFamily: "var(--font-outfit), system-ui" }}>ისტორია</h2>

          {historyLoading ? (
            <div className="flex justify-center py-6">
              <div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#FFD700", borderTopColor: "transparent" }} />
            </div>
          ) : withdrawals.length === 0 ? (
            <p className="text-[13px] text-center py-6" style={{ color: "#666" }}>ისტორია ცარიელია</p>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => {
                const st = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
                const date = w.createdAt || w.created_at || "";
                return (
                  <div key={w.id} className="flex items-center justify-between py-3 border-b" style={{ borderColor: "#333" }}>
                    <div>
                      <p className="text-[14px] font-medium" style={{ color: "#FFF" }}>{Number(w.amount).toFixed(2)} ₾</p>
                      <p className="text-[11px] mt-0.5" style={{ color: "#666" }}>{date ? new Date(date).toLocaleDateString("ka-GE") : "—"}</p>
                    </div>
                    <span className="px-2.5 py-1 rounded-[6px] text-[11px] font-medium" style={{ background: st.bg, color: st.text }}>{st.label}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4">
          <div className="w-full max-w-[420px] rounded-t-[20px] rounded-b-[12px] p-6" style={{ background: "#1C1C1E", border: "1px solid #333" }}>
            <h3 className="text-[16px] font-semibold mb-4 text-center" style={{ color: "#FFF", fontFamily: "var(--font-outfit), system-ui" }}>დაადასტურეთ</h3>
            <div className="space-y-2 mb-5">
              <div className="flex justify-between text-[14px]">
                <span style={{ color: "#999" }}>თანხა</span>
                <span style={{ color: "#FFF" }}>{amount} ₾</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span style={{ color: "#999" }}>IBAN</span>
                <span style={{ color: "#FFF" }}>{iban}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span style={{ color: "#999" }}>ბანკი</span>
                <span style={{ color: "#FFF" }}>{BANKS.find((b) => b.value === bank)?.label || bank}</span>
              </div>
              <div className="flex justify-between text-[14px]">
                <span style={{ color: "#999" }}>მფლობელი</span>
                <span style={{ color: "#FFF" }}>{holderName}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowConfirm(false)} className="flex-1 py-3 rounded-[12px] text-[14px] font-medium transition-all active:scale-[0.98]" style={{ border: "1px solid #333", color: "#999" }}>გაუქმება</button>
              <button onClick={handleConfirm} className="flex-1 py-3 rounded-[12px] text-[14px] font-semibold transition-all active:scale-[0.98]" style={{ background: "#FFD700", color: "#000" }}>დადასტურება</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100]">
          <div className="rounded-[10px] px-5 py-3" style={{ background: "#22C55E", boxShadow: "0 4px 20px rgba(0,0,0,0.4)" }}>
            <span className="text-[14px] font-medium" style={{ color: "#FFF" }}>{toast}</span>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
    </AuthGuard>
  );
}

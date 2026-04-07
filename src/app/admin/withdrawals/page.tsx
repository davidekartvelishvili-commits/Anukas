"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getWithdrawals, updateWithdrawal } from "@/services/admin";

/* ── SVG ICONS ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.7 3.7l1.4 1.4M12.9 12.9l1.4 1.4M3.7 14.3l1.4-1.4M12.9 5.1l1.4-1.4" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /><path d="M2 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M6 6c0 1.1.9 2 2 2s2-.9 2-2" /><path d="M10 6c0 1.1.9 2 2 2s2-.9 2-2" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /><path d="M6 7h6" /><path d="M9 7v8" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l2-3h10l2 3" /><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /><path d="M2 6h14" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /><path d="M1 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /><path d="M9 16c0-2.8 1.8-5 4-5s4 2.2 4 5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4" /><path d="M5 8l4-4 4 4" /><path d="M3 16h12" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /><path d="M2 16h14" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /><path d="M1 16h16" /></svg>,
    notifications: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M13.5 6.5a4.5 4.5 0 10-9 0c0 5-2.25 6.5-2.25 6.5h13.5s-2.25-1.5-2.25-6.5" /><path d="M7.5 15a1.5 1.5 0 003 0" /></svg>,
    analytics: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 1.5a1.5 1.5 0 011.06.44l1.12.96a1 1 0 00.82.24l1.44-.24a1.5 1.5 0 011.74 1.74l-.24 1.44a1 1 0 00.24.82l.96 1.12a1.5 1.5 0 010 2.12l-.96 1.12a1 1 0 00-.24.82l.24 1.44a1.5 1.5 0 01-1.74 1.74l-1.44-.24a1 1 0 00-.82.24l-1.12.96a1.5 1.5 0 01-2.12 0l-1.12-.96a1 1 0 00-.82-.24l-1.44.24a1.5 1.5 0 01-1.74-1.74l.24-1.44a1 1 0 00-.24-.82l-.96-1.12a1.5 1.5 0 010-2.12l.96-1.12a1 1 0 00.24-.82l-.24-1.44A1.5 1.5 0 015.56 2.9l1.44.24a1 1 0 00.82-.24l1.12-.96A1.5 1.5 0 019 1.5z" /><circle cx="9" cy="9" r="2.5" /></svg>,
  };
  return icons[id] || null;
}

const NAV_ITEMS = [
  { label: "Dashboard", id: "dashboard", href: "/admin" },
  { label: "Algorithm", id: "algorithm", href: "/admin/algorithm" },
  { label: "Users", id: "users", href: "/admin/users" },
  { label: "Merchants", id: "merchants", href: "/admin/merchants" },
  { label: "Transactions", id: "transactions", href: "/admin/transactions" },
  { label: "Games", id: "games", href: "/admin/games" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── TYPES ── */
type WStatus = "pending" | "approved" | "completed" | "rejected";

interface WithdrawalItem {
  id: string;
  user_name?: string;
  user_phone?: string;
  amount: number;
  iban: string;
  bank_name: string;
  account_holder_name?: string;
  status: WStatus;
  admin_note?: string;
  created_at: string;
}

const STATUS_CONFIG: Record<WStatus, { label: string; bg: string; color: string }> = {
  pending:   { label: "მოლოდინში",    bg: "rgba(249,231,65,0.15)",  color: "#F9E741" },
  approved:  { label: "დამტკიცებული", bg: "rgba(59,130,246,0.15)",  color: "#3B82F6" },
  completed: { label: "დასრულებული",  bg: "rgba(34,197,94,0.15)",   color: "#22C55E" },
  rejected:  { label: "უარყოფილი",    bg: "rgba(239,68,68,0.15)",   color: "#EF4444" },
};

/* ── TOAST ── */
function Toast({ message, type, onClose }: { message: string; type?: "success" | "error"; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  const color = type === "error" ? "#EF4444" : "#22C55E";
  return (
    <div className="fixed top-4 right-4 z-[100]">
      <div className="rounded-[8px] px-4 py-3 border flex items-center gap-2" style={{ background: "#1A1A1A", borderColor: color, boxShadow: "0 4px 20px rgba(0,0,0,0.5)" }}>
        <span className="text-[13px] font-medium" style={{ color: "#FFFFFF" }}>{message}</span>
        <button onClick={onClose} className="ml-2 transition-all hover:opacity-70">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="3" x2="9" y2="9" /><line x1="9" y1="3" x2="3" y2="9" /></svg>
        </button>
      </div>
    </div>
  );
}

/* ── MAIN ── */
export default function WithdrawalsPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<WStatus>("pending");

  const [items, setItems] = useState<WithdrawalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  // Reject note modal
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState("");

  const showToast = (msg: string, type: "success" | "error" = "success") => setToast({ msg, type });

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getWithdrawals(activeTab, currentPage);
      setItems(data.withdrawals || []);
      setTotalPages(data.pagination?.totalPages || 1);
    } catch { setItems([]); }
    finally { setLoading(false); }
  }, [activeTab, currentPage]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setCurrentPage(1); }, [activeTab]);

  const handleApprove = async (id: string) => {
    setActionLoading(id);
    try {
      await updateWithdrawal(id, "approved");
      showToast("დამტკიცებულია");
      fetchData();
    } catch (e: any) { showToast(e.message || "შეცდომა", "error"); }
    finally { setActionLoading(null); }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(rejectTarget);
    try {
      await updateWithdrawal(rejectTarget, "rejected", rejectNote || undefined);
      showToast("უარყოფილია");
      setRejectTarget(null);
      setRejectNote("");
      fetchData();
    } catch (e: any) { showToast(e.message || "შეცდომა", "error"); }
    finally { setActionLoading(null); }
  };

  const handleComplete = async (id: string) => {
    setActionLoading(id);
    try {
      await updateWithdrawal(id, "completed");
      showToast("დასრულებულია");
      fetchData();
    } catch (e: any) { showToast(e.message || "შეცდომა", "error"); }
    finally { setActionLoading(null); }
  };

  const tabs: { key: WStatus; label: string }[] = [
    { key: "pending", label: "მოლოდინში" },
    { key: "approved", label: "დამტკიცებული" },
    { key: "completed", label: "დასრულებული" },
    { key: "rejected", label: "უარყოფილი" },
  ];

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-[100dvh] w-[240px] flex flex-col border-r transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="p-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <span className="text-[15px] font-bold tracking-wide" style={{ color: "#F9E741" }}>SHANSI</span>
          <span className="text-[11px] ml-2" style={{ color: "#666" }}>Admin</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === "withdrawals";
            return (
              <button key={item.id} onClick={() => router.push(item.href)} className="w-full flex items-center gap-3 px-5 py-[10px] transition-all duration-150 hover:bg-white/5" style={{ background: active ? "#F9E74110" : "transparent" }}>
                <NavIcon id={item.id} active={active} />
                <span className="text-[13px]" style={{ color: active ? "#F9E741" : "#A0A0A0" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="flex items-center px-4 lg:px-8 h-14 border-b" style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}>
          <button className="lg:hidden p-1 mr-3" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
          </button>
          <h1 className="text-[16px] font-semibold" style={{ color: "#FFFFFF" }}>Withdrawals</h1>
        </header>

        <div className="p-4 lg:p-8">
          {/* Tabs */}
          <div className="flex gap-1 p-1 rounded-[10px] mb-6 w-fit flex-wrap" style={{ background: "#111111" }}>
            {tabs.map((t) => (
              <button key={t.key} onClick={() => setActiveTab(t.key)} className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all duration-150" style={{ background: activeTab === t.key ? "#F9E741" : "transparent", color: activeTab === t.key ? "#000" : "#A0A0A0" }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-[14px]" style={{ color: "#666" }}>განაცხადები არ მოიძებნა</p>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr style={{ borderBottom: "1px solid #252525" }}>
                      {["მომხმარებელი", "თანხა ₾", "IBAN", "ბანკი", "სტატუსი", ""].map((h) => (
                        <th key={h} className="px-4 py-3 text-[12px] font-medium" style={{ color: "#666" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((w) => {
                      const st = STATUS_CONFIG[w.status] || STATUS_CONFIG.pending;
                      return (
                        <tr key={w.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                          <td className="px-4 py-3">
                            <span className="text-[13px]" style={{ color: "#FFF" }}>{w.user_name || w.user_phone || "—"}</span>
                          </td>
                          <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#FFF" }}>{Number(w.amount).toFixed(2)}</td>
                          <td className="px-4 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{w.iban}</td>
                          <td className="px-4 py-3 text-[13px]" style={{ color: "#A0A0A0" }}>{w.bank_name}</td>
                          <td className="px-4 py-3">
                            <span className="inline-block px-2 py-1 rounded-[6px] text-[11px] font-medium" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              {w.status === "pending" && (
                                <>
                                  <button disabled={actionLoading === w.id} onClick={() => handleApprove(w.id)} className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "rgba(34,197,94,0.15)", color: "#22C55E" }}>
                                    {actionLoading === w.id ? "..." : "დამტკიცება"}
                                  </button>
                                  <button disabled={actionLoading === w.id} onClick={() => setRejectTarget(w.id)} className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "rgba(239,68,68,0.15)", color: "#EF4444" }}>
                                    უარყოფა
                                  </button>
                                </>
                              )}
                              {w.status === "approved" && (
                                <button disabled={actionLoading === w.id} onClick={() => handleComplete(w.id)} className="px-3 py-1.5 rounded-[6px] text-[12px] font-medium transition-all hover:opacity-80" style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6" }}>
                                  {actionLoading === w.id ? "..." : "დასრულება"}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 p-4 border-t" style={{ borderColor: "#252525" }}>
                  <button disabled={currentPage <= 1} onClick={() => setCurrentPage((p) => p - 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>წინა</button>
                  <span className="text-[12px] px-2" style={{ color: "#666" }}>{currentPage} / {totalPages}</span>
                  <button disabled={currentPage >= totalPages} onClick={() => setCurrentPage((p) => p + 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>შემდეგი</button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Reject Note Modal */}
      {rejectTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-[400px] rounded-[12px] border p-6" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
            <h3 className="text-[15px] font-semibold mb-4" style={{ color: "#FFF" }}>უარყოფის მიზეზი</h3>
            <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="შენიშვნა (არასავალდებულო)" className="w-full rounded-[8px] p-3 text-[14px] outline-none resize-none" style={{ background: "#111111", border: "1px solid #252525", color: "#FFF", fontFamily: "system-ui, -apple-system, sans-serif" }} />
            <div className="flex gap-3 mt-4">
              <button onClick={() => { setRejectTarget(null); setRejectNote(""); }} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium transition-all hover:bg-white/5" style={{ border: "1px solid #252525", color: "#A0A0A0" }}>გაუქმება</button>
              <button onClick={handleReject} disabled={actionLoading === rejectTarget} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold transition-all hover:opacity-80 disabled:opacity-40" style={{ background: "#EF4444", color: "#FFF" }}>
                {actionLoading === rejectTarget ? "..." : "უარყოფა"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

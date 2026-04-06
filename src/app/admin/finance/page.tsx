"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getFinance, getPaymentTransactions } from "@/services/admin";

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
  { label: "Notifications", id: "notifications", href: "/admin/notifications" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];

/* ── TYPES ── */
interface FinanceStats {
  totalCommission: number;
  totalPaidOut: number;
  pendingWithdrawals: number;
  profit: number;
}

interface PaymentTx {
  id: string;
  merchant_name?: string;
  user_phone?: string;
  amount: number;
  commission: number;
  created_at: string;
}

/* ── MAIN ── */
export default function FinancePage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [transactions, setTransactions] = useState<PaymentTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getFinance().catch(() => null),
      getPaymentTransactions(1).catch(() => null),
    ]).then(([fin, txData]) => {
      if (fin?.success && fin.finance) setStats(fin.finance);
      else if (fin?.success) setStats(fin as any);
      if (txData?.transactions) {
        setTransactions(txData.transactions);
        setTxTotalPages(txData.pagination?.totalPages || 1);
      }
    }).finally(() => setLoading(false));
  }, []);

  const fetchTx = useCallback(async (page: number) => {
    try {
      const data = await getPaymentTransactions(page);
      setTransactions(data.transactions || []);
      setTxTotalPages(data.pagination?.totalPages || 1);
    } catch { /* */ }
  }, []);

  useEffect(() => { if (txPage > 1) fetchTx(txPage); }, [txPage, fetchTx]);

  const statCards: { label: string; value: number; color: string; bg: string }[] = stats ? [
    { label: "ჯამური კომისია", value: stats.totalCommission, color: "#22C55E", bg: "rgba(34,197,94,0.1)" },
    { label: "გაცემული", value: stats.totalPaidOut, color: "#EF4444", bg: "rgba(239,68,68,0.1)" },
    { label: "მოლოდინში", value: stats.pendingWithdrawals, color: "#F59E0B", bg: "rgba(245,158,11,0.1)" },
    { label: "მოგება", value: stats.profit, color: "#F9E741", bg: "rgba(249,231,65,0.1)" },
  ] : [];

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`fixed lg:static z-40 top-0 left-0 h-[100dvh] w-[240px] flex flex-col border-r transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="p-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <span className="text-[15px] font-bold tracking-wide" style={{ color: "#F9E741" }}>SHANSI</span>
          <span className="text-[11px] ml-2" style={{ color: "#666" }}>Admin</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === "finance";
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
          <h1 className="text-[16px] font-semibold" style={{ color: "#FFFFFF" }}>Finance</h1>
        </header>

        <div className="p-4 lg:p-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
            </div>
          ) : (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                {statCards.map((s) => (
                  <div key={s.label} className="rounded-[12px] border p-4" style={{ background: s.bg, borderColor: "#252525" }}>
                    <p className="text-[12px] mb-2" style={{ color: "#A0A0A0" }}>{s.label}</p>
                    <p className="text-[22px] font-bold" style={{ color: s.color }}>{Number(s.value || 0).toFixed(2)} <span className="text-[14px] font-normal">₾</span></p>
                  </div>
                ))}
              </div>

              {/* Payment Transactions */}
              <h2 className="text-[14px] font-semibold mb-4" style={{ color: "#FFF" }}>გადახდის ტრანზაქციები</h2>
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-[14px]" style={{ color: "#666" }}>ტრანზაქციები არ მოიძებნა</p>
                </div>
              ) : (
                <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111111", borderColor: "#252525" }}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr style={{ borderBottom: "1px solid #252525" }}>
                          {["მერჩანტი", "მომხმარებელი", "თანხა ₾", "კომისია ₾", "თარიღი"].map((h) => (
                            <th key={h} className="px-4 py-3 text-[12px] font-medium" style={{ color: "#666" }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {transactions.map((tx) => (
                          <tr key={tx.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                            <td className="px-4 py-3 text-[13px]" style={{ color: "#FFF" }}>{tx.merchant_name || "—"}</td>
                            <td className="px-4 py-3 text-[13px]" style={{ color: "#A0A0A0" }}>{tx.user_phone || "—"}</td>
                            <td className="px-4 py-3 text-[13px] font-medium" style={{ color: "#FFF" }}>{Number(tx.amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-[13px]" style={{ color: "#22C55E" }}>{Number(tx.commission).toFixed(2)}</td>
                            <td className="px-4 py-3 text-[12px]" style={{ color: "#666" }}>{new Date(tx.created_at).toLocaleDateString("ka-GE")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {txTotalPages > 1 && (
                    <div className="flex items-center justify-center gap-2 p-4 border-t" style={{ borderColor: "#252525" }}>
                      <button disabled={txPage <= 1} onClick={() => setTxPage((p) => p - 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>წინა</button>
                      <span className="text-[12px] px-2" style={{ color: "#666" }}>{txPage} / {txTotalPages}</span>
                      <button disabled={txPage >= txTotalPages} onClick={() => setTxPage((p) => p + 1)} className="px-3 py-1.5 rounded-[6px] text-[12px] transition-all hover:bg-white/5 disabled:opacity-30" style={{ color: "#A0A0A0", border: "1px solid #252525" }}>შემდეგი</button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

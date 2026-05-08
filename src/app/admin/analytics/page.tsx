"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { getAnalytics } from "@/services/admin";
import AdminAuthGuard from "@/components/admin/AdminAuthGuard";

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="14" height="10" rx="1" /><path d="M9 6v10" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="6" r="2.5" /><circle cx="13" cy="6" r="2.5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4M5 8l4-4 4 4" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /><path d="M6 16v-4h6v4" /></svg>,
    analytics: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,14 6,8 10,11 16,4" /><polyline points="12,4 16,4 16,8" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /><path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2" /></svg>,
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
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Shansi Drops", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "Analytics", id: "analytics", href: "/admin/analytics" },
  { label: "System", id: "system", href: "/admin/system" },
];
const CURRENT = "analytics";

function AnalyticsContent() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [days, setDays] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getAnalytics(days) as any;
      if (r.success) setData(r.analytics);
    } catch (e) { console.error(e); }
    setLoading(false);
  }, [days]);

  useEffect(() => { load(); }, [load]);

  // Find max daily views for bar chart scaling
  const maxDaily = data?.daily?.reduce((m: number, d: any) => Math.max(m, d.views), 0) || 1;

  return (
    <div className="min-h-[100dvh] flex" style={{ background: "#000000", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {sidebarOpen && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed lg:static z-40 top-0 left-0 h-[100dvh] w-[240px] flex flex-col border-r transition-transform duration-200 ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="p-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <span className="text-[15px] font-bold tracking-wide" style={{ color: "#F9E741" }}>SHANSI</span>
          <span className="text-[11px] ml-2" style={{ color: "#666" }}>Admin</span>
        </div>
        <nav className="flex-1 py-2 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const active = item.id === CURRENT;
            return (
              <button key={item.id} onClick={() => router.push(item.href)} className="w-full flex items-center gap-3 px-5 py-[10px] transition-all duration-150 hover:bg-white/5" style={{ background: active ? "#F9E74110" : "transparent" }}>
                <NavIcon id={item.id} active={active} />
                <span className="text-[13px]" style={{ color: active ? "#F9E741" : "#A0A0A0" }}>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 min-w-0 overflow-y-auto">
        <header className="flex items-center px-4 lg:px-8 h-14 border-b" style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}>
          <button className="lg:hidden p-1 mr-3" onClick={() => setSidebarOpen(true)}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
          </button>
          <h1 className="text-[16px] font-semibold flex-1" style={{ color: "#FFFFFF" }}>ანალიტიკა</h1>
          <button onClick={load} className="px-3 py-1.5 rounded-lg text-[11px] font-semibold" style={{ background: "#1A1A1A", color: "#F9E741", border: "1px solid #252525" }}>
            განახლება
          </button>
        </header>

        <div className="p-4 lg:p-6">
          {/* Period selector */}
          <div className="flex gap-2 mb-5">
            {[7, 14, 30, 90].map(d => (
              <button key={d} onClick={() => setDays(d)} className="px-4 py-2 rounded-xl text-[12px] font-semibold transition-all"
                style={{ background: days === d ? "#F9E741" : "#1A1A1A", color: days === d ? "#000" : "#A0A0A0", border: `1px solid ${days === d ? "#F9E741" : "#252525"}` }}>
                {d} დღე
              </button>
            ))}
          </div>

          {loading && !data ? (
            <p className="text-[13px]" style={{ color: "#666" }}>იტვირთება...</p>
          ) : data ? (
            <div className="space-y-5">
              {/* Top stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "ნახვები დღეს", val: data.todayViews, color: "#F9E741" },
                  { label: `ნახვები ${days} დღეში`, val: data.totalViews, color: "#3B82F6" },
                  { label: "უნიკალური წყაროები", val: data.referrers?.length || 0, color: "#22C55E" },
                  { label: "მოწყობილობები", val: data.devices?.length || 0, color: "#A855F7" },
                ].map(s => (
                  <div key={s.label} className="rounded-2xl border p-4" style={{ background: "#111111", borderColor: "#252525" }}>
                    <p className="text-[11px]" style={{ color: "#666" }}>{s.label}</p>
                    <p className="text-[26px] font-bold" style={{ color: s.color }}>{s.val}</p>
                  </div>
                ))}
              </div>

              {/* Daily views bar chart */}
              <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>დღიური ნახვები</h3>
                {data.daily?.length > 0 ? (
                  <div className="flex items-end gap-1" style={{ height: 160 }}>
                    {data.daily.slice(0, 30).reverse().map((d: any) => (
                      <div key={d.day} className="flex-1 flex flex-col items-center gap-1 group relative">
                        <div className="absolute -top-6 hidden group-hover:block px-2 py-1 rounded text-[10px] whitespace-nowrap" style={{ background: "#F9E741", color: "#000" }}>
                          {d.day}: {d.views}
                        </div>
                        <div
                          className="w-full rounded-t transition-all"
                          style={{
                            height: `${Math.max(4, (d.views / maxDaily) * 140)}px`,
                            background: "linear-gradient(180deg, #F9E741, #F9E74140)",
                            minWidth: 4,
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ) : <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Top referrers */}
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>საიდან მოდიან</h3>
                  {data.referrers?.length > 0 ? (
                    <div className="space-y-2">
                      {data.referrers.map((r: any, i: number) => {
                        let label = r.referrer;
                        try { label = new URL(r.referrer).hostname; } catch {}
                        return (
                          <div key={i} className="flex items-center justify-between">
                            <span className="text-[12px] truncate flex-1 mr-3" style={{ color: "#A0A0A0" }} title={r.referrer}>{label}</span>
                            <span className="text-[13px] font-bold" style={{ color: "#F9E741" }}>{r.views}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-[12px]" style={{ color: "#666" }}>რეფერერები არ არის</p>}
                </div>

                {/* UTM campaigns */}
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>UTM კამპანიები</h3>
                  {data.utm?.length > 0 ? (
                    <div className="space-y-2">
                      {data.utm.map((u: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <div className="flex-1 mr-3">
                            <span className="text-[12px] font-medium" style={{ color: "#FFF" }}>{u.utm_source || "—"}</span>
                            {u.utm_medium && <span className="text-[10px] ml-2" style={{ color: "#666" }}>/ {u.utm_medium}</span>}
                            {u.utm_campaign && <span className="text-[10px] ml-2" style={{ color: "#888" }}>{u.utm_campaign}</span>}
                          </div>
                          <span className="text-[13px] font-bold" style={{ color: "#3B82F6" }}>{u.views}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[12px]" style={{ color: "#666" }}>UTM მონაცემები არ არის</p>}
                </div>

                {/* Device breakdown */}
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>მოწყობილობები</h3>
                  {data.devices?.length > 0 ? (
                    <div className="space-y-3">
                      {data.devices.map((d: any) => {
                        const totalDeviceViews = data.devices.reduce((s: number, x: any) => s + x.views, 0);
                        const pct = totalDeviceViews > 0 ? Math.round((d.views / totalDeviceViews) * 100) : 0;
                        const colors: Record<string, string> = { mobile: "#22C55E", desktop: "#3B82F6", tablet: "#A855F7" };
                        const labels: Record<string, string> = { mobile: "მობილური", desktop: "კომპიუტერი", tablet: "ტაბლეტი" };
                        return (
                          <div key={d.device_type}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{labels[d.device_type] || d.device_type}</span>
                              <span className="text-[12px] font-bold" style={{ color: colors[d.device_type] || "#FFF" }}>{d.views} ({pct}%)</span>
                            </div>
                            <div className="h-2 rounded-full" style={{ background: "#1A1A1A" }}>
                              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: colors[d.device_type] || "#666" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>}
                </div>

                {/* Top pages */}
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>გვერდები</h3>
                  {data.pages?.length > 0 ? (
                    <div className="space-y-2">
                      {data.pages.map((p: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{p.path}</span>
                          <span className="text-[13px] font-bold" style={{ color: "#FFF" }}>{p.views}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>}
                </div>

                {/* Countries */}
                <div className="rounded-2xl border p-5" style={{ background: "#111111", borderColor: "#252525" }}>
                  <h3 className="text-[14px] font-bold mb-4" style={{ color: "#FFF" }}>ქვეყნები</h3>
                  {data.countries?.length > 0 ? (
                    <div className="space-y-2">
                      {data.countries.map((co: any, i: number) => (
                        <div key={i} className="flex items-center justify-between">
                          <span className="text-[12px]" style={{ color: "#A0A0A0" }}>{co.country}</span>
                          <span className="text-[13px] font-bold" style={{ color: "#FFF" }}>{co.views}</span>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[12px]" style={{ color: "#666" }}>მონაცემები არ არის</p>}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>
    </div>
  );
}

export default function AnalyticsPage() {
  return <AdminAuthGuard><AnalyticsContent /></AdminAuthGuard>;
}

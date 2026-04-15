"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  getOffers,
  createOffer,
  updateOffer,
  deleteOffer,
  getMerchants,
} from "@/services/admin";

/* ── SVG ICONS (NavIcon) ── */
function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="6" height="6" rx="1" /><rect x="10" y="2" width="6" height="6" rx="1" /><rect x="2" y="10" width="6" height="6" rx="1" /><rect x="10" y="10" width="6" height="6" rx="1" /></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="7" cy="6" r="3" /><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6" /><circle cx="13" cy="5" r="2" /><path d="M14 10c1.7.5 3 2 3 4" /></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 6l1.5-4h11L16 6" /><path d="M2 6v10h14V6" /><path d="M7 16v-5h4v5" /></svg>,
    offers: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9V3a1 1 0 011-1h6l7 7-7 7-7-7z" /><circle cx="6" cy="6" r="1.5" fill={c} stroke="none" /></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="14" height="10" rx="2" /><path d="M2 9h14" /></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="4" width="14" height="10" rx="2" /><path d="M2 8h14" /></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h6l3 4-6 8-6-8 3-4z" /></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="7" r="2.5" /><circle cx="13" cy="7" r="2.5" /></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 14V4" /><path d="M5 8l4-4 4 4" /></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l3-2 4 3 3-4 4 3v8" /></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M2 16V8l7-5.5L16 8v8" /></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="3" /></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="2.5" /></svg>,
  };
  return icons[id] || null;
}

const NAV_ITEMS = [
  { label: "Dashboard", id: "dashboard", href: "/admin" },
  { label: "Algorithm", id: "algorithm", href: "/admin/algorithm" },
  { label: "Users", id: "users", href: "/admin/users" },
  { label: "Merchants", id: "merchants", href: "/admin/merchants" },
  { label: "Offers", id: "offers", href: "/admin/offers" },
  { label: "Tickets", id: "tickets", href: "/admin/tickets" },
  { label: "Promos", id: "promos", href: "/admin/promos" },
  { label: "Transactions", id: "transactions", href: "/admin/transactions" },
  { label: "Games", id: "games", href: "/admin/games" },
  { label: "Referrals", id: "referrals", href: "/admin/referrals" },
  { label: "Withdrawals", id: "withdrawals", href: "/admin/withdrawals" },
  { label: "Finance", id: "finance", href: "/admin/finance" },
  { label: "Village", id: "village", href: "/admin/village" },
  { label: "System", id: "system", href: "/admin/system" },
];

const ACTIVE_ID = "offers";

interface OfferRow {
  id: string;
  merchantId: string;
  offerType: "featured" | "flash" | "partner";
  boostedRate: number;
  normalRate: number;
  title: string | null;
  description: string | null;
  sortOrder: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  createdAt: string;
  merchant?: {
    id: string;
    merchantCode: string | null;
    businessName: string;
    logoUrl: string | null;
    category: string;
  } | null;
}

interface MerchantOption {
  id: string;
  merchantCode: string | null;
  businessName: string;
  logoUrl: string | null;
}

interface FormState {
  merchant_id: string;
  offer_type: "featured" | "flash" | "partner";
  boosted_rate: string;
  normal_rate: string;
  title: string;
  description: string;
  sort_order: string;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const emptyForm: FormState = {
  merchant_id: "",
  offer_type: "partner",
  boosted_rate: "20",
  normal_rate: "5",
  title: "",
  description: "",
  sort_order: "0",
  starts_at: "",
  ends_at: "",
  is_active: true,
};

function formatLocalDatetime(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function OffersPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<OfferRow[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [filterType, setFilterType] = useState<string>("");
  const [filterActive, setFilterActive] = useState<string>("");

  const [merchantOptions, setMerchantOptions] = useState<MerchantOption[]>([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchOffers = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (filterType) params.type = filterType;
      if (filterActive === "true") params.active = true;
      if (filterActive === "false") params.active = false;
      const res: any = await getOffers(params);
      setRows(res?.offers || []);
    } catch {
      showToast("ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setLoading(false);
    }
  }, [filterType, filterActive]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  // Load merchants
  useEffect(() => {
    (async () => {
      try {
        const res: any = await getMerchants("active");
        const list = (res?.merchants || []).map((m: any) => ({
          id: m.id,
          merchantCode: m.merchantCode || m.merchant_code || null,
          businessName: m.businessName || m.business_name || "",
          logoUrl: m.logoUrl || m.logo_url || null,
        }));
        setMerchantOptions(list);
      } catch {
        // ignore
      }
    })();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    const now = new Date();
    const week = new Date(Date.now() + 7 * 24 * 3600 * 1000);
    setForm({
      ...emptyForm,
      starts_at: formatLocalDatetime(now.toISOString()),
      ends_at: formatLocalDatetime(week.toISOString()),
    });
    setModalOpen(true);
  };

  const openEdit = (o: OfferRow) => {
    setEditingId(o.id);
    setForm({
      merchant_id: o.merchantId,
      offer_type: o.offerType,
      boosted_rate: String(o.boostedRate),
      normal_rate: String(o.normalRate),
      title: o.title || "",
      description: o.description || "",
      sort_order: String(o.sortOrder),
      starts_at: formatLocalDatetime(o.startsAt),
      ends_at: formatLocalDatetime(o.endsAt),
      is_active: o.isActive,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.merchant_id) return showToast("აირჩიეთ მერჩანტი", "error");
    if (!form.starts_at || !form.ends_at) return showToast("თარიღები სავალდებულოა", "error");
    const br = parseFloat(form.boosted_rate);
    if (isNaN(br)) return showToast("Boosted rate არასწორია", "error");

    setSaving(true);
    try {
      const payload = {
        merchant_id: form.merchant_id,
        offer_type: form.offer_type,
        boosted_rate: br,
        normal_rate: parseFloat(form.normal_rate) || 0,
        title: form.title.trim(),
        description: form.description.trim(),
        sort_order: parseInt(form.sort_order) || 0,
        starts_at: new Date(form.starts_at).toISOString(),
        ends_at: new Date(form.ends_at).toISOString(),
        is_active: form.is_active,
      };
      if (editingId) {
        await updateOffer(editingId, payload);
        showToast("შენახულია");
      } else {
        await createOffer(payload);
        showToast("შეიქმნა");
      }
      setModalOpen(false);
      await fetchOffers();
    } catch (e: any) {
      showToast(e.message || "შეცდომა", "error");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (o: OfferRow) => {
    try {
      await updateOffer(o.id, { is_active: !o.isActive });
      await fetchOffers();
    } catch { showToast("ვერ შესრულდა", "error"); }
  };

  const handleDelete = async (o: OfferRow) => {
    if (!window.confirm(`წაშალე ეს ოფერი?\n\n${o.merchant?.businessName || ""} · ${o.offerType}`)) return;
    try {
      await deleteOffer(o.id);
      showToast("წაიშალა");
      await fetchOffers();
    } catch { showToast("წაშლა ვერ მოხერხდა", "error"); }
  };

  const typeLabel = (t: string) => t === "featured" ? "Featured" : t === "flash" ? "Flash" : "Partner";
  const typeColor = (t: string) =>
    t === "featured" ? { bg: "#F9E74120", fg: "#F9E741" } :
    t === "flash" ? { bg: "#FF6B2B20", fg: "#FF6B2B" } :
    { bg: "#22C55E20", fg: "#22C55E" };

  const fmtDate = (iso: string) => {
    if (!iso) return "—";
    return new Date(iso).toLocaleDateString("ka-GE", { month: "short", day: "numeric" });
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: "13px",
    background: "#0F0F0F", border: "1px solid #252525", borderRadius: 8,
    color: "#FFF", outline: "none",
  };

  return (
    <div className="flex min-h-screen" style={{ background: "#000" }}>
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 fixed lg:relative z-40 w-[220px] min-h-screen transition-transform border-r`} style={{ background: "#0A0A0A", borderColor: "#1A1A1A" }}>
        <div className="px-4 py-5 border-b" style={{ borderColor: "#1A1A1A" }}>
          <h1 className="text-[15px] font-bold" style={{ color: "#F9E741" }}>SHANSI ADMIN</h1>
        </div>
        <nav className="py-2">
          {NAV_ITEMS.map((it) => {
            const active = it.id === ACTIVE_ID;
            return (
              <button key={it.id} onClick={() => { router.push(it.href); setSidebarOpen(false); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-[13px] transition-all"
                style={{ background: active ? "#F9E74110" : "transparent", color: active ? "#F9E741" : "#A0A0A0", borderLeft: active ? "2px solid #F9E741" : "2px solid transparent" }}
              >
                <NavIcon id={it.id} active={active} />
                <span>{it.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      {/* Main */}
      <main className="flex-1 min-w-0">
        <header className="flex items-center justify-between px-4 lg:px-8 h-14 border-b" style={{ borderColor: "#1A1A1A", background: "#0A0A0A" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1" onClick={() => setSidebarOpen(true)}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5" strokeLinecap="round"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
            </button>
            <h1 className="text-[16px] font-semibold" style={{ color: "#FFFFFF" }}>Offers</h1>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all hover:opacity-80" style={{ background: "#F9E741", color: "#000" }}>
            + ახალი ოფერი
          </button>
        </header>

        <div className="p-4 lg:p-8">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="px-3 py-2 rounded-[8px] text-[13px] outline-none" style={{ background: "#111", color: "#FFF", border: "1px solid #252525" }}>
              <option value="">ყველა ტიპი</option>
              <option value="featured">Featured</option>
              <option value="flash">Flash</option>
              <option value="partner">Partner</option>
            </select>
            <select value={filterActive} onChange={(e) => setFilterActive(e.target.value)} className="px-3 py-2 rounded-[8px] text-[13px] outline-none" style={{ background: "#111", color: "#FFF", border: "1px solid #252525" }}>
              <option value="">ყველა სტატუსი</option>
              <option value="true">აქტიური</option>
              <option value="false">გამორთული</option>
            </select>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 rounded-[12px] border" style={{ background: "#111", borderColor: "#252525" }}>
              <p className="text-[14px]" style={{ color: "#666" }}>ოფერები არ მოიძებნა</p>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111", borderColor: "#252525" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#0A0A0A", borderBottom: "1px solid #1A1A1A" }}>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>მერჩანტი</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ტიპი</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>Boosted</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>Normal</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>სტ/ბოლ</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>აქტ.</th>
                    <th className="text-right px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ქმედებები</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((o) => {
                    const tc = typeColor(o.offerType);
                    return (
                      <tr key={o.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            {o.merchant?.logoUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={o.merchant.logoUrl} alt="" className="w-8 h-8 rounded-[6px] object-cover shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "#252525" }}>
                                <span className="text-[11px]" style={{ color: "#666" }}>{(o.merchant?.businessName || "?").slice(0, 1).toUpperCase()}</span>
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-[13px] font-medium truncate" style={{ color: "#FFF" }}>{o.merchant?.businessName || "—"}</div>
                              <div className="text-[11px] font-mono" style={{ color: "#F9E741" }}>{o.merchant?.merchantCode || ""}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <span className="inline-block px-2 py-1 rounded-[6px] text-[11px] font-medium" style={{ background: tc.bg, color: tc.fg }}>
                            {typeLabel(o.offerType)}
                          </span>
                        </td>
                        <td className="px-3 py-3 text-[13px] font-bold" style={{ color: "#22C55E" }}>{o.boostedRate}%</td>
                        <td className="px-3 py-3 text-[13px]" style={{ color: "#A0A0A0" }}>{o.normalRate ? `${o.normalRate}%` : "—"}</td>
                        <td className="px-3 py-3 text-[11px]" style={{ color: "#A0A0A0" }}>
                          {fmtDate(o.startsAt)} → {fmtDate(o.endsAt)}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            onClick={() => toggleActive(o)}
                            className="relative inline-flex items-center rounded-full transition-all"
                            style={{ width: 36, height: 20, background: o.isActive ? "#22C55E" : "#333" }}
                          >
                            <span className="inline-block rounded-full bg-white transition-all" style={{ width: 14, height: 14, transform: `translateX(${o.isActive ? 18 : 3}px)` }} />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-right">
                          <button onClick={() => openEdit(o)} className="text-[12px] px-2 py-1 rounded-[6px] mr-1" style={{ background: "#F9E74120", color: "#F9E741" }}>რედ.</button>
                          <button onClick={() => handleDelete(o)} className="text-[12px] px-2 py-1 rounded-[6px]" style={{ background: "#EF444420", color: "#EF4444" }}>წაშლა</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[12px] border p-6" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold" style={{ color: "#FFF" }}>{editingId ? "რედაქტირება" : "ახალი ოფერი"}</h3>
              <button onClick={() => setModalOpen(false)} className="transition-all hover:opacity-70">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666" strokeWidth="2" strokeLinecap="round"><line x1="5" y1="5" x2="13" y2="13" /><line x1="13" y1="5" x2="5" y2="13" /></svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Merchant dropdown */}
              <div>
                <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>მერჩანტი *</label>
                <div className="flex items-center gap-2">
                  {(() => {
                    const sel = merchantOptions.find((m) => m.id === form.merchant_id);
                    return sel?.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={sel.logoUrl} alt="" className="w-10 h-10 rounded-[6px] object-cover shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-[6px] flex items-center justify-center shrink-0" style={{ background: "#111", border: "1px solid #252525" }}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.8"><path d="M2 6l1.5-4h17L22 6M2 6v14h20V6M2 6h20M7 20v-6h4v6" /></svg>
                      </div>
                    );
                  })()}
                  <select value={form.merchant_id} onChange={(e) => setForm({ ...form, merchant_id: e.target.value })} style={{ ...inputStyle, appearance: "none" }}>
                    <option value="">— აირჩიე მერჩანტი —</option>
                    {merchantOptions.map((m) => (
                      <option key={m.id} value={m.id}>{m.merchantCode ? `${m.merchantCode} · ` : ""}{m.businessName}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Offer type — 3 clickable cards */}
              <div>
                <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>ტიპი</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["featured", "flash", "partner"] as const).map((t) => {
                    const active = form.offer_type === t;
                    const tc = typeColor(t);
                    return (
                      <button key={t} onClick={() => setForm({ ...form, offer_type: t })}
                        className="py-3 rounded-[8px] text-[13px] font-bold transition-all"
                        style={{ background: active ? tc.bg : "#0F0F0F", border: `1px solid ${active ? tc.fg : "#252525"}`, color: active ? tc.fg : "#A0A0A0" }}
                      >
                        {typeLabel(t)}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Rates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>Boosted %</label>
                  <input type="number" min="0" max="100" step="1" value={form.boosted_rate} onChange={(e) => setForm({ ...form, boosted_rate: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>Normal %</label>
                  <input type="number" min="0" max="100" step="1" value={form.normal_rate} onChange={(e) => setForm({ ...form, normal_rate: e.target.value })} style={inputStyle} />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>სათაური</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Extra cashback today" style={inputStyle} />
              </div>

              {/* Description */}
              <div>
                <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>აღწერა</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="2x cashback on coffee today only" style={{ ...inputStyle, resize: "none" }} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>დალაგების ნომერი</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>აქტიური</label>
                  <button
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className="relative inline-flex items-center rounded-full transition-all"
                    style={{ width: 44, height: 24, background: form.is_active ? "#22C55E" : "#333" }}
                  >
                    <span className="inline-block rounded-full bg-white transition-all" style={{ width: 18, height: 18, transform: `translateX(${form.is_active ? 22 : 3}px)` }} />
                  </button>
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>იწყება</label>
                  <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1.5 block font-semibold uppercase" style={{ color: "#666" }}>მთავრდება</label>
                  <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} style={inputStyle} />
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-medium" style={{ background: "#252525", color: "#A0A0A0" }}>გაუქმება</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold disabled:opacity-50" style={{ background: "#F9E741", color: "#000" }}>
                {saving ? "იწერება..." : "შენახვა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] px-4 py-3 rounded-[10px] text-[13px] font-medium"
          style={{ background: toast.type === "error" ? "#EF444420" : "#22C55E20", color: toast.type === "error" ? "#EF4444" : "#22C55E", border: `1px solid ${toast.type === "error" ? "#EF444440" : "#22C55E40"}` }}
        >
          {toast.msg}
        </div>
      )}
    </div>
  );
}

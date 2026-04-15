"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  getTicketsAdmin,
  createTicket,
  updateTicket,
  deleteTicket,
  getMerchants,
  type AdminTicket,
} from "@/services/admin";

function NavIcon({ id, active }: { id: string; active: boolean }) {
  const c = active ? "#F9E741" : "#666666";
  const icons: Record<string, JSX.Element> = {
    dashboard: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><rect x="2" y="2" width="6" height="6" rx="1"/><rect x="10" y="2" width="6" height="6" rx="1"/><rect x="2" y="10" width="6" height="6" rx="1"/><rect x="10" y="10" width="6" height="6" rx="1"/></svg>,
    users: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><circle cx="7" cy="6" r="3"/><path d="M1 16c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>,
    merchants: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 6l1.5-4h11L16 6"/><path d="M2 6v10h14V6"/></svg>,
    offers: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 9V3a1 1 0 011-1h6l7 7-7 7-7-7z"/></svg>,
    tickets: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 5h14v3a1.5 1.5 0 000 3v3H2v-3a1.5 1.5 0 000-3V5z"/><line x1="8" y1="5" x2="8" y2="16" strokeDasharray="1 1.5"/></svg>,
    promos: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><rect x="2" y="5" width="14" height="10" rx="2"/></svg>,
    transactions: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><rect x="2" y="4" width="14" height="10" rx="2"/></svg>,
    games: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M6 3h6l3 4-6 8-6-8 3-4z"/></svg>,
    referrals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><circle cx="5" cy="7" r="2.5"/><circle cx="13" cy="7" r="2.5"/></svg>,
    withdrawals: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M9 14V4M5 8l4-4 4 4"/></svg>,
    finance: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 16V8l3-2 4 3 3-4 4 3v8"/></svg>,
    village: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><path d="M2 16V8l7-5.5L16 8v8"/></svg>,
    algorithm: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><circle cx="9" cy="9" r="3"/></svg>,
    system: <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.5"><circle cx="9" cy="9" r="2.5"/></svg>,
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

const ACTIVE_ID = "tickets";

// Category presets — chooses which back-side fields are relevant
const CATEGORY_OPTIONS = [
  { value: "cinema", label: "🎬 Cinema (კინო)", emoji: "🎬", showSeating: true },
  { value: "event", label: "🎤 Event / Concert (ღონისძიება)", emoji: "🎤", showSeating: true },
  { value: "theatre", label: "🎭 Theatre (თეატრი)", emoji: "🎭", showSeating: true },
  { value: "sport", label: "⚽ Sport Match (სპორტი)", emoji: "⚽", showSeating: true },
  { value: "cafe", label: "☕ Cafe (კაფე)", emoji: "☕", showSeating: false },
  { value: "restaurant", label: "🍽 Restaurant (რესტორანი)", emoji: "🍽", showSeating: false },
  { value: "bar", label: "🍸 Bar / Club (ბარი)", emoji: "🍸", showSeating: false },
  { value: "gamelounge", label: "🎮 Game Lounge (გეიმინგი)", emoji: "🎮", showSeating: false },
  { value: "billiard", label: "🎱 Billiard (ბილიარდი)", emoji: "🎱", showSeating: false },
  { value: "bowling", label: "🎳 Bowling (ბოულინგი)", emoji: "🎳", showSeating: false },
  { value: "karaoke", label: "🎤 Karaoke (კარაოკე)", emoji: "🎤", showSeating: false },
  { value: "escape", label: "🗝 Escape Room", emoji: "🗝", showSeating: false },
  { value: "gym", label: "💪 Gym / Fitness (სპორტდარბაზი)", emoji: "💪", showSeating: false },
  { value: "spa", label: "💆 Spa / Beauty (სპა)", emoji: "💆", showSeating: false },
  { value: "retail", label: "🛍 Retail (მაღაზია)", emoji: "🛍", showSeating: false },
  { value: "service", label: "💼 Service (სერვისი)", emoji: "💼", showSeating: false },
  { value: "other", label: "🎫 Other (სხვა)", emoji: "🎫", showSeating: false },
];

// Map merchant.category → ticket category preset
function mapMerchantCategory(mc: string | null | undefined): string {
  const c = (mc || "").toLowerCase();
  if (CATEGORY_OPTIONS.find((o) => o.value === c)) return c;
  if (c === "food") return "restaurant";
  if (c === "grocery") return "retail";
  if (c === "pharmacy") return "service";
  if (c === "entertainment") return "event";
  return "other";
}

function categoryMeta(value: string) {
  return CATEGORY_OPTIONS.find((c) => c.value === value) || CATEGORY_OPTIONS[CATEGORY_OPTIONS.length - 1];
}

async function fileToCompressedBase64(file: File, maxDim = 400, quality = 0.85): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const ratio = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = reject;
      img.src = reader.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

type ActiveMerchant = {
  id: string;
  businessName: string;
  businessNameKa?: string | null;
  category: string;
  logoUrl?: string | null;
};

const emptyForm = {
  merchant_id: "" as string,
  logo_url: "" as string | null,
  category: "cinema",
  title: "",
  title_ka: "",
  brand: "SHANSI",
  validity: "7 დღე",
  type: "ერთჯერადი",
  price: "0",
  bonus: "+ 0₾",
  person_name: "",
  screen: "",
  row: "",
  seat: "",
  social: "",
  terms: "", // newline-separated in form, converted to array on submit
  website: "WWW.SHANSI.GE",
  sort_order: "0",
  is_active: true,
};

export default function TicketsAdminPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [rows, setRows] = useState<AdminTicket[]>([]);
  const [activeMerchants, setActiveMerchants] = useState<ActiveMerchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<typeof emptyForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchList = useCallback(async () => {
    try {
      setLoading(true);
      const res: any = await getTicketsAdmin();
      setRows(res?.tickets || []);
    } catch {
      showToast("ჩატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  // Load active merchants once for the dropdown
  useEffect(() => {
    (async () => {
      try {
        const res: any = await getMerchants("active", 1, 500);
        setActiveMerchants(
          (res?.merchants || []).map((m: any) => ({
            id: m.id,
            businessName: m.businessName,
            businessNameKa: m.businessNameKa,
            category: m.category,
            logoUrl: m.logoUrl,
          }))
        );
      } catch {
        // non-fatal — admin can still create with manual entry
      }
    })();
  }, []);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (t: AdminTicket) => {
    setEditingId(t.id);
    // Map legacy free-text category to one of our presets if possible
    const matched = CATEGORY_OPTIONS.find((c) => c.value.toLowerCase() === (t.category || "").toLowerCase());
    setForm({
      merchant_id: t.merchantId || "",
      logo_url: t.logoUrl || "",
      category: matched?.value || "other",
      title: t.title,
      title_ka: t.titleKa,
      brand: t.brand,
      validity: t.validity,
      type: t.type,
      price: t.price,
      bonus: t.bonus,
      person_name: t.personName,
      screen: t.screen || "",
      row: t.row || "",
      seat: t.seat || "",
      social: t.social || "",
      terms: (t.terms || []).join("\n"),
      website: t.website,
      sort_order: String(t.sortOrder),
      is_active: t.isActive,
    });
    setModalOpen(true);
  };

  const selectMerchant = (mid: string) => {
    if (!mid) {
      // Detach merchant — keep current manual fields
      setForm((p) => ({ ...p, merchant_id: "" }));
      return;
    }
    const m = activeMerchants.find((x) => x.id === mid);
    if (!m) return;
    const cat = mapMerchantCategory(m.category);
    setForm((p) => ({
      ...p,
      merchant_id: m.id,
      logo_url: m.logoUrl || p.logo_url,
      category: cat,
      brand: m.businessName?.toUpperCase().slice(0, 12) || p.brand,
      title: p.title || m.businessName,
      title_ka: p.title_ka || m.businessNameKa || m.businessName,
    }));
  };

  const handleLogoFile = async (file: File) => {
    setLogoUploading(true);
    try {
      const b64 = await fileToCompressedBase64(file);
      setForm((p) => ({ ...p, logo_url: b64 }));
    } catch {
      showToast("სურათის ატვირთვა ვერ მოხერხდა", "error");
    } finally {
      setLogoUploading(false);
      if (logoInputRef.current) logoInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.brand.trim()) {
      showToast("title, brand სავალდებულოა", "error");
      return;
    }
    setSaving(true);
    try {
      const meta = categoryMeta(form.category);
      const payload: Record<string, any> = {
        merchant_id: form.merchant_id || null,
        emoji: meta.emoji, // fallback used only if no logo
        logo_url: form.logo_url || null,
        category: form.category,
        title: form.title.trim(),
        title_ka: form.title_ka.trim() || form.title.trim(),
        brand: form.brand.trim(),
        validity: form.validity.trim(),
        type: form.type.trim(),
        price: form.price.trim(),
        bonus: form.bonus.trim(),
        person_name: form.person_name.trim(),
        screen: meta.showSeating ? (form.screen.trim() || null) : null,
        row: meta.showSeating ? (form.row.trim() || null) : null,
        seat: meta.showSeating ? (form.seat.trim() || null) : null,
        social: form.social.trim() || null,
        terms: form.terms.split("\n").map((s) => s.trim()).filter(Boolean),
        website: form.website.trim(),
        sort_order: parseInt(form.sort_order) || 0,
        is_active: form.is_active,
      };
      if (editingId) {
        await updateTicket(editingId, payload);
        showToast("შენახულია");
      } else {
        await createTicket(payload);
        showToast("შეიქმნა — სერიული ნომერი ავტომატურად დაგენერირდა");
      }
      setModalOpen(false);
      await fetchList();
    } catch (e: any) {
      showToast(e?.message || "შეცდომა", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteTicket(id);
      showToast("წაიშალა");
      setDeleteConfirm(null);
      await fetchList();
    } catch { showToast("წაშლა ვერ მოხერხდა", "error"); }
  };

  const toggleActive = async (t: AdminTicket) => {
    try {
      await updateTicket(t.id, { is_active: !t.isActive });
      await fetchList();
    } catch { showToast("ვერ შესრულდა", "error"); }
  };

  const inputStyle: React.CSSProperties = {
    width: "100%", padding: "10px 12px", fontSize: "13px",
    background: "#0F0F0F", border: "1px solid #252525", borderRadius: 8,
    color: "#FFF", outline: "none",
  };

  const showSeating = categoryMeta(form.category).showSeating;

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
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="#A0A0A0" strokeWidth="1.5"><line x1="4" y1="7" x2="18" y2="7" /><line x1="4" y1="11" x2="18" y2="11" /><line x1="4" y1="15" x2="18" y2="15" /></svg>
            </button>
            <h1 className="text-[16px] font-semibold" style={{ color: "#FFFFFF" }}>Tickets</h1>
          </div>
          <button onClick={openCreate} className="px-4 py-2 rounded-[8px] text-[13px] font-medium transition-all hover:opacity-80" style={{ background: "#F9E741", color: "#000" }}>
            + ახალი ტიკეტი
          </button>
        </header>

        <div className="p-4 lg:p-8">
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-20 rounded-[12px] border" style={{ background: "#111", borderColor: "#252525" }}>
              <p className="text-[14px] mb-3" style={{ color: "#666" }}>ტიკეტები არ არის. დაამატე პირველი!</p>
              <button onClick={openCreate} className="px-4 py-2 rounded-[8px] text-[13px] font-bold" style={{ background: "#F9E741", color: "#000" }}>
                + ახალი ტიკეტი
              </button>
            </div>
          ) : (
            <div className="rounded-[12px] border overflow-hidden" style={{ background: "#111", borderColor: "#252525" }}>
              <table className="w-full">
                <thead>
                  <tr style={{ background: "#0A0A0A", borderBottom: "1px solid #1A1A1A" }}>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ტიკეტი</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ბრენდი</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>კატეგორია</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>სერიული</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ფასი / ბონუსი</th>
                    <th className="text-left px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>აქტ.</th>
                    <th className="text-right px-3 py-3 text-[11px] font-semibold uppercase tracking-wider" style={{ color: "#666" }}>ქმედებები</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((t) => (
                    <tr key={t.id} style={{ borderBottom: "1px solid #1A1A1A" }}>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-2">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt="" style={{ width: 32, height: 32, borderRadius: 6, objectFit: "cover", background: "#fff" }} />
                          ) : (
                            <span style={{ fontSize: 24 }}>{t.emoji}</span>
                          )}
                          <div>
                            <div className="text-[13px] font-medium" style={{ color: "#FFF" }}>{t.title}</div>
                            <div className="text-[11px]" style={{ color: "#666" }}>{t.titleKa}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[12px] font-mono font-bold" style={{ color: "#F9E741" }}>{t.brand}</td>
                      <td className="px-3 py-3 text-[12px]" style={{ color: "#A0A0A0" }}>{t.category}</td>
                      <td className="px-3 py-3 text-[11px] font-mono" style={{ color: "#888" }}>{t.serial}</td>
                      <td className="px-3 py-3 text-[12px]">
                        <span style={{ color: "#FFF" }}>{t.price}</span>{" "}
                        <span style={{ color: "#22C55E" }}>{t.bonus}</span>
                      </td>
                      <td className="px-3 py-3">
                        <button
                          onClick={() => toggleActive(t)}
                          className="relative inline-flex items-center rounded-full transition-all"
                          style={{ width: 36, height: 20, background: t.isActive ? "#22C55E" : "#333" }}
                        >
                          <span className="inline-block rounded-full bg-white transition-all" style={{ width: 14, height: 14, transform: `translateX(${t.isActive ? 18 : 3}px)` }} />
                        </button>
                      </td>
                      <td className="px-3 py-3 text-right">
                        <button onClick={() => openEdit(t)} className="text-[12px] px-2 py-1 rounded-[6px] mr-1" style={{ background: "#F9E74120", color: "#F9E741" }}>რედ.</button>
                        <button onClick={() => setDeleteConfirm(t.id)} className="text-[12px] px-2 py-1 rounded-[6px]" style={{ background: "#EF444420", color: "#EF4444" }}>წაშლა</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setModalOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[560px] max-h-[92vh] overflow-y-auto rounded-[12px] border p-6" style={{ background: "#1A1A1A", borderColor: "#252525" }}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-[16px] font-semibold" style={{ color: "#FFF" }}>{editingId ? "რედაქტირება" : "ახალი ტიკეტი"}</h3>
              <button onClick={() => setModalOpen(false)}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#666" strokeWidth="2"><line x1="5" y1="5" x2="13" y2="13" /><line x1="13" y1="5" x2="5" y2="13" /></svg>
              </button>
            </div>

            <div className="space-y-3">
              {/* Merchant picker — pre-fills logo, brand, category, title */}
              <div className="rounded-[10px] p-3" style={{ background: "#0F0F0F", border: "1px solid #252525" }}>
                <label className="text-[11px] mb-2 block font-semibold" style={{ color: "#F9E741" }}>
                  🏪 აირჩიე მერჩანტი (არასავალდებულო)
                </label>
                <select
                  value={form.merchant_id}
                  onChange={(e) => selectMerchant(e.target.value)}
                  style={{ ...inputStyle, appearance: "none" as const }}
                >
                  <option value="">— ცარიელი (manual entry) —</option>
                  {activeMerchants.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.businessName}{m.businessNameKa ? ` (${m.businessNameKa})` : ""} — {m.category}
                    </option>
                  ))}
                </select>
                {form.merchant_id && (
                  <div className="flex items-center gap-2 mt-2">
                    {(() => {
                      const m = activeMerchants.find((x) => x.id === form.merchant_id);
                      return m ? (
                        <>
                          {m.logoUrl ? (
                            <img src={m.logoUrl} alt="" style={{ width: 28, height: 28, borderRadius: 6, objectFit: "cover", background: "#fff" }} />
                          ) : (
                            <div style={{ width: 28, height: 28, borderRadius: 6, background: "#222" }} />
                          )}
                          <div className="text-[11px]" style={{ color: "#22C55E" }}>
                            ✓ ლოგო, ბრენდი და კატეგორია გადმოიწერა — შეგიძლია გადააწერო ქვემოთ
                          </div>
                        </>
                      ) : null;
                    })()}
                  </div>
                )}
                {!form.merchant_id && activeMerchants.length === 0 && (
                  <div className="text-[10px] mt-2" style={{ color: "#666" }}>
                    აქტიური მერჩანტი არ მოიძებნა — ჯერ დაამატე მერჩანტი Merchants გვერდიდან
                  </div>
                )}
              </div>

              {/* Logo upload */}
              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>
                  ლოგო {form.merchant_id ? "(მერჩანტიდან გადმოიწერა — შეგიძლია შეცვლა)" : "(მერჩანტის ლოგო)"}
                </label>
                <div
                  onClick={() => !logoUploading && logoInputRef.current?.click()}
                  className="flex items-center gap-3 p-2 rounded-[8px] cursor-pointer transition-all hover:brightness-110"
                  style={{ background: "#0F0F0F", border: "1px dashed #333" }}
                >
                  <div
                    style={{
                      width: 56, height: 56, borderRadius: 8, background: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      overflow: "hidden", flexShrink: 0,
                    }}
                  >
                    {form.logo_url ? (
                      <img src={form.logo_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <span style={{ fontSize: 28 }}>{categoryMeta(form.category).emoji}</span>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div className="text-[12px]" style={{ color: form.logo_url ? "#22C55E" : "#A0A0A0" }}>
                      {logoUploading ? "ატვირთვა..." : form.logo_url ? "✓ ლოგო ატვირთულია" : "📤 ჩააწექი ლოგოს ასატვირთად"}
                    </div>
                    <div className="text-[10px] mt-0.5" style={{ color: "#666" }}>
                      ლოგო რომ არ ატვირთო, კატეგორიის ემოჯი გამოჩნდება
                    </div>
                  </div>
                  {form.logo_url && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setForm((p) => ({ ...p, logo_url: "" })); }}
                      className="text-[11px] px-2 py-1 rounded-[6px]"
                      style={{ background: "#EF444420", color: "#EF4444" }}
                    >
                      წაშლა
                    </button>
                  )}
                </div>
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleLogoFile(f);
                  }}
                />
              </div>

              {/* Category dropdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>კატეგორია *</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    style={{ ...inputStyle, appearance: "none" as const }}
                  >
                    {CATEGORY_OPTIONS.map((c) => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ბრენდი (badge) *</label>
                  <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} placeholder="SHANSI" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>სახელი (EN) *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Cinepark" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ქართული დასახელება</label>
                  <input value={form.title_ka} onChange={(e) => setForm({ ...form, title_ka: e.target.value })} placeholder="კინოს ბილეთი" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>მოქმედების ვადა</label>
                  <input value={form.validity} onChange={(e) => setForm({ ...form, validity: e.target.value })} placeholder="7 დღე" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ტიპი</label>
                  <input value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} placeholder="ერთჯერადი" style={inputStyle} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ფასი (სტაბზე)</label>
                  <input value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="2.50" style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ბონუსი (Cash)</label>
                  <input value={form.bonus} onChange={(e) => setForm({ ...form, bonus: e.target.value })} placeholder="+ 1₾" style={inputStyle} />
                </div>
              </div>

              <div>
                <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>მფლობელი (ფრონტ სახელი)</label>
                <input value={form.person_name} onChange={(e) => setForm({ ...form, person_name: e.target.value })} placeholder="Adam Park" style={inputStyle} />
              </div>

              {/* Sensitive — shown only after activation */}
              <div className="pt-3 mt-2" style={{ borderTop: "1px dashed #333" }}>
                <p className="text-[11px] mb-3" style={{ color: "#F9E741" }}>🔒 Sensitive (ნაჩვენებია მხოლოდ activation-ის შემდეგ)</p>

                {!editingId && (
                  <div className="mb-3 px-3 py-2 rounded-[8px] text-[11px]" style={{ background: "#F9E74110", color: "#F9E741", border: "1px solid #F9E74130" }}>
                    ℹ️ სერიული ნომერი ავტომატურად დაგენერირდება შენახვისას (უნიკალური)
                  </div>
                )}

                {/* Cinema/Event-only fields */}
                {showSeating && (
                  <div>
                    <p className="text-[11px] mb-2" style={{ color: "#888" }}>დარბაზის/ადგილის ინფო ({categoryMeta(form.category).label})</p>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>Screen / Hall</label>
                        <input value={form.screen} onChange={(e) => setForm({ ...form, screen: e.target.value })} placeholder="18" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>Row</label>
                        <input value={form.row} onChange={(e) => setForm({ ...form, row: e.target.value })} placeholder="H" style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>Seat</label>
                        <input value={form.seat} onChange={(e) => setForm({ ...form, seat: e.target.value })} placeholder="55" style={inputStyle} />
                      </div>
                    </div>
                  </div>
                )}

                <div className="mt-3">
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>Social handles</label>
                  <input value={form.social} onChange={(e) => setForm({ ...form, social: e.target.value })} placeholder="f X @SHANSIAPP" style={inputStyle} />
                </div>

                <div className="mt-3">
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>წესები (ერთი ხაზი = ერთი პუნქტი)</label>
                  <textarea
                    rows={4}
                    value={form.terms}
                    onChange={(e) => setForm({ ...form, terms: e.target.value })}
                    placeholder={"ერთჯერადად გამოყენებადია\nმოქმედებს 7 დღე\nგადაცემა შეუძლებელია"}
                    style={{ ...inputStyle, resize: "none", fontFamily: "inherit" }}
                  />
                </div>

                <div className="mt-3">
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>ვებსაიტი</label>
                  <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="WWW.SHANSI.GE" style={inputStyle} />
                </div>
              </div>

              {/* Order + Active */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>რიგი (sort)</label>
                  <input type="number" value={form.sort_order} onChange={(e) => setForm({ ...form, sort_order: e.target.value })} style={inputStyle} />
                </div>
                <div>
                  <label className="text-[11px] mb-1 block" style={{ color: "#A0A0A0" }}>აქტიური</label>
                  <button
                    onClick={() => setForm({ ...form, is_active: !form.is_active })}
                    className="relative inline-flex items-center rounded-full transition-all"
                    style={{ width: 44, height: 24, background: form.is_active ? "#22C55E" : "#333" }}
                  >
                    <span className="inline-block rounded-full bg-white transition-all" style={{ width: 18, height: 18, transform: `translateX(${form.is_active ? 22 : 3}px)` }} />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => setModalOpen(false)} className="flex-1 py-2.5 rounded-[8px] text-[13px]" style={{ background: "#252525", color: "#A0A0A0" }}>გაუქმება</button>
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-semibold disabled:opacity-50" style={{ background: "#F9E741", color: "#000" }}>
                {saving ? "იწერება..." : "შენახვა"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDeleteConfirm(null)}>
          <div onClick={(e) => e.stopPropagation()} className="w-full max-w-[380px] rounded-[12px] border p-5" style={{ background: "#1A1A1A", borderColor: "#7F1D1D" }}>
            <h3 className="text-[15px] font-bold mb-2" style={{ color: "#EF4444" }}>წავშალოთ?</h3>
            <p className="text-[13px] mb-4" style={{ color: "#A0A0A0" }}>ტიკეტი გაქრება მომხმარებლის გვერდიდან.</p>
            <div className="flex gap-2">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-2.5 rounded-[8px] text-[13px]" style={{ background: "#252525", color: "#A0A0A0" }}>გაუქმება</button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 py-2.5 rounded-[8px] text-[13px] font-bold" style={{ background: "#EF4444", color: "#fff" }}>წაშლა</button>
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

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { loginAdmin } from "@/services/admin";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError("");
    try {
      await loginAdmin(email, password);
      router.push("/admin");
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#000000", fontFamily: "system-ui" }}>
      <div className="w-full max-w-[380px] px-6">
        <h1 className="text-[28px] font-extrabold tracking-wider text-center mb-2" style={{ color: "#F9E741" }}>
          SHANSI
        </h1>
        <p className="text-[13px] text-center mb-8" style={{ color: "#666666" }}>Admin Panel</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#666666" }}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] text-[15px] text-white outline-none"
              style={{ background: "#111111", border: "1px solid #252525" }}
              placeholder="admin@shansi.ge"
              autoFocus
            />
          </div>

          <div className="mb-6">
            <label className="text-[11px] font-medium uppercase tracking-wider mb-1.5 block" style={{ color: "#666666" }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 rounded-[10px] text-[15px] text-white outline-none"
              style={{ background: "#111111", border: "1px solid #252525" }}
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p className="text-[13px] text-center mb-4" style={{ color: "#EF4444" }}>{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3.5 rounded-[10px] text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-40"
            style={{ background: "#F9E741", color: "#000000" }}
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
        </form>
      </div>
    </div>
  );
}

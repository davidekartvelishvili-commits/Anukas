"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getDashboard, isAdminAuthenticated } from "@/services/admin";

export default function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [valid, setValid] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      router.push("/admin/login");
      return;
    }
    getDashboard()
      .then(() => { setValid(true); setChecked(true); })
      .catch(() => {
        localStorage.removeItem("adminToken");
        router.push("/admin/login");
      });
  }, [router]);

  if (!checked || !valid) {
    return (
      <div className="min-h-[100dvh] flex items-center justify-center" style={{ background: "#000000" }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "#F9E741", borderTopColor: "transparent" }} />
      </div>
    );
  }

  return <>{children}</>;
}

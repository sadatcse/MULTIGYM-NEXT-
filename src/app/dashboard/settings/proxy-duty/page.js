"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/hr/HrUi";

// Proxy duty moved to Duty & Overtime → Proxy & Swap Duty (kept so old links work).
export default function ProxyDutyMoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/duty-overtime/duties");
  }, [router]);
  return <Loading rows={3} />;
}

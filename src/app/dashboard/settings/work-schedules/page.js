"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loading } from "@/components/hr/HrUi";

// Work schedules are set per employee in Employee Duty Time (kept so old links work).
export default function WorkSchedulesMoved() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/employee/duty-time");
  }, [router]);
  return <Loading rows={3} />;
}

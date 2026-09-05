"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useMaintenanceApi from "@/hooks/useMaintenanceApi";
import {
  FiTool, FiPlus, FiClock, FiCheckCircle, FiAlertTriangle, FiEye,
  FiUserCheck, FiPlayCircle, FiDollarSign, FiList,
} from "react-icons/fi";

const STATUS_STYLES = {
  OPEN: "bg-sky-500/10 text-sky-500",
  UNDER_REVIEW: "bg-amber-500/10 text-amber-500",
  ASSIGNED: "bg-purple-500/10 text-purple-500",
  IN_PROGRESS: "bg-brand-gold/10 text-brand-gold",
  COMPLETED: "bg-emerald-500/10 text-emerald-500",
};

function StatCard({ label, value, icon: Icon, color }) {
  return (
    <div className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:shadow-md transition-all duration-300 group">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">{label}</span>
          <span className={`text-2xl font-black mt-1 block ${color}`}>{value}</span>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color.replace("text-", "bg-")}/10 ${color} flex items-center justify-center text-xl group-hover:scale-110 transition-transform`}>
          <Icon />
        </div>
      </div>
    </div>
  );
}

export default function MaintenanceDashboardPage() {
  const router = useRouter();
  const { getDashboardStats } = useMaintenanceApi();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const stats = await getDashboardStats();
      setData(stats);
    } catch (err) {
      console.error("Failed to load maintenance dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, [getDashboardStats]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchStats();
  }, [fetchStats]);

  if (loading) {
    return (
      <div className="w-full max-w-[1200px] mx-auto pb-16">
        <SkeletonLoading variant="card" rows={2} />
      </div>
    );
  }

  const isManager = data?.isManager;
  const overview = data?.overview || {};

  return (
    <div className="space-y-6 w-full max-w-[1200px] mx-auto pb-16">
      <Mtitle
        title="Maintenance Dashboard"
        subtitle={isManager ? "Organization-wide maintenance request overview." : "Your maintenance request activity at a glance."}
        rightcontent={
          <Link href="/dashboard/maintenance/create" className="px-4 py-2.5 rounded-2xl bg-brand-red text-white text-xs font-black shadow-lg shadow-brand-red/20 hover:bg-brand-red-dark transition-all flex items-center gap-1.5 cursor-pointer">
            <FiPlus className="text-sm" /> Request Maintenance
          </Link>
        }
      />

      {isManager ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value={overview.total || 0} icon={FiList} color="text-brand-gold" />
            <StatCard label="Open" value={overview.open || 0} icon={FiAlertTriangle} color="text-sky-500" />
            <StatCard label="Under Review" value={overview.underReview || 0} icon={FiEye} color="text-amber-500" />
            <StatCard label="Assigned" value={overview.assigned || 0} icon={FiUserCheck} color="text-purple-500" />
            <StatCard label="In Progress" value={overview.inProgress || 0} icon={FiPlayCircle} color="text-brand-gold" />
            <StatCard label="Completed" value={overview.completed || 0} icon={FiCheckCircle} color="text-emerald-500" />
            <StatCard label="Overdue" value={overview.overdue || 0} icon={FiClock} color="text-brand-red" />
            <StatCard label="Est. Cost" value={`৳${(data?.cost?.estimatedCost || 0).toLocaleString()}`} icon={FiDollarSign} color="text-brand-gold" />
          </div>
          <div className="flex flex-wrap gap-3">
            <Link href="/dashboard/maintenance/requests" className="px-4 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold hover:border-brand-gold transition-all">
              View All Requests →
            </Link>
            <Link href="/dashboard/maintenance/reports" className="px-4 py-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold hover:border-brand-gold transition-all">
              View Reports →
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Requests" value={overview.total || 0} icon={FiList} color="text-brand-gold" />
            <StatCard label="Open" value={overview.open || 0} icon={FiAlertTriangle} color="text-sky-500" />
            <StatCard label="In Progress" value={overview.inProgress || 0} icon={FiPlayCircle} color="text-brand-gold" />
            <StatCard label="Completed" value={overview.completed || 0} icon={FiCheckCircle} color="text-emerald-500" />
          </div>

          <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Recent Requests</h4>
              <Link href="/dashboard/maintenance/my-requests" className="text-xs font-bold text-brand-gold hover:underline">View All →</Link>
            </div>
            {data?.recent?.length > 0 ? (
              <div className="space-y-2">
                {data.recent.map((r) => (
                  <div
                    key={r._id}
                    onClick={() => router.push(`/dashboard/maintenance/${r._id}`)}
                    className="flex items-center justify-between p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-gold/5 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FiTool className="text-brand-gold text-sm" />
                      <span className="text-xs font-bold text-brand-black dark:text-brand-white">{r.issue}</span>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-full ${STATUS_STYLES[r.status] || ""}`}>
                      {r.status?.replace("_", " ")}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light italic">No maintenance requests yet.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}

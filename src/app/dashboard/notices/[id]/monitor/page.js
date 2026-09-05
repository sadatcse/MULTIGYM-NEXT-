"use client";

import React, { useState, useEffect, useCallback, useMemo, use } from "react";
import { useRouter } from "next/navigation";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useNoticeApi from "@/hooks/useNoticeApi";
import useSettingApi from "@/hooks/useSettingApi";
import { exportToExcel, exportToCSV, printHtmlReport } from "@/lib/exportHelper";
import { toast } from "react-toastify";
import {
  FiArrowLeft,
  FiSend,
  FiDownload,
  FiPrinter,
  FiSearch,
  FiFilter,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiEye,
  FiActivity,
  FiRefreshCw,
  FiUsers,
  FiShield,
} from "react-icons/fi";

export default function NoticeMonitoringPage({ params }) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const router = useRouter();

  const { getNoticeMonitoring, sendReminder } = useNoticeApi();
  const { settings } = useSettingApi();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [reminding, setReminding] = useState(false);

  const fetchMonitoring = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getNoticeMonitoring(id, searchTerm, statusFilter);
      setData(res);
    } catch (err) {
      console.error("Failed to load notice monitoring:", err);
      toast.error("Failed to load notice recipient audit matrix");
    } finally {
      setLoading(false);
    }
  }, [id, searchTerm, statusFilter, getNoticeMonitoring]);

  useEffect(() => {
    fetchMonitoring();
  }, [fetchMonitoring]);

  const handleSendReminder = async () => {
    setReminding(true);
    try {
      const res = await sendReminder(id);
      toast.success(res?.message || "Reminders sent successfully!");
      fetchMonitoring();
    } catch (err) {
      console.error("Failed to send reminders:", err);
      toast.error("Failed to send reminders");
    } finally {
      setReminding(false);
    }
  };

  const handleExport = (type) => {
    if (!data?.recipients || data.recipients.length === 0) {
      toast.warning("No recipient data available to export");
      return;
    }

    const exportData = data.recipients.map((r, idx) => {
      const emp = r.employee || {};
      return {
        SL: idx + 1,
        EmployeeName: emp.name || "N/A",
        EmployeeID: emp.employeeId || "N/A",
        Department: emp.department || "N/A",
        Branch: emp.branch || "N/A",
        Status: r.status ? r.status.toUpperCase() : "DELIVERED",
        FirstSeenAt: r.firstSeenAt ? new Date(r.firstSeenAt).toLocaleString() : "Not Seen",
        LastSeenAt: r.lastSeenAt ? new Date(r.lastSeenAt).toLocaleString() : "Not Seen",
        ViewCount: r.viewCount || 0,
        AcknowledgedAt: r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : "Pending",
        IPAddress: r.ipAddress || "N/A",
      };
    });

    if (type === "excel") {
      exportToExcel(exportData, `Notice_Compliance_Report_${data.notice?.title || "Notice"}`);
    } else if (type === "csv") {
      exportToCSV(exportData, `Notice_Compliance_Report_${data.notice?.title || "Notice"}`);
    } else if (type === "print") {
      const headers = ["SL", "Employee Name", "Employee ID", "Department", "Status", "First Seen", "View Count", "Acknowledged At"];
      const rows = data.recipients.map((r, idx) => {
        const emp = r.employee || {};
        return [
          idx + 1,
          emp.name || "N/A",
          emp.employeeId || "N/A",
          emp.department || "N/A",
          (r.status || "DELIVERED").toUpperCase(),
          r.firstSeenAt ? new Date(r.firstSeenAt).toLocaleString() : "Not Seen",
          r.viewCount || 0,
          r.acknowledgedAt ? new Date(r.acknowledgedAt).toLocaleString() : "Pending",
        ];
      });

      printHtmlReport({
        title: `Notice Compliance & Audit Matrix: ${data.notice?.title}`,
        preparedBy: "HR Administration",
        headers,
        rows,
        settings,
      });
    }
  };

  const notice = data?.notice || {};
  const metrics = data?.metrics || {
    totalRecipients: 0,
    seenCount: 0,
    unseenCount: 0,
    ackCount: 0,
    pendingAckCount: 0,
    seenPercentage: "0",
    ackPercentage: "0",
  };
  const recipients = data?.recipients || [];
  const timeline = data?.timeline || [];

  return (
    <div className="space-y-6 pb-12">
      {/* Back Button & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => router.push("/dashboard/notices")}
          className="flex items-center gap-1.5 text-xs font-extrabold text-brand-dark-grey hover:text-brand-gold transition-colors"
        >
          <FiArrowLeft /> Back to Dashboard
        </button>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => handleExport("excel")}
            className="px-3.5 py-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors text-xs font-bold flex items-center gap-1.5"
          >
            <FiDownload className="text-brand-gold" /> Export Excel
          </button>

          <button
            onClick={() => handleExport("print")}
            className="px-4 py-2.5 rounded-xl bg-brand-gold text-brand-black font-extrabold text-xs shadow-md shadow-brand-gold/20 hover:bg-brand-gold-dark transition-all flex items-center gap-1.5"
          >
            <FiPrinter className="text-sm" /> Print Compliance Matrix
          </button>
        </div>
      </div>

      {/* Notice Title Banner */}
      <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey space-y-3 shadow-sm">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-brand-gold/10 text-brand-gold border border-brand-gold/20">
            {notice.category || "General"}
          </span>
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-blue-500/10 text-blue-600 border border-blue-500/20">
            Priority: {notice.priority || "Normal"}
          </span>
          <span className="text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md bg-purple-500/10 text-purple-600 border border-purple-500/20">
            Version: v{notice.version || 1}
          </span>
        </div>

        <h2 className="text-xl font-black text-brand-black dark:text-brand-white leading-tight">
          {notice.title}
        </h2>

        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-2">
          {notice.content}
        </p>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
            Total Recipients
          </span>
          <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
            {metrics.totalRecipients}
          </span>
          <span className="text-[10px] font-extrabold text-brand-gold mt-0.5 block">
            Dispatched staff
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400 block">
            Seen Count ({metrics.seenPercentage}%)
          </span>
          <span className="text-2xl font-black text-blue-500 mt-1 block">
            {metrics.seenCount}
          </span>
          <span className="text-[10px] font-extrabold text-blue-600/80 dark:text-blue-400/80 mt-0.5 block">
            {metrics.unseenCount} not seen yet
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Acknowledged ({metrics.ackPercentage}%)
          </span>
          <span className="text-2xl font-black text-purple-500 mt-1 block">
            {metrics.ackCount}
          </span>
          <span className="text-[10px] font-extrabold text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">
            Compliance verified
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Pending Ack
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {metrics.pendingAckCount}
          </span>
          <span className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
            Awaiting response
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex flex-col justify-between">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Reminder Action
          </span>
          <button
            onClick={handleSendReminder}
            disabled={reminding || metrics.pendingAckCount === 0}
            className="w-full py-2 px-3 rounded-xl bg-emerald-500 text-white font-extrabold text-xs shadow-md hover:bg-emerald-600 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 mt-2"
          >
            <FiSend className="text-xs" />
            <span>{reminding ? "Sending..." : "Send Reminder"}</span>
          </button>
        </div>
      </div>

      {/* Recipient Matrix Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-white dark:bg-brand-charcoal p-3.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40 overflow-x-auto">
          <button
            onClick={() => setStatusFilter("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === "all" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey"
            }`}
          >
            All ({metrics.totalRecipients})
          </button>
          <button
            onClick={() => setStatusFilter("unseen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === "unseen" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey"
            }`}
          >
            Unseen ({metrics.unseenCount})
          </button>
          <button
            onClick={() => setStatusFilter("seen")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === "seen" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey"
            }`}
          >
            Seen ({metrics.seenCount})
          </button>
          <button
            onClick={() => setStatusFilter("pending_ack")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === "pending_ack" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey"
            }`}
          >
            Pending Ack ({metrics.pendingAckCount})
          </button>
          <button
            onClick={() => setStatusFilter("acknowledged")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              statusFilter === "acknowledged" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey"
            }`}
          >
            Acknowledged ({metrics.ackCount})
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search employee by name, ID, dept..."
            className="pl-8 pr-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
          />
        </div>
      </div>

      {/* Recipient Audit Status Table */}
      {loading ? (
        <SkeletonLoading count={5} />
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                <tr>
                  <th className="py-4 px-6 text-center w-12">SL</th>
                  <th className="py-4 px-6">Employee Name & ID</th>
                  <th className="py-4 px-6">Department</th>
                  <th className="py-4 px-6 text-center">Status</th>
                  <th className="py-4 px-6 text-center">First Seen</th>
                  <th className="py-4 px-6 text-center">Views</th>
                  <th className="py-4 px-6 text-center">Acknowledged At</th>
                  <th className="py-4 px-6 text-center">Device / IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 text-xs">
                {recipients.length > 0 ? (
                  recipients.map((item, idx) => {
                    const emp = item.employee || {};
                    return (
                      <tr key={item._id} className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/50 transition-colors">
                        <td className="py-4 px-6 text-center font-bold text-brand-dark-grey">{idx + 1}</td>

                        <td className="py-4 px-6">
                          <div className="font-extrabold text-brand-black dark:text-brand-white">
                            {emp.name || "Unknown Staff"}
                          </div>
                          <div className="text-[10px] font-mono text-brand-gold font-bold">
                            {emp.employeeId || "N/A"}
                          </div>
                        </td>

                        <td className="py-4 px-6 font-bold text-brand-black dark:text-brand-white">
                          {emp.department || "General"}
                        </td>

                        <td className="py-4 px-6 text-center">
                          <span
                            className={`px-2.5 py-1 rounded-full font-black text-[10px] uppercase tracking-wider ${
                              item.status === "acknowledged" || item.status === "acknowledged_late"
                                ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20"
                                : item.status === "seen"
                                ? "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                                : "bg-gray-500/10 text-gray-600 border border-gray-500/20"
                            }`}
                          >
                            {item.status || "delivered"}
                          </span>
                        </td>

                        <td className="py-4 px-6 text-center font-semibold text-brand-dark-grey">
                          {item.firstSeenAt ? new Date(item.firstSeenAt).toLocaleString() : "Not Seen"}
                        </td>

                        <td className="py-4 px-6 text-center font-extrabold text-brand-black dark:text-brand-white">
                          {item.viewCount || 0}
                        </td>

                        <td className="py-4 px-6 text-center font-semibold text-brand-dark-grey">
                          {item.acknowledgedAt ? new Date(item.acknowledgedAt).toLocaleString() : "Pending"}
                        </td>

                        <td className="py-4 px-6 text-center font-mono text-[10px] text-brand-dark-grey">
                          {item.ipAddress || "Internal"}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="8" className="py-12 text-center text-brand-dark-grey">
                      No recipient records match the selected criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Notice Audit Log & Activity Timeline */}
      {timeline.length > 0 && (
        <div className="bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey space-y-4 shadow-sm">
          <h4 className="text-sm font-black text-brand-black dark:text-brand-white uppercase tracking-wider flex items-center gap-2">
            <FiActivity className="text-brand-gold" /> Notice Audit Event Stream ({timeline.length})
          </h4>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
            {timeline.map((event) => {
              const actor = event.actor || {};
              const emp = event.employee || {};
              return (
                <div
                  key={event._id}
                  className="p-3.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <FiShield className="text-brand-gold text-base shrink-0" />
                    <div>
                      <span className="font-extrabold text-brand-black dark:text-brand-white">
                        {actor.name || "System"}
                      </span>{" "}
                      <span className="font-semibold text-brand-dark-grey">
                        performed <strong className="text-brand-gold">{event.eventType}</strong>
                        {emp.name ? ` for ${emp.name} (${emp.employeeId || "N/A"})` : ""}
                      </span>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-brand-dark-grey shrink-0">
                    {new Date(event.timestamp).toLocaleString()}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import useNoticeApi from "@/hooks/useNoticeApi";
import NoticeModal from "@/components/NoticeModal";
import {
  FiBell,
  FiCheckCircle,
  FiAlertTriangle,
  FiClock,
  FiSearch,
  FiFilter,
  FiEye,
  FiFileText,
  FiShield,
  FiRefreshCw,
  FiCalendar,
} from "react-icons/fi";

export default function MyNoticesPage() {
  const { getMyNotices } = useNoticeApi();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ notices: [], stats: { total: 0, unread: 0, pendingAck: 0 } });
  const [selectedTab, setSelectedTab] = useState("all"); // "all" | "unread" | "pending" | "acknowledged"
  const [searchTerm, setSearchTerm] = useState("");
  const [activeNotice, setActiveNotice] = useState(null);

  const last12Months = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const label = d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
      const value = `${year}-${month}`;
      months.push({ value, label, isCurrent: i === 0 });
    }
    return months;
  }, []);

  const [monthFilter, setMonthFilter] = useState(last12Months[0]?.value || "all");

  const matchMonth = (dateString, filterVal) => {
    if (filterVal === "all" || !filterVal) return true;
    if (!dateString) return false;
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return false;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}` === filterVal;
  };

  const fetchNotices = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getMyNotices();
      setData(res || { notices: [], stats: { total: 0, unread: 0, pendingAck: 0 } });
    } catch (err) {
      console.error("Failed to load my notices:", err);
    } finally {
      setLoading(false);
    }
  }, [getMyNotices]);

  useEffect(() => {
    fetchNotices();
  }, [fetchNotices]);

  const filteredNotices = useMemo(() => {
    const list = data.notices || [];
    return list.filter((item) => {
      if (selectedTab === "unread" && item.isSeen) return false;
      if (selectedTab === "pending" && (!item.requiresAcknowledgement || item.isAcknowledged)) return false;
      if (selectedTab === "acknowledged" && !item.isAcknowledged) return false;
      if (!matchMonth(item.publishedAt || item.createdAt, monthFilter)) return false;

      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        item.title?.toLowerCase().includes(s) ||
        item.content?.toLowerCase().includes(s) ||
        item.category?.toLowerCase().includes(s) ||
        item.priority?.toLowerCase().includes(s)
      );
    });
  }, [data.notices, selectedTab, monthFilter, searchTerm]);

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case "Critical":
        return "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30";
      case "Urgent":
        return "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30";
      case "Important":
        return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
      default:
        return "bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Mtitle
          title="My Notices & Announcements"
          subtitle="Official management instructions, HR policies, and announcements issued to you."
        />

        <div className="flex items-center gap-2">
          <button
            onClick={fetchNotices}
            disabled={loading}
            className="p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 text-xs font-bold"
            title="Refresh List"
          >
            <FiRefreshCw className={`text-base ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey block">
            Total Notices
          </span>
          <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
            {data.stats.total || 0}
          </span>
          <span className="text-[10px] font-extrabold text-brand-gold mt-0.5 block">
            Targeted to your account
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 block">
            Unread Notices
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {data.stats.unread || 0}
          </span>
          <span className="text-[10px] font-extrabold text-amber-600/80 dark:text-amber-400/80 mt-0.5 block">
            Requires your attention
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600 dark:text-purple-400 block">
            Pending Ack
          </span>
          <span className="text-2xl font-black text-purple-500 mt-1 block">
            {data.stats.pendingAck || 0}
          </span>
          <span className="text-[10px] font-extrabold text-purple-600/80 dark:text-purple-400/80 mt-0.5 block">
            Must acknowledge
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 block">
            Acknowledged
          </span>
          <span className="text-2xl font-black text-emerald-500 mt-1 block">
            {(data.stats.total || 0) - (data.stats.pendingAck || 0)}
          </span>
          <span className="text-[10px] font-extrabold text-emerald-600/80 dark:text-emerald-400/80 mt-0.5 block">
            Compliance verified
          </span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-brand-white dark:bg-brand-charcoal p-3.5 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        {/* Tabs */}
        <div className="flex items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-xl border border-brand-beige/40 dark:border-brand-dark-grey/40 overflow-x-auto">
          <button
            onClick={() => setSelectedTab("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedTab === "all" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            All Notices ({data.stats.total || 0})
          </button>

          <button
            onClick={() => setSelectedTab("unread")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedTab === "unread" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            Unread ({data.stats.unread || 0})
          </button>

          <button
            onClick={() => setSelectedTab("pending")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedTab === "pending" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            Pending Ack ({data.stats.pendingAck || 0})
          </button>

          <button
            onClick={() => setSelectedTab("acknowledged")}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all ${
              selectedTab === "acknowledged" ? "bg-brand-gold text-brand-black shadow-sm" : "text-brand-dark-grey hover:text-brand-black dark:hover:text-brand-white"
            }`}
          >
            Acknowledged
          </button>
        </div>

        {/* Search & Month Filter */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer"
          >
            <option value="all">All Months</option>
            {last12Months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} {m.isCurrent ? "(This Month)" : ""}
              </option>
            ))}
          </select>

          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark-grey text-xs" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notices by title, category..."
              className="pl-8 pr-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50"
            />
          </div>
        </div>
      </div>

      {/* Notices Grid List */}
      {loading ? (
        <SkeletonLoading count={4} />
      ) : filteredNotices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNotices.map((item) => (
            <div
              key={item.recipientId}
              onClick={() => setActiveNotice(item)}
              className={`p-5 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-4 hover:shadow-lg ${
                !item.isSeen
                  ? "bg-brand-white dark:bg-brand-charcoal border-brand-gold shadow-md shadow-brand-gold/10"
                  : "bg-brand-white dark:bg-brand-charcoal border-brand-beige/60 dark:border-brand-dark-grey"
              }`}
            >
              <div className="space-y-3">
                {/* Header Tags */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-md border ${getPriorityBadge(item.priority)}`}>
                      {item.priority}
                    </span>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey border border-brand-beige/40 dark:border-brand-dark-grey/40">
                      {item.category}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {!item.isSeen && (
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold text-[10px] border border-amber-500/20">
                        UNREAD
                      </span>
                    )}
                    {item.isAcknowledged ? (
                      <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[10px] border border-emerald-500/20 flex items-center gap-1">
                        <FiCheckCircle className="text-[10px]" /> ACKNOWLEDGED
                      </span>
                    ) : item.requiresAcknowledgement ? (
                      <span className="px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 font-extrabold text-[10px] border border-purple-500/20 flex items-center gap-1">
                        <FiAlertTriangle className="text-[10px]" /> PENDING ACK
                      </span>
                    ) : null}
                  </div>
                </div>

                {/* Title */}
                <h4 className="text-base font-black text-brand-black dark:text-brand-white leading-snug line-clamp-2">
                  {item.title}
                </h4>

                {/* Content Snippet */}
                <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light line-clamp-2 leading-relaxed">
                  {item.content}
                </p>
              </div>

              {/* Footer Meta */}
              <div className="pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between text-[11px] text-brand-dark-grey dark:text-brand-gold-light">
                <div className="flex items-center gap-1.5">
                  <FiCalendar className="text-brand-gold" />
                  <span>Published: {new Date(item.publishedAt).toLocaleDateString()}</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveNotice(item);
                  }}
                  className="px-3 py-1 rounded-xl bg-brand-gold/10 hover:bg-brand-gold text-brand-gold hover:text-brand-black font-extrabold transition-colors flex items-center gap-1 text-[11px]"
                >
                  <FiEye /> Read Notice &rarr;
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-brand-white dark:bg-brand-charcoal p-12 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center space-y-3">
          <FiBell className="text-4xl text-brand-gold mx-auto" />
          <h4 className="text-base font-extrabold text-brand-black dark:text-brand-white">No Notices Found</h4>
          <p className="text-xs text-brand-dark-grey max-w-sm mx-auto">
            You are all caught up! There are no notices matching your current filter.
          </p>
        </div>
      )}

      {/* Notice Detail & Acknowledgement Modal */}
      {activeNotice && (
        <NoticeModal
          notice={activeNotice}
          onClose={() => setActiveNotice(null)}
          onRefresh={fetchNotices}
        />
      )}
    </div>
  );
}

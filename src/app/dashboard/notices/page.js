"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import useNoticeApi from "@/hooks/useNoticeApi";
import Swal from "sweetalert2";
import {
  FiPlus,
  FiEye,
  FiEdit3,
  FiTrash2,
  FiSend,
  FiSearch,
  FiCheckCircle,
  FiXCircle,
  FiX,
  FiGrid,
  FiList,
  FiRefreshCw,
  FiUsers,
  FiFileText,
  FiCheckSquare,
} from "react-icons/fi";

const containerVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: "easeOut" } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};
const rowVariants = {
  hidden: { opacity: 0, y: 8 },
  show: (i) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut", delay: Math.min(i, 8) * 0.035 },
  }),
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export default function AdminNoticeDashboardPage() {
  const router = useRouter();
  const { getAdminDashboard, getAllNoticesAdmin, publishNotice, deleteNotice } = useNoticeApi();

  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [notices, setNotices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [viewMode, setViewMode] = useState("table");

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) setViewMode("grid");
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const [monthFilter, setMonthFilter] = useState("all");

  const matchMonth = (dateString, filterVal) => {
    if (filterVal === "all" || !filterVal) return true;
    if (!dateString) return false;
    const dateObj = new Date(dateString);
    if (isNaN(dateObj.getTime())) return false;
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}` === filterVal;
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, list] = await Promise.all([getAdminDashboard(), getAllNoticesAdmin()]);
      setDashboardData(dash);
      setNotices(list || []);
    } catch (err) {
      console.error("Failed to load notice dashboard data:", err);
      Swal.fire({
        title: "Error!",
        text: "Failed to load notice dashboard data.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setLoading(false);
    }
  }, [getAdminDashboard, getAllNoticesAdmin]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePublish = async (id, title, e) => {
    e.stopPropagation();
    try {
      await publishNotice(id);
      Swal.fire({
        title: "Published!",
        text: `Notice "${title}" has been published and dispatched to recipients.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2000,
      });
      fetchData();
    } catch (err) {
      console.error("Failed to publish notice:", err);
      Swal.fire({
        title: "Error!",
        text: err?.response?.data?.message || "Failed to publish notice.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    }
  };

  const handleOpenDelete = (item, e) => {
    e.stopPropagation();
    setDeletingItem(item);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem || isDeleting) return;

    setIsDeleting(true);
    try {
      await deleteNotice(deletingItem._id);
      Swal.fire({
        title: "Deleted!",
        text: `Notice "${deletingItem.title}" and its recipient records have been removed.`,
        icon: "success",
        confirmButtonColor: "#FF1818",
        timer: 2000,
      });
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Failed to delete notice:", err);
      Swal.fire({
        title: "Error!",
        text: err?.response?.data?.message || "Failed to delete notice.",
        icon: "error",
        confirmButtonColor: "#FF1818",
      });
    } finally {
      setIsDeleting(false);
      setDeletingItem(null);
    }
  };

  const filteredNotices = useMemo(() => {
    return notices.filter((n) => {
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false;
      if (statusFilter !== "all" && n.status !== statusFilter) return false;
      if (!matchMonth(n.publishedAt || n.createdAt, monthFilter)) return false;

      if (!searchTerm) return true;
      const s = searchTerm.toLowerCase();
      return (
        n.title?.toLowerCase().includes(s) ||
        n.category?.toLowerCase().includes(s) ||
        n.priority?.toLowerCase().includes(s)
      );
    });
  }, [notices, categoryFilter, statusFilter, monthFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / (limit || 10)));
  const paginatedNotices = useMemo(() => {
    const startIndex = (page - 1) * limit;
    return filteredNotices.slice(startIndex, startIndex + limit);
  }, [filteredNotices, page, limit]);

  const kpis = dashboardData?.kpis || {
    totalNotices: notices.length,
    publishedCount: notices.filter((n) => n.status === "published").length,
    draftCount: notices.filter((n) => n.status === "draft").length,
    totalRecipients: 0,
    totalSeen: 0,
    totalAck: 0,
    seenPercentage: "0",
    ackPercentage: "0",
  };

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <Mtitle
        title="Notice & Acknowledgement Center"
        subtitle="Publish official notices, track employee views, acknowledgements, and audit compliance."
        rightcontent={
          <div className="flex items-center gap-2.5">
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2.5 rounded-2xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
              title="Refresh Notices"
            >
              <FiRefreshCw className={`text-sm ${loading ? "animate-spin" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/dashboard/notices/create"
              className="flex items-center gap-2 px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs rounded-2xl shadow-lg shadow-brand-red/20 scale-100 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
            >
              <FiPlus className="text-base" />
              <span>Create Notice</span>
            </Link>
          </div>
        }
      />

      {/* 4 STAT METRIC CARDS */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
      >
        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-brand-gold/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Notices
              </span>
              <span className="text-2xl font-black text-brand-black dark:text-brand-white mt-1 block">
                {kpis.totalNotices}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiFileText />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-emerald-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Published Notices
              </span>
              <span className="text-2xl font-black text-emerald-500 mt-1 block">
                {kpis.publishedCount}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiCheckCircle />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-sky-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Total Recipients
              </span>
              <span className="text-2xl font-black text-sky-500 mt-1 block">
                {kpis.totalRecipients || 0}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-sky-500/10 text-sky-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiUsers />
            </div>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm hover:border-purple-500/50 transition-all duration-300 group"
        >
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block">
                Seen / Ack Compliance
              </span>
              <span className="text-2xl font-black text-purple-500 mt-1 block">
                {kpis.seenPercentage}% / {kpis.ackPercentage}%
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl font-bold group-hover:scale-110 transition-transform">
              <FiEye />
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* CONTROL BAR */}
      <div className="bg-brand-white dark:bg-brand-charcoal p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-wrap">
          <div className="relative w-full sm:w-64">
            <FiSearch className="absolute left-3.5 top-3 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
              placeholder="Search notice title..."
              className="w-full pl-10 pr-9 py-2 rounded-xl text-xs bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey focus:outline-none focus:ring-2 focus:ring-brand-gold/50 text-brand-black dark:text-brand-white font-bold"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-2.5 text-brand-dark-grey hover:text-brand-black dark:hover:text-white"
              >
                <FiX className="text-sm" />
              </button>
            )}
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Categories</option>
            <option value="General">General</option>
            <option value="HR">HR</option>
            <option value="Policy">Policy</option>
            <option value="Attendance">Attendance</option>
            <option value="Payroll">Payroll</option>
            <option value="Compliance">Compliance</option>
            <option value="Emergency">Emergency</option>
          </select>

          <select
            value={monthFilter}
            onChange={(e) => {
              setMonthFilter(e.target.value);
              setPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-2 outline-none cursor-pointer w-full sm:w-auto"
          >
            <option value="all">All Months</option>
            {last12Months.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label} {m.isCurrent ? "(This Month)" : ""}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            {["all", "published", "draft", "archived"].map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setStatusFilter(tab);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === tab
                    ? "bg-brand-gold text-brand-midnight shadow-xs"
                    : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer"
          >
            <option value={10}>10 per page</option>
            <option value={20}>20 per page</option>
            <option value={50}>50 per page</option>
            <option value={100}>100 per page</option>
          </select>

          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center gap-1">
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "table"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Table View"
            >
              <FiList className="text-sm" />
            </button>
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-xl transition-all cursor-pointer ${
                viewMode === "grid"
                  ? "bg-brand-gold text-brand-midnight shadow-xs"
                  : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
              title="Grid Card View"
            >
              <FiGrid className="text-sm" />
            </button>
          </div>
        </div>
      </div>

      {/* NOTICES LIST */}
      {loading ? (
        <SkeletonLoading variant={viewMode === "table" ? "table" : "card"} rows={5} />
      ) : paginatedNotices.length === 0 ? (
        <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl p-12 border border-brand-beige/50 dark:border-brand-dark-grey/50 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-16 h-16 bg-brand-gold/10 text-brand-gold rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
            <FiFileText />
          </div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">
            No Notices Found
          </h3>
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6">
            {searchTerm || statusFilter !== "all" || categoryFilter !== "all"
              ? "No notices match your active filters."
              : "No official notices have been drafted or published yet."}
          </p>
          <Link
            href="/dashboard/notices/create"
            className="inline-block px-5 py-2.5 bg-brand-red text-white text-xs font-bold rounded-2xl shadow-md hover:bg-brand-red-dark transition-all"
          >
            + Create First Notice
          </Link>
        </div>
      ) : (
        <>
          {viewMode === "table" && (
            <div className="bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-lg shadow-black/5 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
                    <tr>
                      <th className="py-4 px-6 text-center w-16">#</th>
                      <th className="py-4 px-6">Notice Title</th>
                      <th className="py-4 px-6">Category & Priority</th>
                      <th className="py-4 px-6 text-center">Target Audience</th>
                      <th className="py-4 px-6 text-center w-28">Status</th>
                      <th className="py-4 px-6 text-center">Seen Rate</th>
                      <th className="py-4 px-6 text-center">Ack Rate</th>
                      <th className="py-4 px-6 text-center w-36">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs">
                    <AnimatePresence initial={false}>
                      {paginatedNotices.map((item, idx) => {
                        const rowBusy = isDeleting && deletingItem?._id === item._id;
                        return (
                          <motion.tr
                            key={item._id}
                            custom={idx}
                            variants={rowVariants}
                            initial="hidden"
                            animate="show"
                            exit="exit"
                            layout
                            className={`hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10 transition-all duration-150 cursor-pointer ${
                              rowBusy ? "opacity-50 pointer-events-none" : ""
                            }`}
                            onClick={() => router.push(`/dashboard/notices/${item._id}/monitor`)}
                          >
                            <td className="py-4 px-6 text-center">
                              <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-brand-gold/10 text-brand-gold font-black text-xs">
                                #{idx + 1 + (page - 1) * limit}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="font-extrabold text-brand-black dark:text-brand-white text-sm line-clamp-1">
                                {item.title}
                              </div>
                              <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-mono mt-0.5">
                                Published: {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Not Published"}
                              </div>
                            </td>

                            <td className="py-4 px-6">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="px-2.5 py-0.5 rounded-xl bg-brand-gold/10 text-brand-gold font-extrabold text-[10px]">
                                  {item.category}
                                </span>
                                <span
                                  className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${
                                    item.priority === "Critical"
                                      ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                      : item.priority === "Urgent"
                                      ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                      : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                                  }`}
                                >
                                  {item.priority}
                                </span>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span className="font-bold text-brand-black dark:text-brand-white capitalize bg-brand-offwhite dark:bg-brand-midnight px-2.5 py-1 rounded-xl border border-brand-beige/50 dark:border-brand-dark-grey/50 text-[11px]">
                                {item.targetType} ({item.totalRecipients || 0})
                              </span>
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-extrabold capitalize ${
                                  item.status === "published"
                                    ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                    : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    item.status === "published" ? "bg-emerald-500" : "bg-gray-400"
                                  }`}
                                />
                                {item.status}
                              </span>
                            </td>

                            {/* Seen % Progress Bar */}
                            <td className="py-4 px-6 text-center">
                              <div className="w-24 mx-auto space-y-1">
                                <div className="flex justify-between text-[10px] font-black">
                                  <span>{item.seenPct || 0}%</span>
                                  <span className="text-brand-dark-grey">{item.seenCount || 0}/{item.totalRecipients || 0}</span>
                                </div>
                                <div className="w-full bg-brand-beige/40 dark:bg-brand-dark-grey/40 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-sky-500 h-full rounded-full" style={{ width: `${item.seenPct || 0}%` }}></div>
                                </div>
                              </div>
                            </td>

                            {/* Ack % Progress Bar */}
                            <td className="py-4 px-6 text-center">
                              <div className="w-24 mx-auto space-y-1">
                                <div className="flex justify-between text-[10px] font-black">
                                  <span>{item.ackPct || 0}%</span>
                                  <span className="text-brand-dark-grey">{item.ackCount || 0}/{item.totalRecipients || 0}</span>
                                </div>
                                <div className="w-full bg-brand-beige/40 dark:bg-brand-dark-grey/40 h-1.5 rounded-full overflow-hidden">
                                  <div className="bg-purple-500 h-full rounded-full" style={{ width: `${item.ackPct || 0}%` }}></div>
                                </div>
                              </div>
                            </td>

                            <td className="py-4 px-6 text-center" onClick={(e) => e.stopPropagation()}>
                              <div className="flex items-center justify-center gap-1.5">
                                {item.status === "draft" && (
                                  <button
                                    onClick={(e) => handlePublish(item._id, item.title, e)}
                                    className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                                    title="Publish Notice"
                                  >
                                    <FiSend className="text-sm" />
                                  </button>
                                )}

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/notices/${item._id}/monitor`);
                                  }}
                                  className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                                  title="Monitor Tracking & Recipients"
                                >
                                  <FiEye className="text-sm" />
                                </button>

                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    router.push(`/dashboard/notices/${item._id}/edit`);
                                  }}
                                  className="p-2 rounded-xl text-sky-500 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
                                  title="Edit Notice"
                                >
                                  <FiEdit3 className="text-sm" />
                                </button>

                                <button
                                  onClick={(e) => handleOpenDelete(item, e)}
                                  disabled={rowBusy}
                                  className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                  title="Delete Notice"
                                >
                                  {rowBusy ? (
                                    <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                                  ) : (
                                    <FiTrash2 className="text-sm" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </motion.tr>
                        );
                      })}
                    </AnimatePresence>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {viewMode === "grid" && (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <AnimatePresence initial={false}>
                {paginatedNotices.map((item) => {
                  const rowBusy = isDeleting && deletingItem?._id === item._id;
                  return (
                    <motion.div
                      key={item._id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="show"
                      exit="exit"
                      layout
                      onClick={() => router.push(`/dashboard/notices/${item._id}/monitor`)}
                      className={`bg-brand-white dark:bg-brand-charcoal p-6 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group cursor-pointer ${
                        rowBusy ? "opacity-50 pointer-events-none" : ""
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="px-2.5 py-0.5 rounded-xl bg-brand-gold/10 text-brand-gold font-extrabold text-[10px]">
                              {item.category}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-md font-extrabold text-[10px] border ${
                                item.priority === "Critical"
                                  ? "bg-rose-500/10 text-rose-600 border-rose-500/30"
                                  : item.priority === "Urgent"
                                  ? "bg-amber-500/10 text-amber-600 border-amber-500/30"
                                  : "bg-sky-500/10 text-sky-600 border-sky-500/30"
                              }`}
                            >
                              {item.priority}
                            </span>
                          </div>
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold capitalize ${
                              item.status === "published"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : "bg-gray-500/10 text-gray-500 border border-gray-500/20"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                item.status === "published" ? "bg-emerald-500" : "bg-gray-400"
                              }`}
                            />
                            {item.status}
                          </span>
                        </div>

                        <h3 className="text-base font-black text-brand-black dark:text-brand-white mt-1 line-clamp-2">
                          {item.title}
                        </h3>
                        <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light/70 font-mono mt-1">
                          Published: {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString() : "Not Published"}
                        </p>

                        <div className="my-4 p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight space-y-2.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-brand-dark-grey">Target Audience:</span>
                            <span className="capitalize">{item.targetType} ({item.totalRecipients || 0})</span>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black">
                              <span className="text-sky-500">Seen: {item.seenPct || 0}%</span>
                              <span className="text-brand-dark-grey">{item.seenCount || 0}/{item.totalRecipients || 0}</span>
                            </div>
                            <div className="w-full bg-brand-beige/40 dark:bg-brand-dark-grey/40 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-sky-500 h-full rounded-full" style={{ width: `${item.seenPct || 0}%` }}></div>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-black">
                              <span className="text-purple-500">Acknowledged: {item.ackPct || 0}%</span>
                              <span className="text-brand-dark-grey">{item.ackCount || 0}/{item.totalRecipients || 0}</span>
                            </div>
                            <div className="w-full bg-brand-beige/40 dark:bg-brand-dark-grey/40 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full" style={{ width: `${item.ackPct || 0}%` }}></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                        {item.status === "draft" && (
                          <button
                            onClick={(e) => handlePublish(item._id, item.title, e)}
                            className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all cursor-pointer"
                            title="Publish Notice"
                          >
                            <FiSend className="text-sm" />
                          </button>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/notices/${item._id}/monitor`);
                          }}
                          className="p-2 rounded-xl text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight transition-all cursor-pointer"
                          title="Monitor Tracking & Recipients"
                        >
                          <FiEye className="text-sm" />
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/dashboard/notices/${item._id}/edit`);
                          }}
                          className="p-2 rounded-xl text-sky-500 bg-sky-500/10 hover:bg-sky-500 hover:text-white transition-all cursor-pointer"
                          title="Edit Notice"
                        >
                          <FiEdit3 className="text-sm" />
                        </button>

                        <button
                          onClick={(e) => handleOpenDelete(item, e)}
                          disabled={rowBusy}
                          className="p-2 rounded-xl text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Notice"
                        >
                          {rowBusy ? (
                            <span className="block w-3.5 h-3.5 border-2 border-brand-red border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <FiTrash2 className="text-sm" />
                          )}
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}

          <Pagination currentPage={page} totalPages={totalPages} onPageChange={(newPage) => setPage(newPage)} />
        </>
      )}

      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        onClose={() => !isDeleting && setIsDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        itemName={deletingItem?.title || "Notice"}
        isDeleting={isDeleting}
      />
    </div>
  );
}

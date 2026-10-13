"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FiFileText,
  FiPlus,
  FiSearch,
  FiFilter,
  FiEye,
  FiPrinter,
  FiDownload,
  FiRefreshCw,
  FiTrash2,
  FiUserCheck,
  FiAlertTriangle,
  FiTrendingUp,
  FiCheckCircle,
  FiLayers,
} from "react-icons/fi";
import Mtitle from "@/components/Comon/Mtitle";
import SkeletonLoading from "@/components/Comon/SkeletonLoading";
import Pagination from "@/components/Comon/Pagination";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useBranchApi from "@/hooks/useBranchApi";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import LetterPreviewModal from "@/components/letters/LetterPreviewModal";
import ReissueLetterModal from "@/components/letters/ReissueLetterModal";
import Swal from "sweetalert2";

export default function HrLettersPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const { branches } = useBranchApi();
  const { departments } = useDepartmentApi();

  const {
    letters,
    totalItems,
    totalPages,
    stats,
    loading,
    searchInput,
    setSearchInput,
    letterTypeFilter,
    setLetterTypeFilter,
    branchFilter,
    setBranchFilter,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    startDateFilter,
    setStartDateFilter,
    endDateFilter,
    setEndDateFilter,
    currentPage,
    setCurrentPage,
    itemsPerPage,
    setItemsPerPage,
    deleteLetter,
    reissueLetter,
    logClientAction,
  } = useHrLetterApi();

  // Preview & Reissue Modal States
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isReissueOpen, setIsReissueOpen] = useState(false);

  const handleOpenPreview = (letter) => {
    setSelectedLetter(letter);
    setIsPreviewOpen(true);
    logClientAction(letter._id, "viewed");
  };

  const handleOpenReissue = (letter) => {
    setSelectedLetter(letter);
    setIsReissueOpen(true);
  };

  const handleConfirmReissue = async (id, payload) => {
    try {
      await reissueLetter(id, payload);
      Swal.fire({
        icon: "success",
        title: "Reissued Successfully",
        text: `Version ${(selectedLetter?.version || 1) + 1} has been created and logged.`,
      });
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Reissue Failed",
        text: err?.response?.data?.message || "Failed to reissue letter",
      });
    }
  };

  const handleDelete = async (letter) => {
    const result = await Swal.fire({
      title: "Delete HR Letter?",
      text: `Are you sure you want to delete "${letter.letterNumber}" for ${letter.employeeName}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, Delete",
    });

    if (result.isConfirmed) {
      try {
        await deleteLetter(letter._id);
        Swal.fire("Deleted!", "The letter has been deleted.", "success");
      } catch (err) {
        Swal.fire("Error", "Failed to delete letter.", "error");
      }
    }
  };

  const letterTypeOptions = [
    { value: "all", label: "All Letter Types" },
    { value: "appointment", label: "Appointment Letter (নিয়োগপত্র)" },
    { value: "confirmation", label: "Confirmation Letter (স্থায়ীকরণ)" },
    { value: "promotion", label: "Promotion Letter (পদোন্নতি)" },
    { value: "transfer", label: "Transfer Letter (বদলি)" },
    { value: "promotion_transfer", label: "Promotion & Transfer (পদোন্নতি ও বদলি)" },
    { value: "salary_revision", label: "Salary Revision (বেতন পুনর্নির্ধারণ)" },
    { value: "increment", label: "Increment Letter (বেতন বৃদ্ধি)" },
    { value: "warning", label: "Warning Letter (সতর্কীকরণ)" },
    { value: "show_cause", label: "Show Cause Notice (কারণ দর্শানো)" },
    { value: "appreciation", label: "Appreciation Letter (প্রশংসাপত্র)" },
    { value: "resignation_acceptance", label: "Resignation Acceptance (পদত্যাগ গ্রহণ)" },
    { value: "experience_certificate", label: "Experience Certificate (অভিজ্ঞতা সনদ)" },
    { value: "relieving", label: "Relieving Letter (অবমুক্তি পত্র)" },
  ];

  const getStatusBadge = (status, version) => {
    if (status === "draft") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/30">
          Draft
        </span>
      );
    }
    if (status === "reissued") {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/30">
          Superseded (v{version})
        </span>
      );
    }
    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
        Issued {version > 1 ? `(v${version})` : ""}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="HR Letter & Document Management"
          subtitle="Generate, preview, issue, download, and track official letters for multi-branch employees."
        />

        <div className="flex items-center gap-2">
          {can("hr-letters", "add") && (
            <button
              onClick={() => router.push("/dashboard/hr-letters/create")}
              className="px-5 py-2.5 rounded-2xl bg-brand-primary text-white font-black text-xs hover:bg-brand-secondary transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <FiPlus className="text-sm" />
              <span>Create HR Letter</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-primary/10 text-brand-primary flex items-center justify-center text-xl font-bold">
            <FiLayers />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-brand-dark-grey dark:text-brand-sage">Total Letters</p>
            <h3 className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.totalLetters}</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-xl font-bold">
            <FiCheckCircle />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-brand-dark-grey dark:text-brand-sage">Official Issued</p>
            <h3 className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.issuedLetters}</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-gold/10 text-brand-gold flex items-center justify-center text-xl font-bold">
            <FiTrendingUp />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-brand-dark-grey dark:text-brand-sage">Issued This Month</p>
            <h3 className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.thisMonthCount}</h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center text-xl font-bold">
            <FiFileText />
          </div>
          <div>
            <p className="text-[11px] uppercase font-bold text-brand-dark-grey dark:text-brand-sage">Pending Drafts</p>
            <h3 className="text-2xl font-black text-brand-black dark:text-brand-white">{stats.activeDrafts}</h3>
          </div>
        </div>
      </div>

      {/* Filter and Search Box */}
      <div className="p-5 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search by Employee Name, ID, Letter No, Subject..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2.5 rounded-2xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Letter Type Filter */}
          <div>
            <select
              value={letterTypeFilter}
              onChange={(e) => {
                setLetterTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            >
              {letterTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3.5 py-2.5 rounded-2xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Statuses</option>
              <option value="generated">Official Issued</option>
              <option value="draft">Draft Only</option>
              <option value="reissued">Reissued (Superseded)</option>
            </select>
          </div>
        </div>

        {/* Secondary Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 border-t border-brand-beige/30 dark:border-brand-dark-grey/30">
          {/* Branch Filter */}
          <div>
            <select
              value={branchFilter}
              onChange={(e) => {
                setBranchFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Branches</option>
              {branches?.map((b) => (
                <option key={b._id} value={b.name}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* Department Filter */}
          <div>
            <select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            >
              <option value="all">All Departments</option>
              {departments?.map((d) => (
                <option key={d._id} value={d.name}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center justify-end">
            {(searchInput || letterTypeFilter !== "all" || branchFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all") && (
              <button
                onClick={() => {
                  setSearchInput("");
                  setLetterTypeFilter("all");
                  setBranchFilter("all");
                  setDepartmentFilter("all");
                  setStatusFilter("all");
                  setCurrentPage(1);
                }}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Letters Table */}
      <div className="rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal overflow-hidden shadow-sm">
        {loading ? (
          <SkeletonLoading rows={6} />
        ) : letters.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-brand-primary/10 text-brand-primary flex items-center justify-center mx-auto mb-4 text-2xl">
              <FiFileText />
            </div>
            <h3 className="text-base font-black text-brand-black dark:text-brand-white mb-1">No HR Letters Found</h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-sage max-w-sm mx-auto mb-5">
              No letters match your selected filter criteria. You can issue a new official letter right now.
            </p>
            {can("hr-letters", "add") && (
              <button
                onClick={() => router.push("/dashboard/hr-letters/create")}
                className="px-5 py-2.5 rounded-2xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-secondary transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <FiPlus />
                <span>Create HR Letter</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/80 dark:bg-brand-midnight text-[11px] uppercase font-black text-brand-dark-grey">
                  <th className="py-3.5 px-4">Employee</th>
                  <th className="py-3.5 px-4">Letter Type</th>
                  <th className="py-3.5 px-4">Letter Number</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Branch / Dept</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
                {letters.map((letter) => (
                  <tr
                    key={letter._id}
                    className="hover:bg-brand-offwhite/40 dark:hover:bg-brand-midnight/40 transition-colors"
                  >
                    {/* Employee Info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={letter.employeePhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                          alt={letter.employeeName}
                          className="w-9 h-9 rounded-xl object-cover border border-brand-gold/30 shadow-xs"
                        />
                        <div>
                          <p className="font-bold text-brand-black dark:text-brand-white">
                            {letter.employeeName}
                          </p>
                          <span className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                            {letter.employeeCode || "EMP"}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Letter Type */}
                    <td className="py-3 px-4">
                      <span className="font-bold text-brand-black dark:text-brand-white block">
                        {letter.contentSnapshot?.letterMeta?.titleBangla || letter.letterType}
                      </span>
                      <span className="text-[10px] text-brand-dark-grey uppercase font-semibold">
                        {letter.letterType?.replace(/_/g, " ")}
                      </span>
                    </td>

                    {/* Letter Number */}
                    <td className="py-3 px-4 font-mono font-bold text-brand-dark-grey dark:text-brand-gold-light text-[11px]">
                      {letter.letterNumber}
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 text-brand-dark-grey font-medium">
                      {letter.letterDate}
                    </td>

                    {/* Branch / Dept */}
                    <td className="py-3 px-4">
                      <span className="font-semibold text-brand-black dark:text-brand-white block">
                        {letter.branch || "—"}
                      </span>
                      <span className="text-[10px] text-brand-dark-grey">
                        {letter.department || "—"}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      {getStatusBadge(letter.status, letter.version)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          onClick={() => handleOpenPreview(letter)}
                          title="View Official Document"
                          className="p-2 rounded-xl hover:bg-brand-primary/10 text-brand-primary transition-all cursor-pointer"
                        >
                          <FiEye className="text-base" />
                        </button>

                        <button
                          onClick={() => handleOpenPreview(letter)}
                          title="Print Letter"
                          className="p-2 rounded-xl hover:bg-brand-charcoal/10 text-brand-charcoal dark:text-brand-white transition-all cursor-pointer"
                        >
                          <FiPrinter className="text-base" />
                        </button>

                        {can("hr-letters", "edit") && (
                          <button
                            onClick={() => handleOpenReissue(letter)}
                            title="Reissue / Create New Version"
                            className="p-2 rounded-xl hover:bg-amber-500/10 text-amber-600 transition-all cursor-pointer"
                          >
                            <FiRefreshCw className="text-base" />
                          </button>
                        )}

                        {can("hr-letters", "delete") && (
                          <button
                            onClick={() => handleDelete(letter)}
                            title="Delete Letter"
                            className="p-2 rounded-xl hover:bg-rose-500/10 text-rose-500 transition-all cursor-pointer"
                          >
                            <FiTrash2 className="text-base" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalItems > itemsPerPage && (
          <div className="p-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
            />
          </div>
        )}
      </div>

      {/* Document Preview Modal */}
      {isPreviewOpen && selectedLetter && (
        <LetterPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          snapshot={selectedLetter.contentSnapshot}
          letter={selectedLetter}
          onReissue={handleOpenReissue}
        />
      )}

      {/* Reissue Version Modal */}
      {isReissueOpen && selectedLetter && (
        <ReissueLetterModal
          isOpen={isReissueOpen}
          onClose={() => setIsReissueOpen(false)}
          letter={selectedLetter}
          onReissueSubmit={handleConfirmReissue}
        />
      )}
    </div>
  );
}

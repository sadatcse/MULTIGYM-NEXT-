"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import {
  FiAlertCircle,
  FiCheckCircle,
  FiEdit3,
  FiEye,
  FiFileText,
  FiLayers,
  FiPlus,
  FiRefreshCw,
  FiSend,
  FiSlash,
  FiTrash2,
  FiTrendingUp,
} from "react-icons/fi";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import useDepartmentApi from "@/hooks/useDepartmentApi";
import { useHrLookups, fmtDate, errMsg } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, StatCard, Table, Tabs, Td, controlCls, pageCls } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import ConfirmDeleteModal from "@/components/modals/ConfirmDeleteModal";
import LetterPreviewModal from "@/components/modals/letters/LetterPreviewModal";
import ReissueLetterModal from "@/components/modals/letters/ReissueLetterModal";
import CancelLetterModal from "@/components/modals/letters/CancelLetterModal";
import { LETTER_TYPES, isIssued, letterStatusMeta, letterTypeMeta } from "@/components/letters/letterConstants";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "issued", label: "Issued" },
  { value: "draft", label: "Drafts" },
  { value: "cancelled", label: "Cancelled" },
  { value: "reissued", label: "Superseded" },
];

const TONE_TEXT = { green: "text-emerald-500", blue: "text-blue-500", amber: "text-amber-500", red: "text-rose-500", purple: "text-purple-500", cyan: "text-cyan-500", gold: "text-brand-gold", slate: "text-zinc-500" };

const iconBtn = (tone) =>
  `p-2 rounded-xl transition-all cursor-pointer disabled:opacity-40 ${
    {
      gold: "text-brand-gold bg-brand-gold/10 hover:bg-brand-gold hover:text-brand-midnight",
      green: "text-emerald-600 bg-emerald-500/10 hover:bg-emerald-500 hover:text-white",
      amber: "text-amber-600 bg-amber-500/10 hover:bg-amber-500 hover:text-white",
      red: "text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white",
      slate: "text-brand-dark-grey dark:text-brand-gold-light bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-charcoal hover:text-white",
    }[tone]
  }`;

export default function HrLettersPage() {
  const router = useRouter();
  const { can } = useUserPermissions();
  const canAdd = can("hr-letters", "add");
  const canEdit = can("hr-letters", "edit");
  const canDelete = can("hr-letters", "delete");
  const { branches } = useHrLookups({ employees: false });
  const { departments } = useDepartmentApi(200);

  const api = useHrLetterApi(10);
  const {
    letters,
    totalItems,
    totalPages,
    stats,
    loading,
    isFetching,
    error,
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
    resetFilters,
    refresh,
  } = api;

  const [preview, setPreview] = useState(null);
  const [reissuing, setReissuing] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [busyId, setBusyId] = useState(null);

  const setFilter = (setter) => (v) => {
    setter(v);
    setCurrentPage(1);
  };
  const filtered = searchInput || letterTypeFilter !== "all" || branchFilter !== "all" || departmentFilter !== "all" || statusFilter !== "all" || startDateFilter || endDateFilter;

  const issueDraft = async (letter) => {
    const ok = await Swal.fire({
      title: "Issue this letter?",
      html: `A permanent memo number will be assigned to the <b>${letterTypeMeta(letter.letterType).titleEnglish}</b> for <b>${letter.employeeName}</b>.`,
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Issue letter",
      confirmButtonColor: "#FF1818",
    });
    if (!ok.isConfirmed) return;
    setBusyId(letter._id);
    try {
      const res = await api.issueDraft(letter._id);
      toast.success(res?.message || "Letter issued");
    } catch (err) {
      toast.error(errMsg(err, "Could not issue the letter"));
    } finally {
      setBusyId(null);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setBusyId(deleting._id);
    try {
      await api.deleteLetter(deleting._id);
      toast.success("Draft deleted");
      setDeleting(null);
    } catch (err) {
      toast.error(errMsg(err, "Could not delete"));
    } finally {
      setBusyId(null);
    }
  };

  const renderActions = (letter) => {
    const busy = busyId === letter._id;
    return (
      <div className="flex items-center justify-end gap-1.5">
        <button type="button" title="Preview, print or download" onClick={() => setPreview(letter)} className={iconBtn("gold")}>
          <FiEye className="text-sm" />
        </button>
        {letter.status === "draft" && canEdit && (
          <button type="button" title="Continue editing" onClick={() => router.push(`/dashboard/hr-letters/create?draftId=${letter._id}`)} className={iconBtn("slate")}>
            <FiEdit3 className="text-sm" />
          </button>
        )}
        {letter.status === "draft" && canAdd && (
          <button type="button" title="Issue letter" disabled={busy} onClick={() => issueDraft(letter)} className={iconBtn("green")}>
            <FiSend className="text-sm" />
          </button>
        )}
        {isIssued(letter.status) && canEdit && (
          <button type="button" title="Reissue (corrected version)" onClick={() => setReissuing(letter)} className={iconBtn("amber")}>
            <FiRefreshCw className="text-sm" />
          </button>
        )}
        {isIssued(letter.status) && canEdit && (
          <button type="button" title="Cancel letter" onClick={() => setCancelling(letter)} className={iconBtn("red")}>
            <FiSlash className="text-sm" />
          </button>
        )}
        {letter.status === "draft" && canDelete && (
          <button type="button" title="Delete draft" disabled={busy} onClick={() => setDeleting(letter)} className={iconBtn("red")}>
            <FiTrash2 className="text-sm" />
          </button>
        )}
      </div>
    );
  };

  const renderType = (letter) => {
    const t = letterTypeMeta(letter.letterType);
    const Icon = t.icon;
    return (
      <div className="flex items-center gap-2.5 min-w-0">
        <span className={`w-8 h-8 rounded-xl bg-brand-offwhite dark:bg-brand-midnight flex items-center justify-center shrink-0 ${TONE_TEXT[t.tone] || ""}`}>
          <Icon />
        </span>
        <span className="min-w-0">
          <span className="block font-black text-brand-black dark:text-brand-white truncate">{letter.contentSnapshot?.letterMeta?.titleBangla || t.titleBangla}</span>
          <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70 truncate">{t.titleEnglish}</span>
        </span>
      </div>
    );
  };

  const renderStatus = (letter) => {
    const m = letterStatusMeta(letter.status);
    return (
      <Badge tone={m.tone}>
        {m.label}
        {letter.version > 1 ? ` · v${letter.version}` : ""}
      </Badge>
    );
  };

  return (
    <div className={pageCls}>
      <PageHeader
        title="HR Letters & Documents"
        subtitle="Create, print and track official letters — appointment, promotion, transfer, warning, experience and more."
        actions={
          <>
            <Link href="/dashboard/hr-letters/templates">
              <Btn variant="ghost">
                <FiLayers /> Templates
              </Btn>
            </Link>
            {canAdd && (
              <Link href="/dashboard/hr-letters/create">
                <Btn>
                  <FiPlus /> Create letter
                </Btn>
              </Link>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard index={0} icon={<FiCheckCircle />} label="Issued letters" value={stats.issuedLetters} tone="green" active={statusFilter === "issued"} onClick={() => setFilter(setStatusFilter)(statusFilter === "issued" ? "all" : "issued")} />
        <StatCard index={1} icon={<FiTrendingUp />} label="Issued this month" value={stats.thisMonthCount} tone="gold" />
        <StatCard index={2} icon={<FiFileText />} label="Drafts to finish" value={stats.activeDrafts} tone="amber" active={statusFilter === "draft"} onClick={() => setFilter(setStatusFilter)(statusFilter === "draft" ? "all" : "draft")} />
        <StatCard index={3} icon={<FiSlash />} label="Cancelled" value={stats.cancelledLetters} tone="red" active={statusFilter === "cancelled"} onClick={() => setFilter(setStatusFilter)(statusFilter === "cancelled" ? "all" : "cancelled")} />
      </div>

      <Card
        bodyClassName="p-0"
        title={
          <span className="flex items-center gap-2">
            {totalItems} letter{totalItems === 1 ? "" : "s"}
            {isFetching && <span className="w-3.5 h-3.5 border-2 border-brand-gold border-t-transparent rounded-full animate-spin" />}
          </span>
        }
        actions={<Tabs tabs={STATUS_TABS} value={statusFilter} onChange={setFilter(setStatusFilter)} />}
      >
        <div className="p-4 sm:px-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-6 gap-3">
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Name, employee ID, memo no. or subject…" className="sm:col-span-2" />
          <Select value={letterTypeFilter} onChange={setFilter(setLetterTypeFilter)} options={[{ value: "all", label: "All letter types" }, ...LETTER_TYPES.map((t) => ({ value: t.key, label: `${t.titleEnglish} · ${t.titleBangla}` }))]} />
          <Select value={branchFilter} onChange={setFilter(setBranchFilter)} options={[{ value: "all", label: "All branches" }, ...branches]} />
          <Select value={departmentFilter} onChange={setFilter(setDepartmentFilter)} options={[{ value: "all", label: "All departments" }, ...(departments || []).map((d) => d.name)]} />
          <div className="flex items-center gap-2">
            <input type="date" title="From date" value={startDateFilter} onChange={(e) => setFilter(setStartDateFilter)(e.target.value)} className={`${controlCls} w-full`} />
            <input type="date" title="To date" value={endDateFilter} onChange={(e) => setFilter(setEndDateFilter)(e.target.value)} className={`${controlCls} w-full`} />
          </div>
          {filtered && (
            <button type="button" onClick={resetFilters} className="xl:col-span-6 justify-self-start text-xs font-bold text-brand-red hover:underline cursor-pointer">
              Clear all filters
            </button>
          )}
        </div>

        {loading ? (
          <Loading rows={6} />
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <FiAlertCircle className="text-3xl text-brand-red mx-auto" />
            <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">{error}</p>
            <Btn variant="ghost" size="sm" onClick={refresh}>
              <FiRefreshCw /> Try again
            </Btn>
          </div>
        ) : letters.length === 0 ? (
          <EmptyState
            icon={<FiFileText />}
            title={filtered ? "No letters match these filters" : "No HR letters yet"}
            text={filtered ? "Try another letter type, status or date range." : "Issue your first appointment, promotion or other official letter in a few steps."}
            action={
              filtered ? (
                <Btn variant="ghost" size="sm" onClick={resetFilters}>
                  Clear filters
                </Btn>
              ) : canAdd ? (
                <Link href="/dashboard/hr-letters/create">
                  <Btn>
                    <FiPlus /> Create letter
                  </Btn>
                </Link>
              ) : null
            }
          />
        ) : (
          <>
            {/* Laptop / desktop: table */}
            <div className="hidden lg:block">
              <Table head={["Employee", "Letter", "Memo no.", "Date", "Branch / Dept", "Status", { label: "Actions", className: "text-right" }]}>
                {letters.map((l) => (
                  <tr key={l._id} className={busyId === l._id ? "opacity-50" : ""}>
                    <Td>
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar name={l.employeeName} photo={l.employeePhoto} size={36} />
                        <div className="min-w-0">
                          <div className="font-black truncate">{l.employeeName}</div>
                          <div className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">{l.employeeCode || "—"}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      {renderType(l)}
                    </Td>
                    <Td className="font-mono text-[11px] text-brand-dark-grey dark:text-brand-gold-light whitespace-nowrap">{l.status === "draft" ? <span className="italic">Assigned on issue</span> : l.letterNumber}</Td>
                    <Td className="whitespace-nowrap">{fmtDate(l.letterDate)}</Td>
                    <Td>
                      <div>{l.branch || "—"}</div>
                      <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70">{l.department || "—"}</div>
                    </Td>
                    <Td>
                      {renderStatus(l)}
                    </Td>
                    <Td>
                      {renderActions(l)}
                    </Td>
                  </tr>
                ))}
              </Table>
            </div>

            {/* Phone / tablet: cards */}
            <div className="lg:hidden p-3 sm:p-4 grid sm:grid-cols-2 gap-3">
              {letters.map((l) => (
                <div key={l._id} className={`p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/60 dark:bg-brand-midnight/60 space-y-3 ${busyId === l._id ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    {renderType(l)}
                    {renderStatus(l)}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={l.employeeName} photo={l.employeePhoto} size={30} />
                    <div className="min-w-0 text-xs">
                      <div className="font-black text-brand-black dark:text-brand-white truncate">{l.employeeName}</div>
                      <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 truncate">
                        {[l.employeeCode, l.branch].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light min-w-0">
                      <div className="font-mono truncate">{l.status === "draft" ? "Draft" : l.letterNumber}</div>
                      <div>{fmtDate(l.letterDate)}</div>
                    </div>
                    {renderActions(l)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {!loading && !error && totalItems > 0 && (
          <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalItems}
              itemsPerPage={itemsPerPage}
              onPageChange={setCurrentPage}
              onItemsPerPageChange={(n) => {
                setItemsPerPage(n);
                setCurrentPage(1);
              }}
              itemsPerPageOptions={[10, 20, 50]}
            />
          </div>
        )}
      </Card>

      <LetterPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} letterId={preview?._id} />
      <ReissueLetterModal
        isOpen={!!reissuing}
        onClose={() => setReissuing(null)}
        letter={reissuing}
        onDone={(l) => {
          toast.success(`Version ${l?.version || ""} issued`);
          refresh();
        }}
      />
      <CancelLetterModal
        isOpen={!!cancelling}
        onClose={() => setCancelling(null)}
        letter={cancelling}
        onDone={() => {
          toast.success("Letter cancelled");
          refresh();
        }}
      />
      <ConfirmDeleteModal isOpen={!!deleting} onClose={() => !busyId && setDeleting(null)} onConfirm={confirmDelete} itemName={deleting ? `Draft for ${deleting.employeeName}` : ""} isDeleting={!!busyId} />
    </div>
  );
}

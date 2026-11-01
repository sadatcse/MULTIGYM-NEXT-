"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiClock, FiRefreshCw } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import { errMsg, fmtDateTime } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, Table, Td, controlCls, pageCls } from "@/components/hr/HrUi";
import Pagination from "@/components/Comon/Pagination";
import { AUDIT_ACTIONS, auditActionMeta } from "@/components/letters/letterConstants";

const ACTION_OPTIONS = [{ value: "all", label: "All activity" }, ...Object.entries(AUDIT_ACTIONS).filter(([k]) => !["edited", "regenerated"].includes(k)).map(([value, m]) => ({ value, label: m.label }))];

export default function LetterHistoryPage() {
  const { fetchAuditHistory } = useHrLetterActions();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ totalItems: 0, totalPages: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [action, setAction] = useState("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const abortRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const params = { page, limit };
    if (search) params.search = search;
    if (action !== "all") params.action = action;
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    fetchAuditHistory(params, { signal: controller.signal })
      .then((res) => {
        setLogs(res?.items || []);
        setPagination(res?.pagination || { totalItems: 0, totalPages: 1 });
        setError("");
      })
      .catch((e) => e?.code !== "ERR_CANCELED" && setError(errMsg(e, "Could not load the activity log")))
      .finally(() => abortRef.current === controller && setLoading(false));
    return () => controller.abort();
  }, [fetchAuditHistory, page, limit, search, action, startDate, endDate, reloadKey]);

  const filtered = search || action !== "all" || startDate || endDate;
  const clear = () => {
    setSearchInput("");
    setAction("all");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const letterLink = (log, children) =>
    log.letterId && log.action !== "deleted" ? (
      <Link href={`/dashboard/hr-letters/${log.letterId}`} className="hover:text-brand-gold hover:underline">
        {children}
      </Link>
    ) : (
      children
    );

  const detail = (log) => log.metadata?.reason || log.metadata?.reissueReason || (log.metadata?.version ? `Version ${log.metadata.version}` : log.metadata?.letterType ? String(log.metadata.letterType).replace(/_/g, " ") : "");

  return (
    <div className={pageCls}>
      <PageHeader title="Letter History & Audit" subtitle="Every letter created, issued, printed, downloaded, reissued, cancelled or deleted — and who did it." />

      <Card
        bodyClassName="p-0"
        title={`${pagination.totalItems || 0} record${pagination.totalItems === 1 ? "" : "s"}`}
      >
        <div className="p-4 sm:px-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3">
          <SearchBox value={searchInput} onChange={setSearchInput} placeholder="Memo no., employee or staff name…" className="sm:col-span-2" />
          <Select value={action} onChange={(v) => { setAction(v); setPage(1); }} options={ACTION_OPTIONS} />
          <input type="date" title="From" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className={`${controlCls} w-full py-2`} />
          <input type="date" title="To" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className={`${controlCls} w-full py-2`} />
          {filtered && (
            <button type="button" onClick={clear} className="xl:col-span-5 justify-self-start text-xs font-bold text-brand-red hover:underline cursor-pointer">
              Clear filters
            </button>
          )}
        </div>

        {loading && !logs.length ? (
          <Loading rows={8} />
        ) : error ? (
          <div className="py-12 text-center space-y-3">
            <FiAlertCircle className="text-3xl text-brand-red mx-auto" />
            <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">{error}</p>
            <Btn variant="ghost" size="sm" onClick={() => setReloadKey((k) => k + 1)}>
              <FiRefreshCw /> Try again
            </Btn>
          </div>
        ) : logs.length === 0 ? (
          <EmptyState icon={<FiClock />} title={filtered ? "No matching activity" : "No activity yet"} text={filtered ? "Try a different action or date range." : "Activity appears here once letters are created."} />
        ) : (
          <div className={loading ? "opacity-60 transition-opacity" : ""}>
            <div className="hidden md:block">
              <Table head={["Activity", "Memo no.", "Employee", "Done by", "Details", "When"]}>
                {logs.map((log) => {
                  const m = auditActionMeta(log.action);
                  return (
                    <tr key={log._id}>
                      <Td><Badge tone={m.tone}>{m.label}</Badge></Td>
                      <Td className="font-mono text-[11px] whitespace-nowrap">{log.letterNumber ? letterLink(log, log.letterNumber) : "—"}</Td>
                      <Td>{log.employeeName || "—"}</Td>
                      <Td>
                        <div>{log.performedBy?.name || "System"}</div>
                        <div className="text-[10px] font-semibold uppercase text-brand-dark-grey dark:text-brand-gold-light/70">{log.performedBy?.role || ""}</div>
                      </Td>
                      <Td className="max-w-[260px] text-brand-dark-grey dark:text-brand-gold-light font-medium truncate" title={detail(log)}>{detail(log) || "—"}</Td>
                      <Td className="whitespace-nowrap text-brand-dark-grey dark:text-brand-gold-light">{fmtDateTime(log.createdAt)}</Td>
                    </tr>
                  );
                })}
              </Table>
            </div>
            <div className="md:hidden p-3 space-y-3">
              {logs.map((log) => {
                const m = auditActionMeta(log.action);
                return (
                  <div key={log._id} className="p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/60 dark:bg-brand-midnight/60 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <Badge tone={m.tone}>{m.label}</Badge>
                      <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light">{fmtDateTime(log.createdAt)}</span>
                    </div>
                    {log.letterNumber && <div className="font-mono text-[11px] font-bold text-brand-black dark:text-brand-white">{letterLink(log, log.letterNumber)}</div>}
                    <div className="text-brand-dark-grey dark:text-brand-gold-light">
                      {log.employeeName ? `${log.employeeName} · ` : ""}by <b className="text-brand-black dark:text-brand-white">{log.performedBy?.name || "System"}</b>
                    </div>
                    {detail(log) && <div className="text-[11px] italic text-brand-dark-grey dark:text-brand-gold-light/80">{detail(log)}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!error && pagination.totalItems > 0 && (
          <div className="p-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
            <Pagination
              currentPage={page}
              totalPages={pagination.totalPages}
              totalItems={pagination.totalItems}
              itemsPerPage={limit}
              onPageChange={setPage}
              onItemsPerPageChange={(n) => { setLimit(n); setPage(1); }}
              itemsPerPageOptions={[20, 50, 100]}
            />
          </div>
        )}
      </Card>
    </div>
  );
}

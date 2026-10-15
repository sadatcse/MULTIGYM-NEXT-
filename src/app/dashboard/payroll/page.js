"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiCheckCircle, FiDollarSign, FiEdit3, FiFileText, FiLock, FiPlus, FiRefreshCw, FiTrash2, FiUnlock, FiUsers } from "react-icons/fi";
import { MdReceiptLong } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, monthISO, money, fmtDateTime } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, StatCard, Table, Tabs, Td } from "@/components/hr/HrUi";
import PayslipAdjustModal from "@/components/hr/modals/PayslipAdjustModal";
import AdjustmentsTab from "@/components/hr/tabs/PayrollAdjustmentsTab";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";
import { SHEET_HEAD, printPayslip, printSalarySheet, sheetCells } from "@/components/hr/payslipPrint";

export default function PayrollPage() {
  const { company } = useContext(AuthContext);
  const permissions = usePagePermission();
  const { canAdd, canEdit, canDelete } = permissions;
  const { me, config } = useHrConfig();
  const { branches, staff } = useHrLookups();
  const symbol = config?.payroll?.currency || "৳";
  const [tab, setTab] = useState("sheet");
  const [month, setMonth] = useState(monthISO());
  const [branch, setBranch] = useState("all");
  const [runId, setRunId] = useState(null);
  const [search, setSearch] = useState("");
  const [editSlip, setEditSlip] = useState(null);
  const [skipped, setSkipped] = useState([]);

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (me?.scope === "branch" && me.branches?.length && branch === "all") setBranch(me.branches[0]);
  }, [me, branch]);

  const runs = useHrQuery("/payroll/runs", { year: month.slice(0, 4) });
  const monthRuns = (runs.data?.data || []).filter((r) => r.month === month);
  useEffect(() => {
    const match = monthRuns.find((r) => r.branch === branch) || monthRuns[0];
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRunId(match?._id || null);
  }, [month, branch, runs.data]); // eslint-disable-line react-hooks/exhaustive-deps

  const detail = useHrQuery(runId ? `/payroll/runs/${runId}` : null, {}, { enabled: !!runId });
  const run = detail.data?.data?.run;
  const slips = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (detail.data?.data?.payslips || []).filter((p) => !q || `${p.employeeName} ${p.employeeCode}`.toLowerCase().includes(q));
  }, [detail.data, search]);
  const { run: mutate, busy } = useHrMutation();

  const act = async (method, url, body, confirmText) => {
    if (confirmText && !confirm(confirmText)) return;
    const res = await mutate(method, url, body);
    if (res) {
      runs.refetch();
      detail.refetch();
    }
    return res;
  };
  const generate = async () => {
    const res = await act("post", "/payroll/runs/generate", { month, branch }, run?.status === "draft" ? "Regenerate this draft? Manual payslip edits will be recalculated." : null);
    if (res) {
      setSkipped(res.data?.skipped || []);
      setRunId(res.data?.run?._id);
    }
  };

  const t = run?.totals || {};
  const branchOptions = me?.scope === "branch" ? me.branches : ["all", ...branches];

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdReceiptLong />}
        title="Payroll & Salary Sheet"
        subtitle="Attendance-driven salary: basic & allowances, overtime, bonus, late/absent deductions, advance & loan recovery, net salary — branch-wise or combined."
        actions={
          <>
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]" />
            <select value={branch} onChange={(e) => setBranch(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50">
              {branchOptions.map((b) => <option key={b} value={b}>{b === "all" ? "All branches (combined)" : b}</option>)}
            </select>
            {canAdd && (!run || run.status === "draft") && <Btn variant="gold" size="sm" loading={busy} onClick={generate}><FiRefreshCw /> {run ? "Regenerate" : "Generate"} sheet</Btn>}
          </>
        }
      />

      <Tabs value={tab} onChange={setTab} tabs={[{ value: "sheet", label: "Salary sheet" }, { value: "adjustments", label: "Bonus & adjustments" }, { value: "runs", label: `Runs ${month.slice(0, 4)}` }]} />

      {tab === "sheet" && (
        <>
          {monthRuns.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {monthRuns.map((r) => (
                <button key={r._id} onClick={() => setRunId(r._id)} className={`px-3 py-1.5 rounded-xl text-[11px] font-black border cursor-pointer ${r._id === runId ? "bg-brand-gold text-brand-black border-brand-gold" : "border-brand-beige dark:border-brand-dark-grey"}`}>
                  {r.branch === "all" ? "Combined" : r.branch} · {r.status}
                </button>
              ))}
            </div>
          )}
          {skipped.length > 0 && (
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[11px] font-bold text-amber-600">
              Skipped (no salary set): {skipped.join(", ")} — set them in Salary Structures.
            </div>
          )}
          {!runId ? (
            <Card><EmptyState icon={<MdReceiptLong />} title={`No salary sheet for ${month}`} text="Generate it after the month's attendance is processed. You can regenerate a draft as often as needed." action={canAdd && <Btn onClick={generate} loading={busy}>Generate now</Btn>} /></Card>
          ) : detail.loading || !run ? (
            <Card><Loading rows={8} /></Card>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <StatCard icon={<FiUsers />} label="Employees" value={run.employeeCount} />
                <StatCard icon={<FiDollarSign />} label="Gross" value={money(t.gross, symbol)} tone="blue" index={1} />
                <StatCard icon={<FiPlus />} label="Earnings add-ons" value={money((t.overtimePay || 0) + (t.bonus || 0) + (t.otherEarnings || 0), symbol)} tone="cyan" index={2} />
                <StatCard icon={<FiTrash2 />} label="Deductions" value={money(t.totalDeductions, symbol)} tone="red" index={3} />
                <StatCard icon={<FiCheckCircle />} label="Net payable" value={money(t.netSalary, symbol)} tone="green" index={4} />
              </div>
              <Card
                title={
                  <span className="flex items-center gap-2">
                    {run.branch === "all" ? "All branches (combined)" : run.branch} · {month} <Badge status={run.status} />
                  </span>
                }
                subtitle={run.finalizedBy ? `Finalized by ${run.finalizedBy.name} · ${fmtDateTime(run.finalizedBy.at)}` : `Generated by ${run.generatedBy?.name || "—"} · ${fmtDateTime(run.updatedAt)}`}
                bodyClassName="p-0"
                actions={
                  <>
                    <SearchBox value={search} onChange={setSearch} className="w-44" />
                    <ExportButtons
                      onExportExcel={() => exportToExcel(slips.map((p, i) => Object.fromEntries(SHEET_HEAD.map((h, j) => [h, sheetCells(p, i)[j]]))), `salary_sheet_${month}_${run.branch}`, "Salary Sheet")}
                      onPrint={() => printSalarySheet(run, slips, company)}
                    />
                    {canEdit && run.status === "draft" && <Btn size="sm" variant="success" loading={busy} onClick={() => act("post", `/payroll/runs/${run._id}/finalize`, null, "Finalize? Advance/loan installments will be booked and the sheet will be locked.")}><FiLock /> Finalize</Btn>}
                    {canEdit && run.status === "finalized" && <Btn size="sm" variant="success" loading={busy} onClick={() => act("post", `/payroll/runs/${run._id}/paid`, null, "Mark salaries as paid?")}><FiCheckCircle /> Mark paid</Btn>}
                    {canEdit && run.status !== "draft" && me?.isSuperAdmin && <Btn size="sm" variant="ghost" onClick={() => act("post", `/payroll/runs/${run._id}/reopen`, null, "Reopen as draft? Loan recoveries from this run will be reversed.")}><FiUnlock /> Reopen</Btn>}
                    {canDelete && run.status === "draft" && <Btn size="sm" variant="ghost" onClick={async () => { if (await act("delete", `/payroll/runs/${run._id}`, null, "Delete this draft?")) setRunId(null); }}><FiTrash2 /></Btn>}
                  </>
                }
              >
                <Table
                  head={[...SHEET_HEAD.slice(1, 5), "Att. (P/A/L/Lv)", "OT h", "Gross", "+ OT", "+ Bonus/Other", "− Late", "− Absent", "− Adv/Loan", "− Fixed/Other", { label: "Net", className: "text-right" }, ""]}
                  footer={
                    <tfoot>
                      <tr className="bg-brand-gold/10 text-xs font-black">
                        <Td colSpan={6}>TOTAL</Td>
                        <Td>{money(t.gross, symbol)}</Td>
                        <Td>{money(t.overtimePay, symbol)}</Td>
                        <Td>{money((t.bonus || 0) + (t.otherEarnings || 0), symbol)}</Td>
                        <Td>{money(t.lateDeduction, symbol)}</Td>
                        <Td>{money(t.absentDeduction, symbol)}</Td>
                        <Td>{money((t.advanceDeduction || 0) + (t.loanDeduction || 0), symbol)}</Td>
                        <Td>{money((t.fixedDeductions || 0) + (t.otherDeductions || 0), symbol)}</Td>
                        <Td className="text-right text-emerald-600">{money(t.netSalary, symbol)}</Td>
                        <Td />
                      </tr>
                    </tfoot>
                  }
                >
                  {slips.map((p, i) => (
                    <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }} className="hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10">
                      <Td>{p.employeeCode}</Td>
                      <Td className="font-black whitespace-nowrap">{p.employeeName}{p.manuallyAdjusted && <span className="ml-1 text-[9px] text-brand-gold">EDITED</span>}</Td>
                      <Td className="whitespace-nowrap">{p.designation}</Td>
                      <Td className="whitespace-nowrap">{p.branch}</Td>
                      <Td className="whitespace-nowrap" title={p.remarks}>{p.attendance?.present}/{(p.attendance?.absent || 0) + (p.attendance?.unpaidLeave || 0)}/{p.attendance?.late}/{p.attendance?.leave}</Td>
                      <Td>{p.attendance?.overtimeHours || 0}</Td>
                      <Td>{money(p.gross, symbol)}</Td>
                      <Td>{money(p.overtimePay, symbol)}</Td>
                      <Td>{money(p.bonus + p.otherEarnings, symbol)}</Td>
                      <Td className={p.lateDeduction ? "text-amber-500" : ""}>{money(p.lateDeduction, symbol)}</Td>
                      <Td className={p.absentDeduction ? "text-red-500" : ""}>{money(p.absentDeduction, symbol)}</Td>
                      <Td>{money(p.advanceDeduction + p.loanDeduction, symbol)}</Td>
                      <Td>{money(p.fixedDeductions + p.otherDeductions, symbol)}</Td>
                      <Td className="text-right font-black text-emerald-600 whitespace-nowrap">{money(p.netSalary, symbol)}</Td>
                      <Td className="whitespace-nowrap text-right">
                        <button title="Payslip" onClick={() => printPayslip(p, company, symbol)} className="p-1.5 rounded-lg hover:bg-brand-gold/15 cursor-pointer"><FiFileText /></button>
                        {canEdit && run.status === "draft" && <button title="Adjust" onClick={() => setEditSlip(p)} className="p-1.5 rounded-lg hover:bg-brand-gold/15 cursor-pointer"><FiEdit3 /></button>}
                      </Td>
                    </motion.tr>
                  ))}
                </Table>
              </Card>
            </>
          )}
        </>
      )}

      {tab === "adjustments" && <AdjustmentsTab month={month} staff={staff} symbol={symbol} canAdd={canAdd} canDelete={canDelete} />}

      {tab === "runs" && (
        <Card bodyClassName="p-0">
          <Table head={["Month", "Scope", "Status", "Employees", "Gross", "Deductions", "Net", "Finalized"]}>
            {(runs.data?.data || []).map((r) => (
              <tr key={r._id} className="cursor-pointer hover:bg-brand-gold/5 dark:hover:bg-brand-gold/10" onClick={() => { setMonth(r.month); setBranch(r.branch); setRunId(r._id); setTab("sheet"); }}>
                <Td className="font-black">{r.month}</Td>
                <Td>{r.branch === "all" ? "Combined" : r.branch}</Td>
                <Td><Badge status={r.status} /></Td>
                <Td>{r.employeeCount}</Td>
                <Td>{money(r.totals?.gross, symbol)}</Td>
                <Td>{money(r.totals?.totalDeductions, symbol)}</Td>
                <Td className="font-black text-emerald-600">{money(r.totals?.netSalary, symbol)}</Td>
                <Td className="text-[11px]">{r.finalizedBy ? `${r.finalizedBy.name} · ${fmtDateTime(r.finalizedBy.at)}` : "—"}</Td>
              </tr>
            ))}
          </Table>
        </Card>
      )}

      <PayslipAdjustModal slip={editSlip} symbol={symbol} permissions={permissions} onClose={() => setEditSlip(null)} onSaved={() => { setEditSlip(null); detail.refetch(); runs.refetch(); }} />
    </div>
  );
}

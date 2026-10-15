"use client";

import { useContext, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiClock,
  FiEdit3,
  FiLogOut,
  FiMinusCircle,
  FiRefreshCw,
  FiSun,
  FiUserX,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import { MdFingerprint, MdBeachAccess } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery, fmtMinutes, todayISO, addDaysISO, titleCase } from "@/hooks/useHr";
import { Avatar, Badge, Btn, Card, EmptyState, Loading, PageHeader, SearchBox, Select, StatCard, Table, Td } from "@/components/hr/HrUi";
import AttendanceCorrectionModal from "@/components/hr/modals/AttendanceCorrectionModal";
import ExportButtons from "@/components/Comon/ExportButtons";
import { exportToExcel } from "@/lib/exportHelper";
import { printDocument, tableHtml } from "@/lib/hrPrint";

export default function DailyAttendancePage() {
  const { company } = useContext(AuthContext);
  const permissions = usePagePermission();
  const { canEdit } = permissions;
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const [date, setDate] = useState(todayISO());
  const [branch, setBranch] = useState("all");
  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState(null);

  const { data, loading, refetch } = useHrQuery("/attendance/daily", { date, branch, status, search: search || undefined });
  const rows = useMemo(() => data?.data || [], [data]);
  const s = data?.summary || {};
  const { run, busy } = useHrMutation();

  const branchOptions = me?.scope === "branch" ? me.branches : branches;

  const cards = [
    { key: "all", label: "Staff", value: s.total, icon: <FiUsers />, tone: "gold" },
    { key: "present", label: "Present", value: s.present, icon: <FiCheckCircle />, tone: "green" },
    { key: "late", label: "Late", value: s.late, icon: <FiClock />, tone: "amber" },
    { key: "early_leave", label: "Early Leave", value: s.earlyLeave, icon: <FiLogOut />, tone: "purple" },
    { key: "missing_punch", label: "Missing Punch", value: s.missingPunch, icon: <FiAlertTriangle />, tone: "amber" },
    { key: "absent", label: "Absent", value: s.absent, icon: <FiUserX />, tone: "red" },
    { key: "not_punched", label: "Not In Yet", value: s.notPunched, icon: <FiMinusCircle />, tone: "slate" },
    { key: "leave", label: "On Leave", value: s.leave, icon: <MdBeachAccess />, tone: "blue" },
    { key: "half_day", label: "Half Day", value: s.halfDay, icon: <FiSun />, tone: "purple" },
    { key: "overtime", label: "Overtime", value: s.overtime, icon: <FiZap />, tone: "cyan" },
  ];

  const exportRows = useMemo(
    () =>
      rows.map((r) => ({
        Date: r.date,
        "Employee ID": r.employee.employeeId,
        Name: r.employee.name,
        Designation: r.employee.jobPosition,
        Branch: r.branch,
        Shift: r.shiftStart ? `${r.shiftStart}-${r.shiftEnd}` : "",
        In: r.inTime,
        Out: r.outTime,
        Status: titleCase(r.status),
        "Late (min)": r.lateMinutes,
        "Early Leave (min)": r.earlyLeaveMinutes,
        "Worked (min)": r.workedMinutes,
        "Overtime (min)": r.overtimeMinutes,
        Remarks: r.remarks,
        "Manually Edited": r.isManual ? "Yes" : "",
      })),
    [rows],
  );

  const handlePrint = () =>
    printDocument({
      title: `Daily Attendance — ${date}`,
      subtitle: branch === "all" ? "All branches" : branch,
      company,
      landscape: true,
      bodyHtml: tableHtml(
        ["#", "ID", "Name", "Branch", "Shift", "In", "Out", "Status", "Late", "OT", "Remarks"],
        rows.map((r, i) => [i + 1, r.employee.employeeId, r.employee.name, r.branch, r.shiftStart ? `${r.shiftStart}-${r.shiftEnd}` : "", r.inTime, r.outTime, titleCase(r.status), fmtMinutes(r.lateMinutes), fmtMinutes(r.overtimeMinutes), r.remarks]),
      ),
    });

  const processDay = async () => {
    const res = await run("post", "/attendance/process", { date, branch: branch === "all" ? undefined : branch });
    if (res) refetch();
  };

  return (
    <div className="space-y-5 max-w-[1700px] mx-auto pb-10">
      <PageHeader
        icon={<MdFingerprint />}
        title="Daily Attendance"
        subtitle="Live IN/OUT from biometric devices with late, early leave, missing punch, overtime and absent tracking. Every manual correction is logged."
        actions={
          <>
            <Btn variant="glass" size="sm" onClick={() => setDate(addDaysISO(date, -1))}>‹ Prev</Btn>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} className="px-3 py-1.5 rounded-xl bg-white/10 border border-white/20 text-xs font-bold text-white [color-scheme:dark]" />
            <Btn variant="glass" size="sm" disabled={date >= todayISO()} onClick={() => setDate(addDaysISO(date, 1))}>Next ›</Btn>
            {canEdit && (
              <Btn variant="gold" size="sm" loading={busy} onClick={processDay} title="Recalculate from punches and mark absentees">
                <FiRefreshCw /> Process Day
              </Btn>
            )}
          </>
        }
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {cards.map((c, i) => (
          <StatCard key={c.key} index={i} icon={c.icon} label={c.label} value={c.value ?? "—"} tone={c.tone} active={status === c.key} onClick={() => setStatus(status === c.key ? "all" : c.key)} />
        ))}
      </div>

      <Card
        title={`${rows.length} employee${rows.length === 1 ? "" : "s"}`}
        subtitle={date === todayISO() ? "Today — absentees are finalized when the day is processed (automatically each morning)." : `Showing ${date}`}
        actions={
          <>
            <SearchBox value={search} onChange={setSearch} placeholder="Name or ID" className="w-48" />
            {me?.scope !== "self" && (
              <Select value={branch} onChange={setBranch} options={[{ value: "all", label: me?.scope === "branch" ? "My branches" : "All branches" }, ...branchOptions.map((b) => ({ value: b, label: b }))]} className="w-48" />
            )}
            <ExportButtons onExportExcel={() => exportToExcel(exportRows, `attendance_${date}`, "Attendance")} onPrint={handlePrint} />
          </>
        }
        bodyClassName="p-0"
      >
        {loading ? (
          <Loading />
        ) : !rows.length ? (
          <EmptyState title="No employees match" text="Try another branch, status or date." />
        ) : (
          <Table head={["Employee", "Branch", "Shift", "In", "Out", "Status", "Late", "Early", "Worked", "OT", "Remarks", ""]}>
            {rows.map((r, i) => (
              <motion.tr key={r.employee._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }} className="hover:bg-brand-offwhite/60 dark:hover:bg-brand-midnight/30">
                <Td>
                  <div className="flex items-center gap-2.5">
                    <Avatar name={r.employee.name} photo={r.employee.photo} size={32} />
                    <div className="min-w-0">
                      <Link href={`/dashboard/employee/history?employee=${r.employee._id}`} className="font-black truncate block hover:text-brand-gold">{r.employee.name}</Link>
                      <div className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70">{r.employee.employeeId} · {r.employee.jobPosition || "—"}</div>
                    </div>
                  </div>
                </Td>
                <Td className="whitespace-nowrap">{r.branch || "—"}</Td>
                <Td className="whitespace-nowrap text-brand-dark-grey dark:text-zinc-300">{r.shiftStart ? `${r.shiftStart}–${r.shiftEnd}` : "—"}</Td>
                <Td className={r.isLate ? "text-amber-500" : ""}>{r.inTime || "—"}</Td>
                <Td className={r.isEarlyLeave ? "text-purple-500" : ""}>{r.outTime || "—"}</Td>
                <Td>
                  <div className="flex items-center gap-1">
                    <Badge status={r.status} />
                    {r.isManual && <span title={`Edited by ${r.lastEditedBy?.name || "?"}`} className="text-[9px] px-1.5 py-0.5 rounded-md bg-brand-gold/15 text-brand-gold font-black">EDITED</span>}
                  </div>
                </Td>
                <Td>{fmtMinutes(r.lateMinutes)}</Td>
                <Td>{fmtMinutes(r.earlyLeaveMinutes)}</Td>
                <Td>{fmtMinutes(r.workedMinutes)}</Td>
                <Td className={r.overtimeMinutes ? "text-cyan-500" : ""}>{fmtMinutes(r.overtimeMinutes)}</Td>
                <Td className="max-w-[180px] truncate text-[11px] font-semibold text-brand-dark-grey dark:text-zinc-300" title={r.remarks}>{r.leaveTypeName || r.remarks || ""}</Td>
                <Td className="text-right">
                  {canEdit && me?.scope !== "self" && (
                    <Btn variant="ghost" size="sm" onClick={() => setEditing(r)}>
                      <FiEdit3 /> Correct
                    </Btn>
                  )}
                </Td>
              </motion.tr>
            ))}
          </Table>
        )}
      </Card>

      <AttendanceCorrectionModal row={editing} permissions={permissions} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); refetch(); }} />
    </div>
  );
}

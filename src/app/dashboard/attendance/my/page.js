"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { FiCalendar, FiCheckCircle, FiClock, FiUserX, FiZap } from "react-icons/fi";
import { MdBeachAccess } from "react-icons/md";
import { useHrQuery, monthISO, fmtMinutes, titleCase } from "@/hooks/useHr";
import { Badge, Card, Loading, PageHeader, StatCard, Table, Td } from "@/components/hr/HrUi";

const DOT = {
  present: "bg-emerald-500", late: "bg-amber-500", half_day: "bg-purple-500", absent: "bg-red-500", leave: "bg-blue-500",
  missing_punch: "bg-orange-500", weekend: "bg-zinc-400", holiday: "bg-cyan-500",
};

export default function MyAttendancePage() {
  const [month, setMonth] = useState(monthISO());
  const { data, loading } = useHrQuery("/attendance/my", { month });
  const rows = useMemo(() => data?.data || [], [data]);
  const s = data?.summary || {};
  const byDate = useMemo(() => Object.fromEntries(rows.map((r) => [r.date, r])), [rows]);

  const [y, m] = month.split("-").map(Number);
  const days = new Date(y, m, 0).getDate();
  const firstDow = new Date(y, m - 1, 1).getDay();

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<FiCalendar />}
        title="My Attendance"
        subtitle="Your punches as recorded by the biometric device, with late, early leave and overtime."
        actions={<input type="month" value={month} onChange={(e) => setMonth(e.target.value)} className="bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]" />}
      />
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <StatCard icon={<FiCheckCircle />} label="Present" value={s.present ?? 0} tone="green" />
        <StatCard icon={<FiClock />} label="Late" value={s.late ?? 0} tone="amber" index={1} />
        <StatCard icon={<FiUserX />} label="Absent" value={s.absent ?? 0} tone="red" index={2} />
        <StatCard icon={<MdBeachAccess />} label="Leave" value={s.leave ?? 0} tone="blue" index={3} />
        <StatCard icon={<FiZap />} label="Overtime days" value={s.overtime ?? 0} tone="cyan" index={4} />
      </div>

      <div className="grid lg:grid-cols-5 gap-5">
        <Card title="Calendar" className="lg:col-span-2">
          <div className="grid grid-cols-7 gap-1.5 text-center">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <span key={i} className="text-[10px] font-black text-brand-dark-grey dark:text-brand-gold-light">{d}</span>
            ))}
            {Array.from({ length: firstDow }).map((_, i) => <span key={`e${i}`} />)}
            {Array.from({ length: days }).map((_, i) => {
              const date = `${month}-${String(i + 1).padStart(2, "0")}`;
              const r = byDate[date];
              return (
                <motion.div
                  key={date}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: i * 0.01 }}
                  title={r ? `${titleCase(r.status)} ${r.inTime || ""}${r.outTime ? `–${r.outTime}` : ""}` : ""}
                  className="aspect-square rounded-xl bg-brand-offwhite dark:bg-brand-midnight flex flex-col items-center justify-center gap-1"
                >
                  <span className="text-[11px] font-black">{i + 1}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${r ? DOT[r.status] : "bg-transparent"}`} />
                </motion.div>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-3 mt-4">
            {Object.entries(DOT).map(([k, c]) => (
              <span key={k} className="flex items-center gap-1 text-[10px] font-bold text-brand-dark-grey dark:text-zinc-300">
                <span className={`w-2 h-2 rounded-full ${c}`} /> {titleCase(k)}
              </span>
            ))}
          </div>
        </Card>

        <Card title="Day by day" className="lg:col-span-3" bodyClassName="p-0">
          {loading ? (
            <Loading />
          ) : (
            <Table head={["Date", "Shift", "In", "Out", "Status", "Late", "OT"]}>
              {rows.map((r) => (
                <tr key={r._id}>
                  <Td className="whitespace-nowrap">{r.date}</Td>
                  <Td className="text-brand-dark-grey dark:text-zinc-300">{r.shiftStart ? `${r.shiftStart}–${r.shiftEnd}` : "—"}</Td>
                  <Td>{r.inTime || "—"}</Td>
                  <Td>{r.outTime || "—"}</Td>
                  <Td><Badge status={r.status} /></Td>
                  <Td>{fmtMinutes(r.lateMinutes)}</Td>
                  <Td>{fmtMinutes(r.overtimeMinutes)}</Td>
                </tr>
              ))}
              {!rows.length && (
                <tr>
                  <Td colSpan={7} className="text-center py-10 text-brand-dark-grey">No attendance recorded for this month.</Td>
                </tr>
              )}
            </Table>
          )}
        </Card>
      </div>
    </div>
  );
}

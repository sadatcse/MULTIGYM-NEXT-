"use client";

import { motion } from "framer-motion";
import { FiCalendar, FiRepeat } from "react-icons/fi";
import { useHrQuery, todayISO, addDaysISO } from "@/hooks/useHr";
import { Card, EmptyState, Loading, PageHeader } from "@/components/hr/HrUi";
import { DUTY_STYLE } from "@/components/hr/duty";

export default function MyRosterPage() {
  const from = todayISO();
  const { data, loading } = useHrQuery("/roster/my", { from, to: addDaysISO(from, 20) });
  const items = data?.data || [];
  const byDate = items.reduce((m, r) => ((m[r.date] ||= []).push(r), m), {});

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader icon={<FiCalendar />} title="My Duty Roster" subtitle="Your duties for the next three weeks, including temporary changes." />
      <Card bodyClassName="p-4">
        {loading ? (
          <Loading />
        ) : !items.length ? (
          <EmptyState title="No duties scheduled" text="Your branch in-charge has not published a roster for these dates yet." />
        ) : (
          <div className="space-y-2.5">
            {Object.entries(byDate).map(([date, list], i) => (
              <motion.div key={date} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={`flex items-center gap-4 p-3 rounded-2xl border ${date === todayISO() ? "border-brand-gold bg-brand-gold/5" : "border-brand-beige/50 dark:border-brand-dark-grey/50"}`}>
                <div className="w-14 text-center">
                  <div className="text-[10px] font-black uppercase text-brand-dark-grey">{new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", timeZone: "UTC" })}</div>
                  <div className="text-xl font-black">{date.slice(8)}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {list.map((r) => (
                    <span key={r._id} className={`px-3 py-1.5 rounded-xl border text-xs font-black ${DUTY_STYLE[r.dutyType]?.cls}`}>
                      {DUTY_STYLE[r.dutyType]?.label} {r.startTime && `· ${r.startTime}–${r.endTime}`} {r.isTemporary && <FiRepeat className="inline ml-1" />}
                      <span className="block text-[10px] font-bold opacity-75">{r.branch}{r.note ? ` · ${r.note}` : ""}</span>
                    </span>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

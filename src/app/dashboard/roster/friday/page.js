"use client";

import { useMemo, useState } from "react";
import { FiAlertTriangle, FiEdit3, FiPlus } from "react-icons/fi";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrQuery } from "@/hooks/useHr";
import { Avatar, Btn, Card, EmptyState, Loading, PageHeader, pageCls, Select } from "@/components/hr/HrUi";
import FridayDutyModal from "@/components/hr/modals/FridayDutyModal";
import { DUTY_STYLE } from "@/components/hr/duty";
import { coverageGaps, dateLabel, minsText, rangeText } from "@/components/hr/dailyDuty";

const hoursLine = (f) => {
  if (f.closed) return `Branch closed${f.note ? ` · ${f.note}` : ""}`;
  if (!f.open || !f.close) return "Branch hours not set for Friday";
  return `Branch open ${rangeText(f.open, f.close)}${f.note ? ` · ${f.note}` : ""}`;
};

export default function FridayDutyPage() {
  const permissions = usePagePermission();
  const [branch, setBranch] = useState("");
  const [count, setCount] = useState(6);
  const [editing, setEditing] = useState(null);
  const q = useHrQuery("/duty-plan/fridays", { branch, count });
  const data = q.data?.data;
  const staff = useMemo(() => data?.staff || [], [data]);
  const byId = useMemo(() => Object.fromEntries(staff.map((p) => [String(p._id), p])), [staff]);

  // Fewest Fridays lately first: the people whose turn it is.
  const share = useMemo(() => {
    const upcoming = {};
    for (const f of data?.fridays || []) for (const d of f.duties) upcoming[d.employee] = (upcoming[d.employee] || 0) + 1;
    return staff
      .filter((p) => !p.visiting)
      .map((p) => ({ ...p, upcoming: upcoming[String(p._id)] || 0 }))
      .sort((a, b) => a.recent - b.recent || a.upcoming - b.upcoming || a.name.localeCompare(b.name));
  }, [staff, data]);
  const most = Math.max(1, ...share.map((p) => p.recent));

  return (
    <div className={pageCls}>
      <PageHeader
        title="Friday Duty"
        subtitle="Friday is the weekly day off. Pick who works each Friday and their hours; the Fridays-worked list shows whose turn it is."
        actions={data?.branches?.length > 1 && <Select value={data.branch} onChange={setBranch} options={data.branches} className="w-56" aria-label="Branch" />}
      />

      {q.loading && !data ? (
        <Loading rows={6} />
      ) : q.error && !data ? (
        <EmptyState title="Couldn't load Friday duty" text={q.error} action={<Btn variant="ghost" size="sm" onClick={q.refetch}>Try again</Btn>} />
      ) : !data?.branch ? (
        <EmptyState title="No branches" text="Add branches in Settings → Branches." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-6 items-start">
          <div className="space-y-4">
            {data.fridays.map((f, i) => {
              const gaps = f.closed ? [] : coverageGaps(f.open, f.close, f.duties.map((d) => ({ start: d.startTime, end: d.endTime })));
              const away = staff.filter((p) => p.leaveOn.includes(f.date));
              return (
                <Card
                  key={f.date}
                  title={
                    <span className="flex flex-wrap items-center gap-2">
                      {dateLabel(f.date, { weekday: "long", day: "numeric", month: "long" })}
                      {i === 0 && <span className="px-2 py-0.5 rounded-full bg-brand-gold/15 text-brand-gold text-[10px] font-black">This Friday</span>}
                    </span>
                  }
                  subtitle={<span className={f.closed ? "text-red-500 font-bold" : ""}>{hoursLine(f)}</span>}
                  actions={
                    permissions.canAdd && (
                      <Btn variant={f.duties.length || f.closed ? "ghost" : "gold"} size="sm" onClick={() => setEditing(f)}>
                        {f.duties.length ? <><FiEdit3 /> Change</> : <><FiPlus /> Set Friday duty</>}
                      </Btn>
                    )
                  }
                  bodyClassName="p-4 sm:p-5 space-y-3"
                >
                  {f.duties.length ? (
                    <ul className="flex flex-wrap gap-2">
                      {f.duties.map((d) => (
                        <li key={d._id} className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-2xl border border-teal-400/40 bg-teal-400/10">
                          <Avatar name={d.employeeName} photo={byId[d.employee]?.photo} size={26} />
                          <span className="min-w-0">
                            <span className="block text-xs font-black truncate">{d.employeeName}</span>
                            <span className="block text-[10px] font-bold text-teal-700 dark:text-teal-300">
                              {rangeText(d.startTime, d.endTime)}
                              {d.dutyType !== "friday" ? ` · ${DUTY_STYLE[d.dutyType]?.label || d.dutyType}` : ""}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">{f.closed ? "No duty needed." : "Nobody on Friday duty yet."}</p>
                  )}
                  {f.duties.length > 0 && gaps.length > 0 && (
                    <p className="flex items-start gap-2 text-[11px] font-bold text-red-600 dark:text-red-400">
                      <FiAlertTriangle className="mt-0.5 shrink-0" />
                      Nobody on duty {gaps.map(([x, y]) => `${minsText(x)} – ${minsText(y)}`).join(", ")}.
                    </p>
                  )}
                  {away.length > 0 && (
                    <p className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">On leave: {away.map((p) => p.name).join(", ")}</p>
                  )}
                </Card>
              );
            })}
            {count < 12 && (
              <Btn variant="ghost" size="sm" onClick={() => setCount(12)} className="w-full">Show the next 12 Fridays</Btn>
            )}
          </div>

          <Card title="Fridays worked" subtitle={`Last 12 weeks, since ${dateLabel(data.since, { day: "numeric", month: "short" })}. Fewest first.`} bodyClassName="p-0" className="lg:sticky lg:top-4">
            {!share.length ? (
              <p className="p-5 text-xs font-bold text-brand-dark-grey">No staff in this branch.</p>
            ) : (
              <ul className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40 max-h-[70vh] overflow-y-auto">
                {share.map((p) => (
                  <li key={p._id} className="flex items-center gap-3 px-4 py-2.5">
                    <Avatar name={p.name} photo={p.photo} size={30} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-black truncate">{p.name}</span>
                        <span className="text-xs font-black tabular-nums shrink-0">{p.recent}</span>
                      </div>
                      <div className="mt-1 h-1.5 rounded-full bg-brand-offwhite dark:bg-brand-midnight overflow-hidden">
                        <div className="h-full rounded-full bg-teal-500" style={{ width: `${(p.recent / most) * 100}%` }} />
                      </div>
                      <div className="mt-1 text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 truncate">
                        {p.last ? `Last ${dateLabel(p.last, { day: "numeric", month: "short" })}` : "No Friday duty yet"}
                        {p.upcoming ? ` · ${p.upcoming} coming up` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      <FridayDutyModal
        day={editing && { date: editing.date, branch: data?.branch, hours: { open: editing.open, close: editing.close, closed: editing.closed, note: editing.note }, assigned: editing.duties.filter((d) => d.dutyType === "friday") }}
        staff={staff}
        endpoint="/duty-plan/fridays"
        permissions={permissions}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          q.refetch();
        }}
      />
    </div>
  );
}

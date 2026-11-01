"use client";

import { useContext, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { FiAlertTriangle, FiChevronLeft, FiChevronRight, FiClock, FiCoffee, FiPrinter, FiUserCheck, FiUserX, FiUsers } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { addDaysISO, useHrQuery } from "@/hooks/useHr";
import { Avatar, Btn, Card, controlCls, EmptyState, Loading, PageHeader, pageCls, SearchBox, StatCard } from "@/components/hr/HrUi";
import { DUTY_STYLE } from "@/components/hr/duty";
import { branchColor } from "@/components/hr/dutyPlan";
import { attendanceFor, clockIn, coverageGaps, dateLabel, dutyStatus, minsOf, minsText, rangeText, shortRange, spanOf, weekdayOf } from "@/components/hr/dailyDuty";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

const LONG = { weekday: "long", day: "numeric", month: "long", year: "numeric" };

const hoursLine = (b) => {
  if (b.closed) return `Closed${b.note ? ` · ${b.note}` : ""}`;
  if (!b.open || !b.close) return "Opening hours not set";
  return `Open ${rangeText(b.open, b.close)}${b.note ? ` · ${b.note}` : ""}`;
};

const BAR = {
  in: "bg-emerald-500/20 border-emerald-500/60",
  late: "bg-amber-500/20 border-amber-500/60",
  out: "bg-zinc-400/20 border-zinc-400/60",
  upcoming: "bg-brand-gold/15 border-brand-gold/60 border-dashed",
  scheduled: "bg-brand-gold/15 border-brand-gold/60 border-dashed",
  missing: "bg-red-500/15 border-red-500/60",
  absent: "bg-red-500/15 border-red-500/60",
  leave: "bg-blue-500/10 border-blue-400/50",
};
const PILL = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  red: "bg-red-500/10 text-red-600 dark:text-red-400",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  slate: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300",
};
const HATCH = { backgroundImage: "repeating-linear-gradient(135deg, rgba(239,68,68,.35) 0 5px, transparent 5px 10px)" };
const LEAVE_HATCH = { backgroundImage: "repeating-linear-gradient(135deg, rgba(59,130,246,.25) 0 4px, transparent 4px 8px)" };

const FILTERS = {
  all: () => true,
  duty: (r) => !r.onLeave,
  in: (r) => !!r.attendance?.inTime,
  late: (r) => !!r.attendance?.isLate,
  missing: (r) => r.status.key === "missing" || r.status.key === "absent",
  leave: (r) => !!r.onLeave,
};

export default function DailyDutyPage() {
  const { company } = useContext(AuthContext);
  const { timeZone } = useSystemTimeZone();
  // Re-read the clock every minute so "now" and live statuses move on their own.
  const [clock, setClock] = useState(() => clockIn(timeZone));
  useEffect(() => {
    const update = () => setClock(clockIn(timeZone));
    const first = setTimeout(update, 0);
    const t = setInterval(update, 60000);
    return () => {
      clearTimeout(first);
      clearInterval(t);
    };
  }, [timeZone]);

  const [date, setDate] = useState("");
  const [branch, setBranch] = useState("all");
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const day = date || clock.date;
  const q = useHrQuery("/duty-plan/daily", { date: day });
  const data = q.data?.data;
  const when = !data ? "today" : data.date === data.today ? "today" : data.date < data.today ? "past" : "future";
  const { refetch } = q;

  // Check-ins arrive through the day; keep today's view fresh.
  useEffect(() => {
    if (when !== "today") return undefined;
    const t = setInterval(refetch, 180000);
    return () => clearInterval(t);
  }, [when, refetch]);

  const names = useMemo(() => (data?.branches || []).map((b) => b.name), [data]);
  const branches = useMemo(
    () =>
      (data?.branches || []).map((b) => {
        const byPerson = new Map();
        for (const d of b.duties) {
          const id = String(d.employee._id);
          if (!byPerson.has(id)) byPerson.set(id, { id, employee: d.employee, windows: [], onLeave: d.onLeave, attendance: d.attendance });
          byPerson.get(id).windows.push({ start: d.start, end: d.end, source: d.source, dutyType: d.dutyType, note: d.note });
        }
        const rows = [...byPerson.values()].map((r) => {
          const row = { ...r, attendance: attendanceFor(r.attendance, r.windows) };
          return { ...row, status: dutyStatus(row, when, clock.minutes) };
        });
        const gaps = b.closed ? [] : coverageGaps(b.open, b.close, rows.filter((r) => !r.onLeave).flatMap((r) => r.windows));
        return { ...b, rows, gaps };
      }),
    [data, when, clock.minutes],
  );
  const visible = useMemo(() => (branch === "all" ? branches : branches.filter((b) => b.name === branch)), [branches, branch]);

  // People are counted once even when they work at two branches that day.
  const stats = useMemo(() => {
    const seen = new Map();
    for (const b of visible) for (const r of b.rows) if (!seen.has(r.id)) seen.set(r.id, r);
    const all = [...seen.values()];
    return Object.fromEntries(Object.entries(FILTERS).map(([k, fn]) => [k, all.filter(fn).length]));
  }, [visible]);

  const shown = useMemo(() => {
    const s = search.trim().toLowerCase();
    const match = (r) => FILTERS[filter](r) && (!s || `${r.employee.name} ${r.employee.employeeId || ""} ${r.employee.jobPosition || ""}`.toLowerCase().includes(s));
    return visible.map((b) => ({ ...b, shownRows: b.rows.filter(match) }));
  }, [visible, filter, search]);

  const print = () => {
    const body = visible
      .map((b) => {
        const rows = b.rows.map((r, i) => [
          i + 1,
          r.employee.name,
          r.employee.jobPosition || "",
          r.windows.map((w) => rangeText(w.start, w.end)).join(", "),
          [...new Set(r.windows.map((w) => (w.source === "roster" ? DUTY_STYLE[w.dutyType]?.label || "Roster" : "Duty time")))].join(", "),
          when === "future" ? "" : `${r.status.label}${r.status.hint ? ` (${r.status.hint})` : ""}`,
        ]);
        return `<h2>${esc(b.name)}</h2><p class="sub">${esc(hoursLine(b))}${b.gaps.length ? ` — nobody on duty ${esc(b.gaps.map(([x, y]) => `${minsText(x)}–${minsText(y)}`).join(", "))}` : ""}</p>${
          rows.length ? tableHtml(["SL", "Name", "Designation", "Duty time", "From", "Status"], rows) : "<p>No one on duty.</p>"
        }`;
      })
      .join("");
    printDocument({ title: "Daily Duty", subtitle: dateLabel(day, LONG), company, bodyHtml: body || "<p>No branches.</p>" });
  };

  const isFriday = weekdayOf(day) === "friday";
  const missingLabel = when === "today" ? "Not in yet" : "No check-in";

  return (
    <div className={pageCls}>
      <PageHeader
        title="Daily Duty"
        subtitle={`${when === "today" ? "Today, " : ""}${dateLabel(day, LONG)}${when === "today" ? ` · ${minsText(clock.minutes)}` : ""}`}
        actions={
          <>
            <div className="flex items-center gap-1.5">
              <Btn variant="ghost" size="sm" onClick={() => setDate(addDaysISO(day, -1))} aria-label="Previous day"><FiChevronLeft /></Btn>
              <input type="date" value={day} onChange={(e) => e.target.value && setDate(e.target.value)} className={controlCls} aria-label="Date" />
              <Btn variant="ghost" size="sm" onClick={() => setDate(addDaysISO(day, 1))} aria-label="Next day"><FiChevronRight /></Btn>
            </div>
            <Btn variant="ghost" size="sm" disabled={day === clock.date} onClick={() => setDate("")}>Today</Btn>
            <Btn variant="gold" size="sm" onClick={print} disabled={!data}><FiPrinter /> Print</Btn>
          </>
        }
      />

      {names.length > 1 && (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Branch">
          {["all", ...names].map((b) => {
            const on = branch === b;
            const n = b === "all" ? new Set(branches.flatMap((x) => x.rows.filter((r) => !r.onLeave).map((r) => r.id))).size : branches.find((x) => x.name === b)?.rows.filter((r) => !r.onLeave).length || 0;
            return (
              <button
                key={b}
                type="button"
                aria-pressed={on}
                onClick={() => setBranch(b)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${on ? "bg-brand-gold text-brand-midnight border-brand-gold" : "bg-brand-white dark:bg-brand-charcoal border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold"}`}
              >
                {b !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: branchColor(b, names) }} />}
                {b === "all" ? "All branches" : b}
                <span className={`text-[10px] font-black ${on ? "text-brand-midnight/70" : "text-brand-dark-grey dark:text-brand-gold-light"}`}>{n}</span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 xl:grid-cols-5 gap-4">
        <StatCard index={0} icon={<FiUsers />} label="On duty" value={stats.duty ?? 0} hint="People scheduled" active={filter === "duty"} onClick={() => setFilter(filter === "duty" ? "all" : "duty")} />
        <StatCard index={1} tone="green" icon={<FiUserCheck />} label="Checked in" value={when === "future" ? "—" : stats.in ?? 0} active={filter === "in"} onClick={() => setFilter(filter === "in" ? "all" : "in")} />
        <StatCard index={2} tone="amber" icon={<FiClock />} label="Late" value={when === "future" ? "—" : stats.late ?? 0} active={filter === "late"} onClick={() => setFilter(filter === "late" ? "all" : "late")} />
        <StatCard index={3} tone="red" icon={<FiUserX />} label={missingLabel} value={when === "future" ? "—" : stats.missing ?? 0} hint={when === "today" ? "Duty has started" : undefined} active={filter === "missing"} onClick={() => setFilter(filter === "missing" ? "all" : "missing")} />
        <StatCard index={4} tone="blue" icon={<FiCoffee />} label="On leave" value={stats.leave ?? 0} active={filter === "leave"} onClick={() => setFilter(filter === "leave" ? "all" : "leave")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">
          {filter === "all" ? "Everyone on duty" : `Showing: ${filter === "missing" ? missingLabel.toLowerCase() : { duty: "on duty", in: "checked in", late: "late", leave: "on leave" }[filter]}`}
          {filter !== "all" && (
            <button type="button" onClick={() => setFilter("all")} className="ml-2 font-black text-brand-gold hover:underline cursor-pointer">Show everyone</button>
          )}
        </p>
        <SearchBox value={search} onChange={setSearch} placeholder="Name, ID, designation" className="w-full sm:w-60" />
      </div>

      {q.loading && !data ? (
        <Loading rows={6} />
      ) : q.error && !data ? (
        <EmptyState title="Couldn't load the daily duty" text={q.error} action={<Btn variant="ghost" size="sm" onClick={refetch}>Try again</Btn>} />
      ) : !shown.length ? (
        <EmptyState title="No branches" text="Add branches in Settings → Branches." />
      ) : (
        <div className="space-y-6">
          {shown.map((b) => (
            <BranchDay key={b.name} b={b} color={branchColor(b.name, names)} when={when} nowMin={when === "today" ? clock.minutes : null} isFriday={isFriday} filtered={filter !== "all" || !!search.trim()} />
          ))}
        </div>
      )}

      <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
        Duty times come from <Link href="/dashboard/employee/duty-time" className="font-black text-brand-gold hover:underline">Employee Duty Time</Link>. Friday duty, covers and days off come from the{" "}
        <Link href="/dashboard/roster" className="font-black text-brand-gold hover:underline">Roster Planner</Link> and replace the usual time for that day. Branch hours come from{" "}
        <Link href="/dashboard/settings/branches" className="font-black text-brand-gold hover:underline">Branches</Link> and the gym calendar.
      </p>
    </div>
  );
}

const tickText = (m) => {
  const h = Math.floor((((m % 1440) + 1440) % 1440) / 60);
  return `${h % 12 || 12} ${h < 12 ? "AM" : "PM"}`;
};

// One branch on the day: hours, coverage gaps and a timeline row per person.
function BranchDay({ b, color, when, nowMin, isFriday, filtered }) {
  const hours = b.closed ? null : spanOf(b.open, b.close);
  const spans = b.rows.flatMap((r) => r.windows.map((w) => spanOf(w.start, w.end))).filter(Boolean);
  let lo = Math.min(...spans.map((s) => s[0]), hours ? hours[0] : Infinity);
  let hi = Math.max(...spans.map((s) => s[1]), hours ? hours[1] : -Infinity);
  if (!Number.isFinite(lo)) [lo, hi] = [360, 1320];
  lo = Math.floor(lo / 60) * 60;
  hi = Math.max(Math.ceil(hi / 60) * 60, lo + 360);
  const pct = (m) => `${(((m - lo) / (hi - lo)) * 100).toFixed(3)}%`;
  const wid = (a, z) => `${(((z - a) / (hi - lo)) * 100).toFixed(3)}%`;
  const step = hi - lo > 14 * 60 ? 180 : 120;
  const ticks = [];
  for (let m = lo; m <= hi; m += step) ticks.push(m);
  const now = nowMin !== null && nowMin >= lo && nowMin <= hi ? nowMin : null;
  const onDuty = b.rows.filter((r) => !r.onLeave).length;
  const checkedIn = b.rows.filter((r) => r.attendance?.inTime).length;

  const track = (children, bg = true) => (
    <div className="relative h-9">
      {bg && hours && <div className="absolute inset-y-1 rounded-md bg-brand-gold/[0.06]" style={{ left: pct(hours[0]), width: wid(hours[0], hours[1]) }} />}
      {children}
      {now !== null && <div className="absolute inset-y-0 w-px bg-red-500/80" style={{ left: pct(now) }} />}
    </div>
  );

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
          {b.name}
        </span>
      }
      subtitle={<span className={b.closed ? "text-red-500 font-bold" : ""}>{hoursLine(b)}</span>}
      actions={
        <span className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">
          <span className="font-black text-brand-black dark:text-brand-white">{onDuty}</span> on duty
          {when !== "future" && (
            <>
              {" · "}
              <span className="font-black text-emerald-600 dark:text-emerald-400">{checkedIn}</span> checked in
            </>
          )}
        </span>
      }
      bodyClassName="p-0"
    >
      {b.gaps.length > 0 && (
        <div className="mx-4 sm:mx-5 mt-4 flex items-start gap-2 rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300 px-4 py-2.5 text-xs font-bold">
          <FiAlertTriangle className="mt-0.5 shrink-0" />
          <span>Nobody on duty {b.gaps.map(([x, y]) => `${minsText(x)} – ${minsText(y)}`).join(", ")} while the branch is open.</span>
        </div>
      )}

      {!b.rows.length ? (
        <div className="px-5 py-8 text-center text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">
          {b.closed ? (
            "Branch closed — no duty."
          ) : isFriday ? (
            <>
              Friday is the weekly day off and nobody has Friday duty here yet.{" "}
              <Link href="/dashboard/roster/friday" className="font-black text-brand-gold hover:underline">Set Friday duty</Link>
            </>
          ) : (
            <>
              Nobody is planned here on this day. Set duty times on{" "}
              <Link href="/dashboard/employee/duty-time" className="font-black text-brand-gold hover:underline">Employee Duty Time</Link>.
            </>
          )}
        </div>
      ) : (
        <div className="px-4 sm:px-5 py-3">
          {/* Axis + opening hours (timeline from md up). */}
          <div className="hidden md:grid grid-cols-[220px_1fr_190px] gap-4 items-end">
            <span />
            <div className="relative h-5 text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">
              {ticks.map((m) => (
                <span key={m} className="absolute -translate-x-1/2 whitespace-nowrap" style={{ left: pct(m) }}>{tickText(m)}</span>
              ))}
            </div>
            <span />
          </div>
          <div className="hidden md:grid grid-cols-[220px_1fr_190px] gap-4 items-center border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
            <span className="text-[11px] font-black text-brand-dark-grey dark:text-brand-gold-light">Branch open</span>
            {track(
              <>
                {hours && <div className="absolute top-2 bottom-2 rounded-md bg-brand-gold/25 border border-brand-gold/50" style={{ left: pct(hours[0]), width: wid(hours[0], hours[1]) }} />}
                {b.gaps.map(([x, y]) => (
                  <div key={x} className="absolute top-2 bottom-2 rounded-sm" style={{ left: pct(x), width: wid(x, y), ...HATCH }} title={`Nobody on duty ${minsText(x)} – ${minsText(y)}`} />
                ))}
              </>,
              false,
            )}
            <span className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">{hours ? rangeText(b.open, b.close) : b.closed ? "Closed" : "Not set"}</span>
          </div>

          <ul className="divide-y divide-brand-beige/40 dark:divide-brand-dark-grey/40">
            {b.shownRows.map((r) => {
              // Check-in → check-out (or now), kept inside the timeline.
              const rawIn = minsOf(r.attendance?.inTime);
              let rawOut = r.attendance?.outTime ? minsOf(r.attendance.outTime) : when === "today" ? nowMin : null;
              if (rawIn !== null && rawOut !== null && rawOut < rawIn) rawOut += 1440;
              const inAt = rawIn === null || rawIn > hi || (rawOut ?? rawIn) < lo ? null : Math.max(rawIn, lo);
              const outAt = rawOut === null ? null : Math.min(rawOut, hi);
              const roster = r.windows.filter((w) => w.source === "roster");
              return (
                <li key={r.id} className="grid grid-cols-[1fr_auto] md:grid-cols-[220px_1fr_190px] gap-x-4 gap-y-1 items-center py-1.5">
                  <div className="flex items-center gap-2.5 min-w-0 py-1">
                    <Avatar name={r.employee.name} photo={r.employee.photo} size={32} />
                    <div className="min-w-0">
                      <div className="text-xs font-black truncate">{r.employee.name}</div>
                      <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 truncate">
                        {r.employee.jobPosition || "—"}
                        {roster.map((w, i) => (
                          <span key={i} className={`ml-1.5 px-1.5 py-px rounded-md border text-[9px] font-black ${DUTY_STYLE[w.dutyType]?.cls || ""}`}>{DUTY_STYLE[w.dutyType]?.label || "Roster"}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block">
                    {track(
                      <>
                        {r.windows.map((w, i) => {
                          const s = spanOf(w.start, w.end);
                          return s ? (
                            <div
                              key={i}
                              className={`absolute top-1.5 bottom-1.5 rounded-md border ${BAR[r.status.key] || BAR.scheduled}`}
                              style={{ left: pct(s[0]), width: wid(s[0], s[1]), ...(r.onLeave ? LEAVE_HATCH : {}) }}
                              title={`${rangeText(w.start, w.end)}${w.note ? ` · ${w.note}` : ""}`}
                            />
                          ) : null;
                        })}
                        {/* What actually happened: check-in to check-out (or to now). */}
                        {inAt !== null &&
                          (outAt !== null && outAt > inAt ? (
                            <div className={`absolute bottom-1 h-1 rounded-full ${r.attendance.isLate ? "bg-amber-500" : "bg-emerald-500"}`} style={{ left: pct(inAt), width: wid(inAt, outAt) }} />
                          ) : (
                            <div className={`absolute bottom-0.5 w-2 h-2 rounded-full -translate-x-1/2 ${r.attendance.isLate ? "bg-amber-500" : "bg-emerald-500"}`} style={{ left: pct(inAt) }} />
                          ))}
                      </>,
                    )}
                  </div>
                  <div className="flex flex-col items-end md:items-start gap-0.5 min-w-0">
                    {(when !== "future" || r.onLeave) && (
                      <span className="flex flex-wrap items-center justify-end md:justify-start gap-x-1.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black whitespace-nowrap ${PILL[r.status.tone]}`}>{r.status.label}</span>
                        {r.status.hint && <span className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 whitespace-nowrap">{r.status.hint}</span>}
                      </span>
                    )}
                    <span className="hidden md:block text-[10px] font-bold text-brand-black/70 dark:text-brand-white/70 truncate max-w-full">
                      {r.windows.map((w) => shortRange(w.start, w.end)).join(", ")}
                    </span>
                  </div>
                  {/* Duty time on phones, where the timeline is hidden. */}
                  <div className="md:hidden col-span-2 -mt-1 pl-[42px] text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">
                    {r.windows.map((w) => rangeText(w.start, w.end)).join(", ")}
                  </div>
                </li>
              );
            })}
            {!b.shownRows.length && filtered && <li className="py-5 text-center text-xs font-bold text-brand-dark-grey">No one here matches the filter.</li>}
          </ul>
        </div>
      )}
    </Card>
  );
}

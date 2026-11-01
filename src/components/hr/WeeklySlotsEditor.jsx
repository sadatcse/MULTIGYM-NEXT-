"use client";

import { FiCopy, FiMinus, FiPlus } from "react-icons/fi";

export const WEEK_DAYS = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
const LABEL = { saturday: "Saturday", sunday: "Sunday", monday: "Monday", tuesday: "Tuesday", wednesday: "Wednesday", thursday: "Thursday", friday: "Friday" };

const toMin = (t) => {
  const [h, m] = String(t || "").split(":").map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
};
const slotMinutes = (s) => {
  const a = toMin(s.startTime);
  const b = toMin(s.endTime);
  if (a === null || b === null) return 0;
  return b > a ? b - a : b + 1440 - a;
};
const fmt = (min) => `${Math.floor(min / 60)}h${min % 60 ? ` ${min % 60}m` : ""}`;

/** Weekly totals: days with slots, total minutes, average minutes per working day. */
export function weeklyTotals(weekly = {}) {
  const days = WEEK_DAYS.filter((d) => (weekly[d] || []).some((s) => s.startTime && s.endTime));
  const total = WEEK_DAYS.reduce((sum, d) => sum + (weekly[d] || []).reduce((t, s) => t + slotMinutes(s), 0), 0);
  return { days: days.length, total, perDay: days.length ? Math.round(total / days.length) : 0 };
}

// Duty times for each day of the week; a day can have several slots
// (e.g. 07:00–09:00, 10:00–12:00, 15:00–17:00). A day with no slots is off.
export default function WeeklySlotsEditor({ value = {}, onChange, disabled }) {
  const set = (day, slots) => onChange({ ...value, [day]: slots });
  const copyToAll = (day) => onChange(Object.fromEntries(WEEK_DAYS.map((d) => [d, (value[day] || []).map((s) => ({ ...s }))])));
  const t = weeklyTotals(value);

  return (
    <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-brand-black dark:text-brand-white">Duty times for each day</span>
        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">{t.days} working day{t.days === 1 ? "" : "s"} · {fmt(t.total)} a week</span>
      </div>
      {WEEK_DAYS.map((day) => {
        const slots = value[day] || [];
        const mins = slots.reduce((s, x) => s + slotMinutes(x), 0);
        return (
          <div key={day} className="grid sm:grid-cols-[110px_minmax(0,1fr)] gap-2 items-start p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50">
            <div>
              <div className="text-xs font-black text-brand-black dark:text-brand-white">{LABEL[day]}</div>
              <div className={`text-[10px] font-bold ${slots.length ? "text-brand-dark-grey dark:text-brand-gold-light" : "text-amber-600 dark:text-amber-400"}`}>{slots.length ? fmt(mins) : "Day off"}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {slots.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1 rounded-lg border border-brand-beige/60 dark:border-brand-dark-grey px-1.5 py-1">
                  <input type="time" aria-label={`${LABEL[day]} slot ${i + 1} start`} value={s.startTime} disabled={disabled} onChange={(e) => set(day, slots.map((x, j) => (j === i ? { ...x, startTime: e.target.value } : x)))} className="w-[92px] bg-transparent text-xs font-bold outline-none dark:[color-scheme:dark]" />
                  <span className="text-[10px] font-bold text-brand-dark-grey">to</span>
                  <input type="time" aria-label={`${LABEL[day]} slot ${i + 1} end`} value={s.endTime} disabled={disabled} onChange={(e) => set(day, slots.map((x, j) => (j === i ? { ...x, endTime: e.target.value } : x)))} className="w-[92px] bg-transparent text-xs font-bold outline-none dark:[color-scheme:dark]" />
                  {!disabled && (
                    <button type="button" onClick={() => set(day, slots.filter((_, j) => j !== i))} className="p-1 rounded text-rose-500 hover:bg-rose-500/10 cursor-pointer" aria-label="Remove slot"><FiMinus className="text-xs" /></button>
                  )}
                </span>
              ))}
              {!disabled && (
                <>
                  <button type="button" onClick={() => set(day, [...slots, { startTime: slots.length ? slots[slots.length - 1].endTime : "07:00", endTime: "" }])} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-sky-600 hover:bg-sky-500/10 cursor-pointer"><FiPlus /> Slot</button>
                  {slots.length > 0 && (
                    <button type="button" onClick={() => copyToAll(day)} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-bold text-brand-dark-grey hover:bg-brand-gold/10 cursor-pointer" title="Use these times for every day"><FiCopy /> Copy to all days</button>
                  )}
                </>
              )}
            </div>
          </div>
        );
      })}
      <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Attendance counts late from the first slot and early leave from the last slot of the day. Days without slots are off days.</p>
    </div>
  );
}

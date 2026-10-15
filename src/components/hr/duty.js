// Visual style + default times for each roster duty type (shared by the
// roster planner and "My Roster" pages).
export const DUTY_STYLE = {
  morning: { label: "Morning", cls: "bg-amber-400/15 text-amber-600 dark:text-amber-300 border-amber-400/40", times: ["06:00", "14:00"] },
  evening: { label: "Evening", cls: "bg-indigo-400/15 text-indigo-600 dark:text-indigo-300 border-indigo-400/40", times: ["14:00", "22:00"] },
  full_day: { label: "Full Day", cls: "bg-emerald-400/15 text-emerald-600 dark:text-emerald-300 border-emerald-400/40", times: ["09:00", "17:00"] },
  friday: { label: "Friday Duty", cls: "bg-teal-400/15 text-teal-600 dark:text-teal-300 border-teal-400/40", times: ["15:00", "22:00"] },
  special: { label: "Special", cls: "bg-pink-400/15 text-pink-600 dark:text-pink-300 border-pink-400/40", times: ["10:00", "18:00"] },
  opening: { label: "Opening", cls: "bg-sky-400/15 text-sky-600 dark:text-sky-300 border-sky-400/40", times: ["05:30", "09:00"] },
  closing: { label: "Closing", cls: "bg-violet-400/15 text-violet-600 dark:text-violet-300 border-violet-400/40", times: ["21:00", "23:30"] },
  night: { label: "Night", cls: "bg-slate-500/15 text-slate-600 dark:text-slate-300 border-slate-500/40", times: ["22:00", "06:00"] },
  off: { label: "Day Off", cls: "bg-zinc-400/10 text-zinc-500 border-zinc-400/30 border-dashed", times: ["", ""] },
};

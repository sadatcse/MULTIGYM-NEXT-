// Helpers shared by the duty-time page and its editor.

export const WEEK = ["saturday", "sunday", "monday", "tuesday", "wednesday", "thursday", "friday"];
export const DAY_SHORT = { saturday: "Sat", sunday: "Sun", monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu", friday: "Fri" };
// Friday is everyone's day off; an entry without days means Saturday–Thursday.
export const WORK_DAYS = WEEK.filter((d) => d !== "friday");
export const daysOf = (e) => (e?.days?.length ? e.days : WORK_DAYS);

/** "08:00 AM" / "8:00" / "20:30" → "HH:mm" ("" when unreadable). */
export function toHHMM(t) {
  const m = String(t || "").trim().match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/);
  if (!m) return "";
  let h = Number(m[1]);
  const min = Number(m[2]);
  if (m[3]) h = (h % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0);
  if (h > 23 || min > 59) return "";
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

/** "14:30" → "2:30 PM". */
export function fmt12(t) {
  const v = toHHMM(t);
  if (!v) return "—";
  const [h, m] = v.split(":").map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h < 12 ? "AM" : "PM"}`;
}

const mins = (t) => {
  const v = toHHMM(t);
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};

/** Entries that apply on a weekday, sorted by start time. */
export function entriesOn(entries = [], day) {
  return entries.filter((e) => daysOf(e).includes(day)).sort((a, b) => (mins(a.inTime) ?? 0) - (mins(b.inTime) ?? 0));
}

/** Days where two windows overlap → the overlapping entry indexes. */
export function overlaps(entries = []) {
  const bad = new Set();
  for (const day of WEEK) {
    const today = entries
      .map((e, i) => ({ e, i }))
      .filter(({ e }) => daysOf(e).includes(day) && mins(e.inTime) !== null && mins(e.outTime) !== null)
      .map(({ e, i }) => {
        const a = mins(e.inTime);
        let b = mins(e.outTime);
        if (b <= a) b += 1440;
        return { a, b, i };
      })
      .sort((x, y) => x.a - y.a);
    for (let k = 1; k < today.length; k++) if (today[k].a < today[k - 1].b) bad.add(`${day}:${today[k - 1].i}:${today[k].i}`);
  }
  return [...bad].map((s) => {
    const [day, a, b] = s.split(":");
    return { day, a: Number(a), b: Number(b) };
  });
}

/** Days in words: runs of 3+ consecutive days as a range ("Sat–Thu"), shorter runs listed ("Sat, Mon"). */
export function daysText(days = []) {
  const list = days.length ? WEEK.filter((d) => days.includes(d)) : WORK_DAYS;
  if (list.length === 7) return "Every day";
  const idx = list.map((d) => WEEK.indexOf(d));
  const parts = [];
  for (let i = 0; i < idx.length; ) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1] === idx[j] + 1) j++;
    const run = idx.slice(i, j + 1).map((k) => DAY_SHORT[WEEK[k]]);
    parts.push(run.length >= 3 ? `${run[0]}–${run[run.length - 1]}` : run.join(", "));
    i = j + 1;
  }
  return parts.join(", ");
}

const PALETTE = ["#d4a017", "#2563eb", "#059669", "#db2777", "#7c3aed", "#ea580c", "#0891b2", "#65a30d"];
/** A stable colour per branch name (by its position in the branch list). */
export const branchColor = (branch, branches = []) => PALETTE[Math.max(0, branches.indexOf(branch)) % PALETTE.length];

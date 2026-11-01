// Time maths shared by the Daily Duty, Friday Duty and roster pages.
import { WEEK, entriesOn, fmt12, toHHMM } from "./dutyPlan";

export const minsOf = (t) => {
  const v = toHHMM(t);
  if (!v) return null;
  const [h, m] = v.split(":").map(Number);
  return h * 60 + m;
};

/** Minutes → "2:30 PM" (wraps past midnight). */
export const minsText = (m) => fmt12(`${String(Math.floor((((m % 1440) + 1440) % 1440) / 60)).padStart(2, "0")}:${String(((m % 60) + 60) % 60).padStart(2, "0")}`);

/** [start, end] in minutes; an end at or before the start runs past midnight. */
export function spanOf(start, end) {
  const a = minsOf(start);
  let b = minsOf(end);
  if (a === null || b === null) return null;
  if (b <= a) b += 1440;
  return [a, b];
}

export const rangeText = (start, end) => `${fmt12(start)} – ${fmt12(end)}`;

/** Weekday name ("friday") of a YYYY-MM-DD date. */
export const weekdayOf = (iso) => WEEK[(new Date(`${iso}T00:00:00Z`).getUTCDay() + 1) % 7];

export const dateLabel = (iso, opts = { weekday: "short", day: "numeric", month: "short" }) =>
  iso ? new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { ...opts, timeZone: "UTC" }) : "";

/** Today's date and the minutes since midnight in the company time zone. */
export function clockIn(timeZone = "Asia/Dhaka") {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
      .formatToParts(new Date())
      .map((p) => [p.type, p.value]),
  );
  return { date: `${parts.year}-${parts.month}-${parts.day}`, minutes: Number(parts.hour) * 60 + Number(parts.minute) };
}

/** Stretches (15 min or longer) of opening hours with nobody on duty. */
export function coverageGaps(open, close, windows) {
  const hours = spanOf(open, close);
  if (!hours) return [];
  const spans = windows.map((w) => spanOf(w.start, w.end)).filter(Boolean).sort((x, y) => x[0] - y[0]);
  const gaps = [];
  let cursor = hours[0];
  for (const [a, b] of spans) {
    if (a > cursor) gaps.push([cursor, Math.min(a, hours[1])]);
    cursor = Math.max(cursor, b);
    if (cursor >= hours[1]) break;
  }
  if (cursor < hours[1]) gaps.push([cursor, hours[1]]);
  return gaps.filter(([a, b]) => b - a >= 15);
}

/** "7 AM – 11 AM" style range for tight spaces. */
export const shortRange = (start, end) => `${fmt12(start).replace(":00", "")} – ${fmt12(end).replace(":00", "")}`;

/**
 * The day's attendance as it applies to one branch's duty windows. Attendance
 * is one record per day (first punch in, last punch out), so for staff who
 * work two branches, punches that ended an hour before this branch's duty
 * starts (or began an hour after it ends) belong to the other branch.
 */
export function attendanceFor(att, windows) {
  if (!att?.inTime) return att || null;
  const spans = windows.map((w) => spanOf(w.start, w.end)).filter(Boolean);
  if (!spans.length) return att;
  const first = Math.min(...spans.map((s) => s[0]));
  const last = Math.max(...spans.map((s) => s[1]));
  const inAt = minsOf(att.inTime);
  const outAt = att.outTime ? minsOf(att.outTime) : null;
  if ((outAt !== null && outAt < first - 60) || (inAt !== null && inAt > last + 60)) return null;
  return att;
}

/**
 * Where a person stands on a duty day. `row` = { onLeave, attendance, windows: [{ start, end }] },
 * `when` = "past" | "today" | "future".
 */
export function dutyStatus(row, when, nowMin) {
  if (row.onLeave) return { key: "leave", tone: "blue", label: "On leave", hint: row.onLeave };
  const a = row.attendance;
  if (a?.inTime) {
    const late = a.isLate ? `Late ${a.lateMinutes || ""}${a.lateMinutes ? "m" : ""}`.trim() : "";
    if (a.outTime) return { key: "out", tone: "slate", label: "Checked out", hint: `${fmt12(a.inTime)} – ${fmt12(a.outTime)}${late ? ` · ${late}` : ""}` };
    if (late) return { key: "late", tone: "amber", label: late, hint: `In ${fmt12(a.inTime)}` };
    return { key: "in", tone: "green", label: "Checked in", hint: `In ${fmt12(a.inTime)}` };
  }
  if (when === "future") return { key: "scheduled", tone: "slate", label: "Scheduled" };
  const spans = row.windows.map((w) => spanOf(w.start, w.end)).filter(Boolean);
  const first = Math.min(...spans.map((s) => s[0]));
  const last = Math.max(...spans.map((s) => s[1]));
  if (when === "today" && spans.length) {
    if (nowMin < first) return { key: "upcoming", tone: "slate", label: `Starts ${minsText(first)}` };
    if (nowMin < last) return { key: "missing", tone: "red", label: "Not in yet", hint: `Due ${minsText(first)}` };
  }
  return { key: "absent", tone: "red", label: "No check-in" };
}

/**
 * Planned windows for a person on a date from their Employee Duty Time
 * (every branch); people without a plan fall back to their single duty time
 * at the home branch, Saturday–Thursday.
 */
export function plannedOn(person, iso, homeBranch = "") {
  const day = weekdayOf(iso);
  if (person.branchSchedules?.length) return entriesOn(person.branchSchedules, day);
  if (person.dutyInTime && person.dutyOutTime && day !== "friday") return [{ branch: person.branches?.[0] || homeBranch, inTime: person.dutyInTime, outTime: person.dutyOutTime, days: [] }];
  return [];
}

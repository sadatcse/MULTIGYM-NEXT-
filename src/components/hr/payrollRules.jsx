"use client";

import { FiAward, FiCalendar, FiCoffee, FiSmartphone, FiSun } from "react-icons/fi";
import { money } from "@/hooks/useHr";

// Shared wording for the payroll rule pages (allowances, commission, overview).

export const ALLOWANCE_KINDS = {
  roster_duty: { label: "Roster duty allowance", icon: <FiCalendar />, help: "For each rostered duty of the chosen types the person actually attended." },
  off_day_work: { label: "Holiday & weekly-off duty pay", icon: <FiSun />, help: "For each day worked on a public holiday or a weekly off." },
  perfect_attendance: { label: "Perfect attendance", icon: <FiAward />, help: "Once a month when absences and late arrivals stay within the limits." },
  per_present_day: { label: "Per day worked", icon: <FiCoffee />, help: "For every day worked — meal, tiffin or transport money." },
  monthly_fixed: { label: "Fixed monthly allowance", icon: <FiSmartphone />, help: "A set amount every month, pro-rated for a part month — e.g. mobile bill." },
};

export const DUTY_TYPES = [
  ["opening", "Opening duty"],
  ["closing", "Closing duty"],
  ["night", "Night shift"],
  ["friday", "Friday duty"],
  ["special", "Special duty"],
  ["morning", "Morning shift"],
  ["evening", "Evening shift"],
  ["full_day", "Full day"],
];
const DUTY_LABEL = Object.fromEntries(DUTY_TYPES);

const joinWords = (list) => (list.length <= 1 ? list.join("") : `${list.slice(0, -1).join(", ")} or ${list[list.length - 1]}`);

/** An allowance rule in one sentence, e.g. "৳100 for every Opening duty or Closing duty attended". */
export function ruleSentence(r, symbol = "৳") {
  const amt = money(r.amount || 0, symbol);
  switch (r.kind) {
    case "roster_duty":
      return `${r.amountType === "day_rate" ? `${r.amount || 0}× the day's pay` : amt} for every ${joinWords((r.dutyTypes || []).map((d) => DUTY_LABEL[d] || d)) || "duty"} attended`;
    case "off_day_work": {
      const days = joinWords([(r.dayTypes || []).includes("holiday") && "public holiday", (r.dayTypes || []).includes("weekend") && "weekly off"].filter(Boolean)) || "off day";
      const pay = r.amountType === "day_rate" ? `${r.amount || 0}× the day's pay` : amt;
      return `${pay} for each ${days} worked — ${r.replacesOvertime === false ? "on top of overtime" : "instead of overtime for that day"}`;
    }
    case "perfect_attendance":
      return `${amt} a month with at most ${r.maxAbsent || 0} absence${Number(r.maxAbsent) === 1 ? "" : "s"} and ${r.maxLate || 0} late arrival${Number(r.maxLate) === 1 ? "" : "s"}`;
    case "per_present_day":
      return `${amt} for every day worked`;
    case "monthly_fixed":
      return `${amt} every month`;
    default:
      return amt;
  }
}

export const COMMISSION_TARGETS = [
  { value: "total_sales", label: "Total sales (PT + membership + products)", short: "total sales", amount: true },
  { value: "membership_sales", label: "Membership sales", short: "membership sales", amount: true },
  { value: "pt_sales", label: "PT package sales", short: "PT package sales", amount: true },
  { value: "pt_sessions", label: "PT sessions", short: "PT sessions", amount: false },
  { value: "new_members", label: "New members", short: "new members", amount: false },
];

/** A commission plan's rates in short phrases, e.g. ["৳300 / PT session", "10% of PT sales"]. */
export function planRates(p, symbol = "৳") {
  const out = [];
  if (Number(p.ptSessionRate) > 0) out.push(`${money(p.ptSessionRate, symbol)} per PT session`);
  if (Number(p.ptMonthlyRate) > 0) out.push(`${money(p.ptMonthlyRate, symbol)} per monthly PT package client`);
  if (Number(p.ptSalesPercent) > 0) out.push(`${p.ptSalesPercent}% of PT package sales`);
  if (Number(p.membershipSalesPercent) > 0) out.push(`${p.membershipSalesPercent}% of membership sales`);
  if (Number(p.newMemberRate) > 0) out.push(`${money(p.newMemberRate, symbol)} per new member`);
  if (Number(p.productSalesPercent) > 0) out.push(`${p.productSalesPercent}% of supplement & product sales`);
  if (Number(p.productItemRate) > 0) out.push(`${money(p.productItemRate, symbol)} per product sold`);
  return out;
}

/** "Reach ৳100,000 total sales → ৳2,000" for each slab. */
export function slabText(p, s, symbol = "৳") {
  const t = COMMISSION_TARGETS.find((x) => x.value === (p.targetMetric || "total_sales")) || COMMISSION_TARGETS[0];
  const goal = t.amount ? money(s.min, symbol) : `${s.min}`;
  return `${goal} ${t.short} → ${money(s.bonus, symbol)}`;
}

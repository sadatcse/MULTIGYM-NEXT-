"use client";

import { useHrConfig, useHrLookups, useHrQuery } from "@/hooks/useHr";

const ctl = "bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50";

// Month + branch + department filter row used by the monthly duty pages.
export default function MonthFilters({ month, setMonth, branch, setBranch, department, setDepartment }) {
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const deps = useHrQuery("/department", { limit: 200 });
  const departments = (deps.data?.data || []).filter((d) => d.status !== "inactive").map((d) => d.name);
  const branchOptions = me?.scope === "branch" ? me.branches || [] : ["all", ...branches];
  return (
    <>
      <input type="month" aria-label="Month" value={month} onChange={(e) => setMonth(e.target.value)} className={`${ctl} dark:[color-scheme:dark]`} />
      <select aria-label="Branch" value={branch} onChange={(e) => setBranch(e.target.value)} className={ctl}>
        {branchOptions.map((b) => <option key={b} value={b}>{b === "all" ? "All branches" : b}</option>)}
      </select>
      <select aria-label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} className={ctl}>
        <option value="all">All departments</option>
        {departments.map((d) => <option key={d} value={d}>{d}</option>)}
      </select>
    </>
  );
}

"use client";

import { Fragment, useContext, useMemo, useState } from "react";
import { FiAlertCircle, FiEdit3, FiGitBranch, FiPrinter, FiScissors, FiUsers } from "react-icons/fi";
import { MdAccessTime } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrQuery } from "@/hooks/useHr";
import { Avatar, Btn, Card, EmptyState, Loading, PageHeader, pageCls, SearchBox, StatCard, Table, Tabs, Td } from "@/components/hr/HrUi";
import DutyPlanModal from "@/components/hr/modals/DutyPlanModal";
import { DAY_SHORT, WEEK, branchColor, daysText, entriesOn, fmt12 } from "@/components/hr/dutyPlan";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

// Old single duty time as a one-row plan (every day, home branch).
const planOf = (e) =>
  e.branchSchedules?.length
    ? e.branchSchedules
    : e.dutyInTime && e.dutyOutTime
      ? [{ branch: e.branches?.[0] || "", days: [], inTime: e.dutyInTime, outTime: e.dutyOutTime, legacy: true }]
      : [];

export default function DutyTimePage() {
  const { company } = useContext(AuthContext);
  const { canEdit } = usePagePermission();
  const { me } = useHrConfig();
  const [branch, setBranch] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState("staff");
  const [filter, setFilter] = useState("all");
  const [editing, setEditing] = useState(null);

  const { data, loading, setData } = useHrQuery("/duty-plan", {});
  const branches = useMemo(() => data?.branches || [], [data]);
  const staff = useMemo(() => data?.data || [], [data]);

  const tagged = useMemo(
    () =>
      staff.map((e) => {
        const plan = planOf(e);
        const planBranches = [...new Set(plan.map((p) => p.branch).filter(Boolean))];
        const split = WEEK.some((d) => entriesOn(plan, d).length > 1);
        return { ...e, plan, planBranches, multi: planBranches.length > 1, split, none: !plan.length };
      }),
    [staff],
  );
  // Someone belongs to a branch when they are planned there or it is one of their branches.
  const inBranch = (e, b) => b === "all" || e.planBranches.includes(b) || (e.branches || []).includes(b);
  const chipBranches = me?.scope === "branch" ? branches.filter((b) => (me.branches || []).includes(b)) : branches;
  const scoped = tagged.filter((e) => inBranch(e, branch));
  const q = search.trim().toLowerCase();
  const shown = scoped
    .filter((e) => !q || `${e.name} ${e.employeeId} ${e.jobPosition}`.toLowerCase().includes(q))
    .filter((e) => (filter === "multi" ? e.multi : filter === "split" ? e.split : filter === "none" ? e.none : true));
  const sheetBranches = branch === "all" ? chipBranches : [branch];

  // Rows of the printed / on-screen branch sheet.
  const sheetFor = (b) =>
    tagged
      .filter((e) => !q || `${e.name} ${e.employeeId}`.toLowerCase().includes(q))
      .map((e) => ({ e, rows: e.plan.filter((p) => p.branch === b) }))
      .filter((x) => x.rows.length);

  const print = () => {
    const body = sheetBranches
      .map((b) => {
        const list = sheetFor(b);
        if (!list.length) return "";
        const rows = list.flatMap(({ e, rows: r }, i) => r.map((p, k) => [k === 0 ? String(i + 1).padStart(2, "0") : "", k === 0 ? e.name : "", k === 0 ? e.jobPosition || "" : "", daysText(p.days), fmt12(p.inTime), fmt12(p.outTime)]));
        return `<h2 style="margin-top:14px">${esc(b)}</h2>${tableHtml(["SL", "Name", "Designation", "Days", "In-Time", "Out-Time"], rows)}`;
      })
      .join("");
    printDocument({ title: "Branch Duty Time", subtitle: branch === "all" ? "All branches" : branch, company, bodyHtml: body || "<p>No duty plans.</p>" });
  };

  return (
    <div className={pageCls}>
      <PageHeader
        icon={<MdAccessTime />}
        title="Employee Duty Time"
        subtitle="Each person's weekly duty: branch, days and times. One branch or several, split shifts, or different times every day — attendance uses this to mark late and early leave."
        actions={
          <>
            <Btn variant="gold" size="sm" onClick={print} className="whitespace-nowrap"><FiPrinter /> Print duty sheet</Btn>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={<FiUsers />} label="Staff" value={scoped.length} onClick={() => setFilter("all")} active={filter === "all"} />
        <StatCard icon={<FiGitBranch />} label="Multi-branch" value={scoped.filter((e) => e.multi).length} tone="blue" index={1} onClick={() => setFilter("multi")} active={filter === "multi"} />
        <StatCard icon={<FiScissors />} label="Split shifts" value={scoped.filter((e) => e.split).length} tone="purple" index={2} onClick={() => setFilter("split")} active={filter === "split"} />
        <StatCard icon={<FiAlertCircle />} label="No duty time" value={scoped.filter((e) => e.none).length} tone="amber" index={3} onClick={() => setFilter("none")} active={filter === "none"} />
      </div>

      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filter by branch">
        <span className="text-[11px] font-black uppercase tracking-wide text-brand-dark-grey dark:text-brand-gold-light mr-1">Branch</span>
        {["all", ...chipBranches].map((b) => {
          const on = branch === b;
          const n = tagged.filter((e) => inBranch(e, b)).length;
          return (
            <button
              key={b}
              type="button"
              aria-pressed={on}
              onClick={() => setBranch(b)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${on ? "bg-brand-gold text-brand-midnight border-brand-gold" : "bg-brand-white dark:bg-brand-charcoal border-brand-beige/60 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold"}`}
            >
              {b !== "all" && <span className="w-2 h-2 rounded-full" style={{ background: branchColor(b, branches) }} />}
              {b === "all" ? "All branches" : b}
              <span className={`text-[10px] font-black ${on ? "text-brand-midnight/70" : "text-brand-dark-grey dark:text-brand-gold-light"}`}>{n}</span>
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={view} onChange={setView} tabs={[{ value: "staff", label: "Staff plans" }, { value: "sheet", label: "Branch duty sheet" }]} />
        <SearchBox value={search} onChange={setSearch} placeholder="Name, ID, designation" className="w-60" />
      </div>

      {loading && !data ? (
        <Card><Loading rows={8} /></Card>
      ) : view === "staff" ? (
        <Card bodyClassName="p-0">
          {!shown.length ? (
            <EmptyState icon={<MdAccessTime />} title="Nobody here" text="No active staff match these filters." />
          ) : (
            <Table head={["Employee", "Branches", ...WEEK.map((d) => ({ label: DAY_SHORT[d], className: "text-center !px-1.5" })), ""]}>
              {shown.map((e) => (
                <tr key={e._id}>
                  <Td>
                    <div className="flex items-center gap-2.5 min-w-[190px]">
                      <Avatar name={e.name} photo={e.photo} size={32} />
                      <div className="min-w-0">
                        <div className="font-black truncate">{e.name}</div>
                        <div className="text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light truncate">{[e.employeeId, e.jobPosition].filter(Boolean).join(" · ")}</div>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {(e.planBranches.length ? e.planBranches : e.branches || []).map((b) => (
                        <span key={b} className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold bg-brand-offwhite dark:bg-brand-midnight">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: branchColor(b, branches) }} />{b}
                        </span>
                      ))}
                    </div>
                  </Td>
                  {WEEK.map((d) => {
                    const list = entriesOn(e.plan, d);
                    return (
                      <Td key={d} className="!px-1 text-center align-top">
                        {list.length ? (
                          <div className="space-y-0.5">
                            {list.map((p, k) => (
                              <div key={k} className={`rounded-md px-1 py-0.5 text-[9.5px] font-bold leading-tight whitespace-nowrap text-white ${branch !== "all" && p.branch !== branch ? "opacity-30" : ""}`} style={{ background: branchColor(p.branch, branches) }} title={`${p.branch}: ${fmt12(p.inTime)} – ${fmt12(p.outTime)}`}>
                                {fmt12(p.inTime).replace(":00", "")}–{fmt12(p.outTime).replace(":00", "")}
                              </div>
                            ))}
                          </div>
                        ) : e.none ? (
                          <span className="text-[10px] text-brand-dark-grey">—</span>
                        ) : (
                          <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Off</span>
                        )}
                      </Td>
                    );
                  })}
                  <Td className="text-right">
                    {canEdit && <Btn size="sm" variant={e.none ? "primary" : "ghost"} onClick={() => setEditing(e)}><FiEdit3 /> {e.none ? "Set" : "Edit"}</Btn>}
                  </Td>
                </tr>
              ))}
            </Table>
          )}
        </Card>
      ) : (
        <div className="space-y-5">
          {sheetBranches.map((b) => {
            const list = sheetFor(b);
            return (
              <Card key={b} title={<span className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full" style={{ background: branchColor(b, branches) }} />{b}</span>} subtitle={`${list.length} ${list.length === 1 ? "person" : "people"}`} bodyClassName="p-0">
                {!list.length ? (
                  <p className="p-5 text-xs font-semibold text-brand-dark-grey dark:text-brand-gold-light">No duty planned at this branch.</p>
                ) : (
                  <Table head={["SL", "Name", "Designation", "Days", "In-Time", "Out-Time", ""]}>
                    {list.map(({ e, rows }, i) => (
                      <Fragment key={e._id}>
                        {rows.map((p, k) => (
                          <tr key={k}>
                            {k === 0 && <Td rowSpan={rows.length} className="font-black align-top">{String(i + 1).padStart(2, "0")}</Td>}
                            {k === 0 && <Td rowSpan={rows.length} className="font-black align-top whitespace-nowrap">{e.name}</Td>}
                            {k === 0 && <Td rowSpan={rows.length} className="align-top">{e.jobPosition || "—"}</Td>}
                            <Td className="whitespace-nowrap">{daysText(p.days)}</Td>
                            <Td className="whitespace-nowrap">{fmt12(p.inTime)}</Td>
                            <Td className="whitespace-nowrap">{fmt12(p.outTime)}</Td>
                            {k === 0 && <Td rowSpan={rows.length} className="text-right align-top">{canEdit && <Btn size="sm" variant="ghost" title="Edit plan" onClick={() => setEditing(e)}><FiEdit3 /></Btn>}</Td>}
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </Table>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <DutyPlanModal
        employee={editing}
        branches={branches}
        allowed={canEdit}
        onClose={() => setEditing(null)}
        onSaved={(saved) => {
          setEditing(null);
          setData((d) => (d ? { ...d, data: d.data.map((x) => (x._id === saved._id ? saved : x)) } : d));
        }}
      />
    </div>
  );
}


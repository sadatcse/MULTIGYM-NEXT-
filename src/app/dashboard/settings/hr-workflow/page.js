"use client";

import { useEffect, useState } from "react";
import { FiCopy, FiKey, FiSave, FiX } from "react-icons/fi";
import { MdTune } from "react-icons/md";
import { toast } from "react-toastify";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Btn, Card, Field, inputCls, Loading, PageHeader, Select } from "@/components/hr/HrUi";

// Chip editor for a list of role names, with suggestions from the Roles table.
function RoleList({ value = [], onChange, suggestions = [] }) {
  const [draft, setDraft] = useState("");
  const add = (r) => {
    const v = r.trim();
    if (v && !value.some((x) => x.toUpperCase() === v.toUpperCase())) onChange([...value, v]);
    setDraft("");
  };
  const remaining = suggestions.filter((s) => !value.some((x) => x.toUpperCase() === s.toUpperCase()));
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((r) => (
          <span key={r} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-brand-gold/15 border border-brand-gold/30 text-[11px] font-black">
            {r}
            <button type="button" onClick={() => onChange(value.filter((x) => x !== r))} className="hover:text-brand-red cursor-pointer"><FiX /></button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(draft))} placeholder="Type a role and press Enter" className={inputCls} />
        {remaining.length > 0 && <Select value="" onChange={(v) => v && add(v)} placeholder="+ from roles" options={remaining} className="w-40" />}
      </div>
    </div>
  );
}

export default function HrWorkflowPage() {
  const { canEdit } = usePagePermission();
  const { config, me, loading, refetch } = useHrConfig();
  const roles = useHrQuery("/role", { limit: 200 });
  const roleNames = (roles.data?.data || roles.data?.roles || []).map((r) => r.name);
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(null);
  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (config && !f) setF(JSON.parse(JSON.stringify(config)));
  }, [config, f]);

  if (loading || !f) return <Loading rows={8} />;
  const editable = canEdit && me?.scope === "all";
  const setA = (k, v) => setF({ ...f, attendance: { ...f.attendance, [k]: v } });
  const setP = (k, v) => setF({ ...f, payroll: { ...f.payroll, [k]: v } });
  const num = (v) => (v === "" ? "" : Number(v));

  const save = async () => {
    const res = await run("put", "/hr-config", {
      branchScopedRoles: f.branchScopedRoles,
      selfOnlyRoles: f.selfOnlyRoles,
      leaveStages: f.leaveStages,
      leaveSkipBranchStage: f.leaveSkipBranchStage,
      requisitionStages: f.requisitionStages,
      attendance: f.attendance,
      payroll: f.payroll,
    });
    if (res) refetch();
  };

  return (
    <div className="space-y-5 max-w-6xl mx-auto pb-10">
      <PageHeader
        icon={<MdTune />}
        title="HR Workflow Settings"
        subtitle="Who approves at each stage, who sees only their own branch or own records, and the attendance & payroll rules."
        actions={editable && <Btn variant="gold" loading={busy} onClick={save}><FiSave /> Save settings</Btn>}
      />

      <Card title="Data access scope" subtitle="Roles not listed in either box (e.g. MD, Director, HR, Admin) see all branches. Super Admin always sees everything. Page access itself is set in Role Access Control.">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Own branch only (Branch / Floor In-Charge, Front Desk)"><RoleList value={f.branchScopedRoles} onChange={(v) => setF({ ...f, branchScopedRoles: v })} suggestions={roleNames} /></Field>
          <Field label="Own records only (Employee / Staff)"><RoleList value={f.selfOnlyRoles} onChange={(v) => setF({ ...f, selfOnlyRoles: v })} suggestions={roleNames} /></Field>
        </div>
      </Card>

      <Card title="Leave approval workflow" subtitle="Employee → Floor In-Charge / Branch → Manager (Admin & HR) → Director. One person can act at only one stage of an application.">
        <div className="grid md:grid-cols-3 gap-5">
          <Field label="1 · Branch verification"><RoleList value={f.leaveStages.branch} onChange={(v) => setF({ ...f, leaveStages: { ...f.leaveStages, branch: v } })} suggestions={roleNames} /></Field>
          <Field label="2 · Manager (Admin & HR) verification"><RoleList value={f.leaveStages.hr} onChange={(v) => setF({ ...f, leaveStages: { ...f.leaveStages, hr: v } })} suggestions={roleNames} /></Field>
          <Field label="3 · Director approval (final)"><RoleList value={f.leaveStages.director} onChange={(v) => setF({ ...f, leaveStages: { ...f.leaveStages, director: v } })} suggestions={roleNames} /></Field>
        </div>
        <label className="flex items-center gap-2 text-xs font-bold mt-4 cursor-pointer"><input type="checkbox" checked={f.leaveSkipBranchStage} onChange={(e) => setF({ ...f, leaveSkipBranchStage: e.target.checked })} /> Skip branch verification (new applications go straight to HR)</label>
      </Card>

      <Card title="Requisition workflow" subtitle="Requisition → Admin verification → Management approval → Purchase → Received">
        <div className="grid md:grid-cols-3 gap-5">
          <Field label="Admin verification"><RoleList value={f.requisitionStages.admin} onChange={(v) => setF({ ...f, requisitionStages: { ...f.requisitionStages, admin: v } })} suggestions={roleNames} /></Field>
          <Field label="Management approval"><RoleList value={f.requisitionStages.management} onChange={(v) => setF({ ...f, requisitionStages: { ...f.requisitionStages, management: v } })} suggestions={roleNames} /></Field>
          <Field label="Purchase"><RoleList value={f.requisitionStages.purchase} onChange={(v) => setF({ ...f, requisitionStages: { ...f.requisitionStages, purchase: v } })} suggestions={roleNames} /></Field>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Attendance rules" subtitle="Used when a punch has no roster/profile shift; grace and thresholds apply always.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Default in time"><input type="time" value={f.attendance.defaultInTime} onChange={(e) => setA("defaultInTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Default out time"><input type="time" value={f.attendance.defaultOutTime} onChange={(e) => setA("defaultOutTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Late grace (min)"><input type="number" value={f.attendance.graceMinutes} onChange={(e) => setA("graceMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Early leave tolerance (min)"><input type="number" value={f.attendance.earlyLeaveToleranceMinutes} onChange={(e) => setA("earlyLeaveToleranceMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Half day if worked under (min)"><input type="number" value={f.attendance.halfDayMinutes} onChange={(e) => setA("halfDayMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Overtime counts after (min)"><input type="number" value={f.attendance.overtimeAfterMinutes} onChange={(e) => setA("overtimeAfterMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Min gap between in & out (min)"><input type="number" value={f.attendance.minPunchGapMinutes} onChange={(e) => setA("minPunchGapMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="UTC offset (min)" hint="Dhaka = 360"><input type="number" value={f.attendance.timezoneOffsetMinutes} onChange={(e) => setA("timezoneOffsetMinutes", num(e.target.value))} className={inputCls} /></Field>
          </div>
        </Card>
        <Card title="Payroll rules" subtitle="Late/overtime rates come from the active Late Policy and Overtime Policy.">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Per-day salary based on"><Select value={f.payroll.perDayBasis} onChange={(v) => setP("perDayBasis", v)} options={[{ value: "gross", label: "Gross salary" }, { value: "basic", label: "Basic salary" }]} /></Field>
            <Field label="Days in month"><Select value={f.payroll.daysBasis} onChange={(v) => setP("daysBasis", v)} options={[{ value: "calendar", label: "Calendar days" }, { value: "fixed30", label: "Fixed 30" }]} /></Field>
            <Field label="Standard hours / day" hint="For overtime hourly rate"><input type="number" value={f.payroll.standardHoursPerDay} onChange={(e) => setP("standardHoursPerDay", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Currency symbol"><input value={f.payroll.currency} onChange={(e) => setP("currency", e.target.value)} className={inputCls} /></Field>
          </div>
        </Card>
      </div>

      {me?.scope === "all" && (
        <Card title="Device sync key" subtitle="Used only by a local sync agent posting to /api/attendance/device-push. Devices using ADMS push don't need it.">
          <div className="flex flex-wrap items-center gap-3">
            <code className="text-xs font-bold break-all px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight">{config?.deviceApiKey}</code>
            <Btn size="sm" variant="ghost" onClick={() => navigator.clipboard?.writeText(config?.deviceApiKey || "").then(() => toast.success("Copied"))}><FiCopy /> Copy</Btn>
            {editable && <Btn size="sm" variant="ghost" loading={busy} onClick={async () => { if (confirm("Rotate the key? Running sync agents must be updated.") && (await run("post", "/hr-config/rotate-device-key"))) refetch(); }}><FiKey /> Rotate</Btn>}
          </div>
        </Card>
      )}
    </div>
  );
}

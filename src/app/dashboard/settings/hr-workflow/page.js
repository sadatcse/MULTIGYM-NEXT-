"use client";

import { useEffect, useMemo, useState } from "react";
import { FiCopy, FiKey, FiSave, FiX } from "react-icons/fi";
import { toast } from "react-toastify";
import usePagePermission from "@/hooks/usePagePermission";
import { useHrConfig, useHrLookups, useHrMutation, useHrQuery } from "@/hooks/useHr";
import { Badge, Btn, Card, Field, inputCls, Loading, PageHeader, Select, pageCls } from "@/components/hr/HrUi";
import RoleTreeEditor from "@/components/hr/RoleTreeEditor";
import ManagementPersonsCard from "@/components/hr/ManagementPersonsCard";
import { roleKey, suggestTree } from "@/components/hr/roleTree";

const LEAVE_WORDS = { top: "Final decision", middle: "Recommends", bottom: "Applies", requests: "leave requests" };
const REQ_WORDS = { top: "Final approval", middle: "Verifies", bottom: "Requests", requests: "requisitions" };

// Chip editor for a list of role names, with suggestions from the Roles table.
function RoleList({ value = [], onChange, suggestions = [], disabled }) {
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
            {!disabled && (
              <button type="button" onClick={() => onChange(value.filter((x) => x !== r))} className="hover:text-brand-red cursor-pointer" aria-label={`Remove ${r}`}>
                <FiX />
              </button>
            )}
          </span>
        ))}
      </div>
      {!disabled && (
        <div className="flex gap-2">
          <input value={draft} onChange={(e) => setDraft(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add(draft))} placeholder="Type a role and press Enter" className={inputCls} />
          {remaining.length > 0 && <Select value="" onChange={(v) => v && add(v)} placeholder="+ from roles" options={remaining} className="w-40" />}
        </div>
      )}
    </div>
  );
}

function TreeStatus({ saved, current }) {
  const changed = JSON.stringify(saved || []) !== JSON.stringify(current || []);
  if (changed) return <Badge tone="amber">Not saved yet</Badge>;
  return saved?.length ? <Badge tone="green">Active</Badge> : <Badge tone="slate">Using fixed stages</Badge>;
}

export default function HrWorkflowPage() {
  const { canEdit } = usePagePermission();
  const { config, me, loading, refetch } = useHrConfig();
  const rolesQuery = useHrQuery("/role", { limit: 200 });
  const roleNames = useMemo(() => (rolesQuery.data?.data || rolesQuery.data?.roles || []).filter((r) => r.status !== "inactive").map((r) => r.name), [rolesQuery.data]);
  const { staff } = useHrLookups();
  const staffByRole = useMemo(() => {
    const out = {};
    for (const e of staff) if (e.role) out[roleKey(e.role)] = (out[roleKey(e.role)] || 0) + 1;
    return out;
  }, [staff]);
  const { run, busy } = useHrMutation();
  const [f, setF] = useState(null);
  const [savedJson, setSavedJson] = useState("");

  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    if (config && !f) {
      const copy = JSON.parse(JSON.stringify(config));
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setF(copy);
      setSavedJson(JSON.stringify(copy));
    }
  }, [config, f]);

  const dirty = !!f && JSON.stringify(f) !== savedJson;
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  if (loading || !f) return <Loading rows={8} />;
  const editable = canEdit && me?.scope === "all";
  const saved = JSON.parse(savedJson || "{}");
  const setA = (k, v) => setF({ ...f, attendance: { ...f.attendance, [k]: v } });
  const setP = (k, v) => setF({ ...f, payroll: { ...f.payroll, [k]: v } });
  const num = (v) => (v === "" ? "" : Number(v));

  const save = async () => {
    const res = await run("put", "/hr-config", {
      decisionTree: f.decisionTree,
      managementTree: f.managementTree,
      branchScopedRoles: f.branchScopedRoles,
      selfOnlyRoles: f.selfOnlyRoles,
      requisitionStages: f.requisitionStages,
      attendance: f.attendance,
      payroll: f.payroll,
    });
    if (res?.data) {
      // An older backend build ignores the trees; keep them unsaved and say so.
      if (!Array.isArray(res.data.decisionTree) || !Array.isArray(res.data.managementTree)) {
        toast.error("The server did not store the approval trees. Restart the backend so it runs the latest code, then save again.");
        return;
      }
      // Take the server's cleaned copy (it removes duplicates and loops).
      const copy = JSON.parse(JSON.stringify({ ...f, ...res.data }));
      setF(copy);
      setSavedJson(JSON.stringify(copy));
      refetch();
    }
  };

  return (
    <div className={pageCls}>
      <PageHeader
        title="HR Workflow Settings"
        subtitle="Draw who approves whom, choose who sees only their own branch or own records, and set the attendance & payroll rules."
        actions={
          editable && (
            <>
              {dirty && <Badge tone="amber">Unsaved changes</Badge>}
              <Btn onClick={save} loading={busy} disabled={!dirty}>
                <FiSave /> Save settings
              </Btn>
            </>
          )
        }
      />

      <Card
        title="Leave approvals — decision makers"
        subtitle="A leave request goes up the tree from the applicant's role: every level above recommends, and the top gives the final decision."
        actions={<TreeStatus saved={saved.decisionTree} current={f.decisionTree} />}
      >
        <RoleTreeEditor
          tree={f.decisionTree || []}
          onChange={(t) => setF({ ...f, decisionTree: t })}
          roles={roleNames}
          staffByRole={staffByRole}
          editable={editable}
          words={LEAVE_WORDS}
          onSuggest={() => setF({ ...f, decisionTree: suggestTree(roleNames, [f.leaveStages?.director, f.leaveStages?.hr, f.leaveStages?.branch]) })}
        />
      </Card>

      <Card
        title="Requisition approvals — management"
        subtitle="A requisition goes up the tree from the requester's role: every level above verifies, the top gives the final approval, then the purchase team buys it."
        actions={<TreeStatus saved={saved.managementTree} current={f.managementTree} />}
      >
        <RoleTreeEditor
          tree={f.managementTree || []}
          onChange={(t) => setF({ ...f, managementTree: t })}
          roles={roleNames}
          staffByRole={staffByRole}
          editable={editable}
          words={REQ_WORDS}
          onSuggest={() => setF({ ...f, managementTree: suggestTree(roleNames, [f.requisitionStages?.management, f.requisitionStages?.admin, f.branchScopedRoles]) })}
        />
        <div className="mt-6 border-t border-brand-beige/40 pt-5 dark:border-brand-dark-grey/40">
          <Field label="Purchase team" hint="After final approval these roles add quotations, place the order and record the purchase.">
            <RoleList value={f.requisitionStages?.purchase || []} onChange={(v) => setF({ ...f, requisitionStages: { ...f.requisitionStages, purchase: v } })} suggestions={roleNames} disabled={!editable} />
          </Field>
        </div>
      </Card>

      <ManagementPersonsCard staff={staff} editable={editable} />

      <Card title="Data access scope" subtitle="Roles not listed in either box (e.g. MD, Director, HR, Admin) see all branches. Super Admin always sees everything. Page access itself is set in Role Access Control.">
        <div className="grid md:grid-cols-2 gap-5">
          <Field label="Own branch only (Branch / Floor In-Charge, Front Desk)">
            <RoleList value={f.branchScopedRoles} onChange={(v) => setF({ ...f, branchScopedRoles: v })} suggestions={roleNames} disabled={!editable} />
          </Field>
          <Field label="Own records only (Employee / Staff)">
            <RoleList value={f.selfOnlyRoles} onChange={(v) => setF({ ...f, selfOnlyRoles: v })} suggestions={roleNames} disabled={!editable} />
          </Field>
        </div>
      </Card>

      <div className="grid md:grid-cols-2 gap-5">
        <Card title="Attendance rules" subtitle="Used when a punch has no roster/profile shift; grace and thresholds apply always.">
          <fieldset disabled={!editable} className="grid grid-cols-2 gap-3">
            <Field label="Default in time"><input type="time" value={f.attendance.defaultInTime} onChange={(e) => setA("defaultInTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Default out time"><input type="time" value={f.attendance.defaultOutTime} onChange={(e) => setA("defaultOutTime", e.target.value)} className={inputCls} /></Field>
            <Field label="Late grace (min)"><input type="number" value={f.attendance.graceMinutes} onChange={(e) => setA("graceMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Early leave tolerance (min)"><input type="number" value={f.attendance.earlyLeaveToleranceMinutes} onChange={(e) => setA("earlyLeaveToleranceMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Half day if worked under (min)"><input type="number" value={f.attendance.halfDayMinutes} onChange={(e) => setA("halfDayMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Overtime counts after (min)"><input type="number" value={f.attendance.overtimeAfterMinutes} onChange={(e) => setA("overtimeAfterMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Min gap between in & out (min)"><input type="number" value={f.attendance.minPunchGapMinutes} onChange={(e) => setA("minPunchGapMinutes", num(e.target.value))} className={inputCls} /></Field>
            <Field label="UTC offset (min)" hint="Dhaka = 360"><input type="number" value={f.attendance.timezoneOffsetMinutes} onChange={(e) => setA("timezoneOffsetMinutes", num(e.target.value))} className={inputCls} /></Field>
          </fieldset>
        </Card>
        <Card title="Payroll rules" subtitle="Late/overtime rates come from the active Late Policy and Overtime Policy.">
          <fieldset disabled={!editable} className="grid grid-cols-2 gap-3">
            <Field label="Per-day salary based on"><Select value={f.payroll.perDayBasis} onChange={(v) => setP("perDayBasis", v)} options={[{ value: "gross", label: "Gross salary" }, { value: "basic", label: "Basic salary" }]} /></Field>
            <Field label="Days in month"><Select value={f.payroll.daysBasis} onChange={(v) => setP("daysBasis", v)} options={[{ value: "calendar", label: "Calendar days" }, { value: "fixed30", label: "Fixed 30" }]} /></Field>
            <Field label="Standard hours / day" hint="For overtime hourly rate"><input type="number" value={f.payroll.standardHoursPerDay} onChange={(e) => setP("standardHoursPerDay", num(e.target.value))} className={inputCls} /></Field>
            <Field label="Currency symbol"><input value={f.payroll.currency} onChange={(e) => setP("currency", e.target.value)} className={inputCls} /></Field>
          </fieldset>
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

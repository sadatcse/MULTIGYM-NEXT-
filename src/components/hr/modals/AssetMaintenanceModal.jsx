"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { AssetPicker, FieldError, useSubmitLock, useGymSuggestions, Suggestions } from "@/components/hr/GymAssetUi";
import { AFTER_MAINTENANCE_CONDITIONS, CONDITION, isoDay, MAINTENANCE_STATUSES, MAINTENANCE_TYPES, newRequestId, todayISO, whereText } from "@/components/hr/gymAssets";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Statuses a record can move to (mirrors the backend rules).
const NEXT = { pending: ["pending", "in_progress", "completed", "cancelled"], in_progress: ["in_progress", "completed", "cancelled"], completed: ["completed"], cancelled: ["cancelled"] };

// Log or update maintenance. `state`: null = closed, {} or { asset } = new
// record, { record } = update an existing record.
export default function AssetMaintenanceModal({ state, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const record = state?.record;
  return (
    <ModalShell isOpen={!!state} onClose={onClose} size="lg" title={record ? `Maintenance ${record.maintenanceId}` : "Log maintenance"}>
      {state && <Body key={record?._id || state.asset?._id || "new"} record={record} preset={state.asset} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ record, preset, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const suggest = useGymSuggestions();
  const editing = !!record;
  const closed = editing && ["completed", "cancelled"].includes(record.status);
  const [asset, setAsset] = useState(preset || null);
  const [requestId] = useState(newRequestId);
  const [form, setForm] = useState({
    problem: record?.problem || "",
    maintenanceType: record?.maintenanceType || "repair",
    serviceProvider: record?.serviceProvider || "",
    technician: record?.technician || "",
    maintenanceDate: isoDay(record?.maintenanceDate) || todayISO(),
    status: record?.status || "pending",
    completionDate: isoDay(record?.completionDate) || "",
    conditionAfter: record?.conditionAfter || "",
    cost: record?.cost ?? "",
    nextMaintenanceDate: isoDay(record?.nextMaintenanceDate) || "",
    attachments: record?.attachments || [],
    remarks: record?.remarks || "",
  });
  const [errors, setErrors] = useState({});
  const allowed = editing ? permissions.canEdit : permissions.canAdd;
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v, ...(k === "status" && v === "completed" && !f.completionDate ? { completionDate: todayISO() } : {}) }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const statusOptions = MAINTENANCE_STATUSES.filter((s) => (editing ? NEXT[record.status].includes(s.value) : ["pending", "in_progress"].includes(s.value)));
  const completing = form.status === "completed" && record?.status !== "completed";

  const save = async () => {
    const e = {};
    if (!editing && !asset) e.asset = "Pick the asset";
    if (!form.problem.trim()) e.problem = "Describe the problem";
    if (!form.maintenanceDate) e.maintenanceDate = "Maintenance date is required";
    if (form.cost !== "" && (isNaN(Number(form.cost)) || Number(form.cost) < 0)) e.cost = "Enter a cost of 0 or more";
    if (form.nextMaintenanceDate && form.nextMaintenanceDate < form.maintenanceDate) e.nextMaintenanceDate = "Must be after the maintenance date";
    if (completing) {
      if (!form.completionDate) e.completionDate = "Enter the completion date";
      else if (form.completionDate < form.maintenanceDate) e.completionDate = "Can't be before the maintenance date";
      else if (form.completionDate > todayISO()) e.completionDate = "Can't be in the future";
    }
    setErrors(e);
    if (Object.keys(e).length) return;

    const common = { cost: form.cost === "" ? 0 : Number(form.cost), nextMaintenanceDate: form.nextMaintenanceDate, attachments: form.attachments, remarks: form.remarks.trim() };
    const details = { problem: form.problem.trim(), maintenanceType: form.maintenanceType, serviceProvider: form.serviceProvider.trim(), technician: form.technician.trim(), maintenanceDate: form.maintenanceDate };
    let res;
    if (!editing) {
      res = await run("post", "/gym-asset/maintenance", { asset: asset._id, ...details, ...common, status: form.status, requestId });
    } else {
      const body = closed ? common : { ...details, ...common, status: form.status };
      if (completing) Object.assign(body, { completionDate: form.completionDate, ...(form.conditionAfter ? { conditionAfter: form.conditionAfter } : {}) });
      res = await run("patch", `/gym-asset/maintenance/${record._id}`, body);
    }
    if (res) onSaved(res.data);
  };

  return (
    <>
      <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <Field label="Asset" required={!editing}>
          {editing || preset ? (
            <div className={inputCls}>
              {(record || preset).assetCode} · {record?.assetName || preset?.name}
              <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">{record ? whereText(record.location, record.place) : whereText(preset.location, preset.place)}</span>
            </div>
          ) : (
            <AssetPicker value={asset} onChange={(a) => { setAsset(a); setErrors((x) => ({ ...x, asset: undefined })); }} error={errors.asset} />
          )}
        </Field>

        {closed && <p className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light">This record is {record.status}. You can still add the invoice, cost, next maintenance date and remarks.</p>}

        <fieldset disabled={closed} className="space-y-4 min-w-0">
          <Field label="Problem" required>
            <textarea value={form.problem} onChange={(e) => set("problem")(e.target.value)} rows={2} maxLength={1000} placeholder="What is wrong, or what work is due?" className={inputCls} aria-invalid={!!errors.problem} />
            {errors.problem && <FieldError>{errors.problem}</FieldError>}
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Maintenance type" required>
              <Select value={form.maintenanceType} onChange={set("maintenanceType")} options={MAINTENANCE_TYPES} />
            </Field>
            <Field label="Status" required hint={!editing && form.status === "in_progress" ? "The asset will show as Under maintenance." : undefined}>
              <Select value={form.status} onChange={set("status")} options={statusOptions} />
            </Field>
            <Field label="Service provider">
              <input value={form.serviceProvider} onChange={(e) => set("serviceProvider")(e.target.value)} list="gym-asset-providers" maxLength={120} placeholder="Company or shop" className={inputCls} />
              <Suggestions id="gym-asset-providers" items={suggest.serviceProviders} />
            </Field>
            <Field label="Technician">
              <input value={form.technician} onChange={(e) => set("technician")(e.target.value)} maxLength={80} className={inputCls} />
            </Field>
            <Field label="Maintenance date" required>
              <input type="date" value={form.maintenanceDate} onChange={(e) => set("maintenanceDate")(e.target.value)} className={inputCls} aria-invalid={!!errors.maintenanceDate} />
              {errors.maintenanceDate && <FieldError>{errors.maintenanceDate}</FieldError>}
            </Field>
            {(completing || record?.completionDate) && (
              <Field label="Completion date" required={completing}>
                <input type="date" max={todayISO()} value={form.completionDate} onChange={(e) => set("completionDate")(e.target.value)} className={inputCls} aria-invalid={!!errors.completionDate} />
                {errors.completionDate && <FieldError>{errors.completionDate}</FieldError>}
              </Field>
            )}
            {completing && (
              <Field label="Condition after maintenance" hint={`Leave as is to use ${CONDITION[["damaged", "non_functional", "under_maintenance"].includes(record?.conditionBefore) ? "good" : record?.conditionBefore]?.label || "Good"}.`}>
                <Select value={form.conditionAfter} onChange={set("conditionAfter")} options={AFTER_MAINTENANCE_CONDITIONS} placeholder="Automatic" />
              </Field>
            )}
          </div>
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Cost">
            <input type="number" min={0} step="0.01" inputMode="decimal" value={form.cost} onChange={(e) => set("cost")(e.target.value)} placeholder="0" className={inputCls} aria-invalid={!!errors.cost} />
            {errors.cost && <FieldError>{errors.cost}</FieldError>}
          </Field>
          <Field label="Next maintenance date">
            <input type="date" min={form.maintenanceDate} value={form.nextMaintenanceDate} onChange={(e) => set("nextMaintenanceDate")(e.target.value)} className={inputCls} aria-invalid={!!errors.nextMaintenanceDate} />
            {errors.nextMaintenanceDate && <FieldError>{errors.nextMaintenanceDate}</FieldError>}
          </Field>
        </div>
        <div className="space-y-1.5">
          <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Invoice / attachments</span>
          <Attachments value={form.attachments} onChange={set("attachments")} folder="gym-assets" max={10} readOnly={!allowed} />
        </div>
        <Field label="Remarks">
          <textarea value={form.remarks} onChange={(e) => set("remarks")(e.target.value)} rows={2} maxLength={1000} className={inputCls} />
        </Field>
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel={editing ? "Save" : "Log maintenance"} busy={busy} allowed={allowed} />
      </div>
    </>
  );
}

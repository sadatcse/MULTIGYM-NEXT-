"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { AssetPicker, FieldError, useSubmitLock, useGymSuggestions, Suggestions } from "@/components/hr/GymAssetUi";
import { DISPOSAL_TYPES, newRequestId, todayISO, whereText } from "@/components/hr/gymAssets";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Dispose of an asset (sold, scrapped, lost…). Final: the asset is archived.
// `state`: null = closed, {} = pick the asset here, { asset } = that asset.
export default function AssetDisposalModal({ state, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!state} onClose={onClose} size="lg" title="Dispose of asset">
      {state && <Body key={state.asset?._id || "pick"} preset={state.asset} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ preset, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const suggest = useGymSuggestions();
  const [asset, setAsset] = useState(preset || null);
  const [requestId] = useState(newRequestId);
  const [form, setForm] = useState({ disposalDate: todayISO(), disposalType: "", reason: "", disposalValue: "", approvedByName: "", attachments: [], remarks: "", confirm: false });
  const [errors, setErrors] = useState({});
  const allowed = permissions.canAdd;
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const save = async () => {
    const e = {};
    if (!asset) e.asset = "Pick the asset to dispose of";
    if (!form.disposalDate) e.disposalDate = "Disposal date is required";
    else if (form.disposalDate > todayISO()) e.disposalDate = "Can't be in the future";
    if (!form.disposalType) e.disposalType = "Pick how it was disposed of";
    if (!form.reason.trim()) e.reason = "Give a reason";
    if (form.disposalValue !== "" && (isNaN(Number(form.disposalValue)) || Number(form.disposalValue) < 0)) e.disposalValue = "Enter 0 or more";
    if (!form.approvedByName.trim()) e.approvedByName = "Who approved this disposal?";
    if (!form.confirm) e.confirm = "Tick to confirm";
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await run("post", "/gym-asset/disposals", {
      asset: asset._id,
      disposalDate: form.disposalDate,
      disposalType: form.disposalType,
      reason: form.reason.trim(),
      disposalValue: form.disposalValue === "" ? 0 : Number(form.disposalValue),
      approvedByName: form.approvedByName.trim(),
      attachments: form.attachments,
      remarks: form.remarks.trim(),
      requestId,
    });
    if (res) onSaved(res.data);
  };

  return (
    <>
      <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <Field label="Asset" required>
          {preset ? (
            <div className={inputCls}>
              {preset.assetCode} · {preset.name}
              <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">
                {preset.quantity} {preset.unit} at {whereText(preset.location, preset.place)}
              </span>
            </div>
          ) : (
            <AssetPicker value={asset} onChange={(a) => { setAsset(a); setErrors((x) => ({ ...x, asset: undefined })); }} error={errors.asset} />
          )}
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Disposal date" required>
            <input type="date" max={todayISO()} value={form.disposalDate} onChange={(e) => set("disposalDate")(e.target.value)} className={inputCls} aria-invalid={!!errors.disposalDate} />
            {errors.disposalDate && <FieldError>{errors.disposalDate}</FieldError>}
          </Field>
          <Field label="Disposal type" required>
            <Select value={form.disposalType} onChange={set("disposalType")} options={DISPOSAL_TYPES} placeholder="Select type" />
            {errors.disposalType && <FieldError>{errors.disposalType}</FieldError>}
          </Field>
          <Field label="Reason" required className="sm:col-span-2">
            <input value={form.reason} onChange={(e) => set("reason")(e.target.value)} maxLength={300} placeholder="e.g. Motor burnt out, repair costs more than a new one" className={inputCls} aria-invalid={!!errors.reason} />
            {errors.reason && <FieldError>{errors.reason}</FieldError>}
          </Field>
          <Field label="Disposal value" hint="Money received if sold; 0 if scrapped or lost.">
            <input type="number" min={0} step="0.01" inputMode="decimal" value={form.disposalValue} onChange={(e) => set("disposalValue")(e.target.value)} placeholder="0" className={inputCls} aria-invalid={!!errors.disposalValue} />
            {errors.disposalValue && <FieldError>{errors.disposalValue}</FieldError>}
          </Field>
          <Field label="Approved by" required>
            <input value={form.approvedByName} onChange={(e) => set("approvedByName")(e.target.value)} list="gym-asset-approvers" maxLength={80} placeholder="Name of the approver" className={inputCls} aria-invalid={!!errors.approvedByName} />
            <Suggestions id="gym-asset-approvers" items={suggest.approvers} />
            {errors.approvedByName && <FieldError>{errors.approvedByName}</FieldError>}
          </Field>
        </div>
        <div className="space-y-1.5">
          <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Documents</span>
          <Attachments value={form.attachments} onChange={set("attachments")} folder="gym-assets" max={10} />
        </div>
        <Field label="Remarks">
          <textarea value={form.remarks} onChange={(e) => set("remarks")(e.target.value)} rows={2} maxLength={1000} className={inputCls} />
        </Field>
        <label className="flex items-start gap-2 p-3 rounded-2xl border border-red-500/30 bg-red-500/5 text-xs font-bold text-brand-black dark:text-brand-white cursor-pointer">
          <input type="checkbox" checked={form.confirm} onChange={(e) => set("confirm")(e.target.checked)} className="mt-0.5 accent-brand-red" />
          <span>
            I understand this archives the asset. It leaves the active register and can&apos;t be edited, moved or maintained again. Its purchase, transfer and maintenance history is kept.
            {errors.confirm && <FieldError>{errors.confirm}</FieldError>}
          </span>
        </label>
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel="Dispose of asset" danger busy={busy} allowed={allowed} />
      </div>
    </>
  );
}

// Documents and remarks are the only parts of a disposal that can change later.
export function DisposalNotesModal({ record, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!record} onClose={onClose} size="md" title={record ? `${record.disposalId} documents` : ""}>
      {record && <NotesBody key={record._id} record={record} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function NotesBody({ record, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const [attachments, setAttachments] = useState(record.attachments || []);
  const [remarks, setRemarks] = useState(record.remarks || "");
  const save = async () => {
    const res = await run("patch", `/gym-asset/disposals/${record._id}`, { attachments, remarks: remarks.trim() });
    if (res) onSaved(res.data);
  };
  return (
    <>
      <fieldset disabled={!permissions.canEdit || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <p className="text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light">
          {record.assetCode} · {record.assetName}. The disposal itself is final; add the sale receipt or approval document here.
        </p>
        <div className="space-y-1.5">
          <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Documents</span>
          <Attachments value={attachments} onChange={setAttachments} folder="gym-assets" max={10} readOnly={!permissions.canEdit} />
        </div>
        <Field label="Remarks">
          <textarea value={remarks} onChange={(e) => setRemarks(e.target.value)} rows={3} maxLength={1000} className={inputCls} />
        </Field>
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel="Save" busy={busy} allowed={permissions.canEdit} />
      </div>
    </>
  );
}

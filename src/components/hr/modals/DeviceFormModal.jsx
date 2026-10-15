"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Add / edit / approve a biometric device. New devices need `canAdd`,
// existing ones `canEdit`.
export default function DeviceFormModal({ device, branches = [], onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={!!device} onClose={onClose} title={device?._id ? "Edit device" : "Add device"}>
      {device && <Body key={device._id || "new"} device={device} branches={branches} onClose={onClose} onSaved={onSaved} allowed={device._id ? permissions.canEdit : permissions.canAdd} />}
    </ModalShell>
  );
}

function Body({ device, branches, onClose, onSaved, allowed }) {
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ serialNumber: "", name: "", branch: "", model: "ZKTeco", status: "active", ...device });
  const save = async () => {
    const body = { serialNumber: f.serialNumber, name: f.name, branch: f.branch, model: f.model, status: f.status };
    const res = f._id ? await run("patch", `/attendance/devices/${f._id}`, body) : await run("post", "/attendance/devices", body);
    if (res) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Serial number" required className="sm:col-span-2">
          <input value={f.serialNumber} disabled={!!f._id} onChange={(e) => setF({ ...f, serialNumber: e.target.value })} className={inputCls} />
        </Field>
        <Field label="Name" className="sm:col-span-2">
          <input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} className={inputCls} placeholder="e.g. Lalmatia Front Door" />
        </Field>
        <Field label="Branch" required><Select value={f.branch} onChange={(v) => setF({ ...f, branch: v })} placeholder="Select branch" options={branches} /></Field>
        <Field label="Status"><Select value={f.status} onChange={(v) => setF({ ...f, status: v })} options={["pending", "active", "disabled"]} /></Field>
        <Field label="Model"><input value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} className={inputCls} /></Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!f.serialNumber || !f.branch} />
      </div>
    </>
  );
}

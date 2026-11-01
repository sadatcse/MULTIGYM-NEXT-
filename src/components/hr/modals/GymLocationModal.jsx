"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { FieldError, useSubmitLock } from "@/components/hr/GymAssetUi";
import { LOCATION_TYPES } from "@/components/hr/gymAssets";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const PHONE = /^\+?[0-9][0-9\s-]{5,19}$/;

// Add or edit a gym asset location (branch, warehouse, head office).
// `location`: null = closed, {} = add, a row = edit.
export default function GymLocationModal({ location, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const editing = !!location?._id;
  return (
    <ModalShell isOpen={!!location} onClose={onClose} size="md" title={editing ? "Edit location" : "Add location"}>
      {location && <Body key={location._id || "new"} location={location} editing={editing} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ location, editing, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const [form, setForm] = useState({
    name: location.name || "",
    type: location.type || "branch",
    address: location.address || "",
    contactPerson: location.contactPerson || "",
    contactNumber: location.contactNumber || "",
    status: location.status || "active",
  });
  const [errors, setErrors] = useState({});
  const set = (key) => (value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };
  const allowed = editing ? permissions.canEdit : permissions.canAdd;

  const save = async () => {
    const e = {};
    if (!form.name.trim()) e.name = "Location name is required";
    if (form.contactNumber.trim() && !PHONE.test(form.contactNumber.trim())) e.contactNumber = "Use 6–20 digits; spaces, dashes and a leading + are fine";
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { ...form, name: form.name.trim(), address: form.address.trim(), contactPerson: form.contactPerson.trim(), contactNumber: form.contactNumber.trim() };
    const res = editing ? await run("patch", `/gym-asset/locations/${location._id}`, body) : await run("post", "/gym-asset/locations", body);
    if (res) onSaved(res.data);
  };

  return (
    <>
      <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <Field label="Name" required>
          <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Shia Masjid Branch, Main Warehouse" maxLength={80} className={inputCls} aria-invalid={!!errors.name} />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>
        <Field label="Type">
          <Select value={form.type} onChange={set("type")} options={LOCATION_TYPES} />
        </Field>
        <Field label="Address">
          <textarea value={form.address} onChange={(e) => set("address")(e.target.value)} rows={2} placeholder="House, road, area" maxLength={300} className={inputCls} />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Contact person">
            <input value={form.contactPerson} onChange={(e) => set("contactPerson")(e.target.value)} maxLength={80} className={inputCls} />
          </Field>
          <Field label="Contact number">
            <input value={form.contactNumber} onChange={(e) => set("contactNumber")(e.target.value)} type="tel" inputMode="tel" maxLength={20} placeholder="01XXXXXXXXX" className={inputCls} aria-invalid={!!errors.contactNumber} />
            {errors.contactNumber && <FieldError>{errors.contactNumber}</FieldError>}
          </Field>
        </div>
        {editing && (
          <Field label="Status" hint="Inactive locations keep their assets but can't be picked for new assets or transfers.">
            <Select
              value={form.status}
              onChange={set("status")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </Field>
        )}
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel={editing ? "Save changes" : "Add location"} busy={busy} disabled={!form.name.trim()} allowed={allowed} />
      </div>
    </>
  );
}

"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { FieldError, useSubmitLock } from "@/components/hr/GymAssetUi";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Add or edit an asset category. `category`: null = closed, {} = add, a row = edit.
export default function AssetCategoryModal({ category, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const editing = !!category?._id;
  return (
    <ModalShell isOpen={!!category} onClose={onClose} size="md" title={editing ? "Edit category" : "Add category"}>
      {category && <Body key={category._id || "new"} category={category} editing={editing} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ category, editing, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const [form, setForm] = useState({ name: category.name || "", description: category.description || "", depreciationRate: category.depreciationRate ?? 0, status: category.status || "active" });
  const [errors, setErrors] = useState({});
  const allowed = editing ? permissions.canEdit : permissions.canAdd;
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const save = async () => {
    const e = {};
    const rate = Number(form.depreciationRate);
    if (!form.name.trim()) e.name = "Category name is required";
    if (form.depreciationRate === "" || isNaN(rate) || rate < 0 || rate > 100) e.depreciationRate = "Enter 0 to 100";
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { ...form, name: form.name.trim(), description: form.description.trim(), depreciationRate: rate };
    const res = editing ? await run("patch", `/gym-asset/categories/${category._id}`, body) : await run("post", "/gym-asset/categories", body);
    if (res) onSaved(res.data);
  };
  return (
    <>
      <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <Field label="Name" required>
          <input value={form.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} placeholder="e.g. Gym Equipment" className={inputCls} aria-invalid={!!errors.name} />
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>
        <Field label="Examples / description">
          <input value={form.description} onChange={(e) => set("description")(e.target.value)} maxLength={300} placeholder="e.g. Treadmill, dumbbell, bench press" className={inputCls} />
        </Field>
        <Field label="Depreciation (% per year)" hint="Used for the current value in reports: a 10% rate makes a 100,000 item worth 90,000 after one year. Use 0 to keep the purchase price.">
          <input type="number" min={0} max={100} step="0.5" inputMode="decimal" value={form.depreciationRate} onChange={(e) => set("depreciationRate")(e.target.value)} className={inputCls} aria-invalid={!!errors.depreciationRate} />
          {errors.depreciationRate && <FieldError>{errors.depreciationRate}</FieldError>}
        </Field>
        {editing && (
          <Field label="Status" hint="Inactive categories can't be picked for new assets; existing assets keep them.">
            <Select value={form.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </Field>
        )}
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel={editing ? "Save changes" : "Add category"} busy={busy} allowed={allowed} />
      </div>
    </>
  );
}

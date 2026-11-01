"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Btn, EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Add or edit a uniform-stock location. `location`: null = closed, {} = add, a location row = edit.
export default function AssetLocationModal({ location, branches = [], staff = [], permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const editing = !!location?._id;
  return (
    <ModalShell isOpen={!!location} onClose={onClose} size="md" title={editing ? "Edit location" : "Add location"}>
      {location && <Body key={location._id || "new"} location={location} editing={editing} branches={branches} staff={staff} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ location, editing, branches, staff, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const [form, setForm] = useState({
    name: location.name || "",
    branch: location.branch || "",
    details: location.details || "",
    inCharge: location.inCharge?._id || location.inCharge || "",
    status: location.status || "active",
  });
  const set = (key) => (value) => setForm((f) => ({ ...f, [key]: value }));
  const allowed = editing ? permissions.canEdit : permissions.canAdd;
  // Keep a branch that has since been renamed or closed selectable when editing.
  const branchOptions = form.branch && !branches.includes(form.branch) ? [...branches, form.branch] : branches;

  const save = async () => {
    const body = { ...form, name: form.name.trim(), details: form.details.trim(), inCharge: form.inCharge || null };
    const res = editing ? await run("patch", `/asset-location/${location._id}`, body) : await run("post", "/asset-location", body);
    if (res) onSaved(res.data);
  };

  return (
    <div className="p-5 sm:p-6 space-y-4">
      <Field label="Name" required>
        <input value={form.name} onChange={(e) => set("name")(e.target.value)} placeholder="e.g. Main store room" maxLength={80} disabled={!allowed} className={inputCls} />
      </Field>
      <Field label="Branch" hint="Leave empty for a central store that serves every branch.">
        <Select value={form.branch} onChange={set("branch")} options={branchOptions} placeholder="Not tied to a branch" disabled={!allowed} />
      </Field>
      <Field label="Exact place" hint="Floor, room or landmark, so someone new can find it.">
        <input value={form.details} onChange={(e) => set("details")(e.target.value)} placeholder="e.g. 2nd floor, behind reception" maxLength={300} disabled={!allowed} className={inputCls} />
      </Field>
      <div className="space-y-1.5">
        <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Person in charge</span>
        <div className="flex gap-2">
          <div className="flex-1 min-w-0">
            <EmployeePicker staff={staff} value={form.inCharge} onChange={(id) => set("inCharge")(id)} placeholder="Nobody yet" disabled={!allowed} />
          </div>
          {form.inCharge && allowed && (
            <Btn variant="ghost" size="sm" onClick={() => set("inCharge")("")}>
              Clear
            </Btn>
          )}
        </div>
        <span className="block text-[10px] text-brand-dark-grey/80 dark:text-brand-gold-light/60">Who holds the keys and hands out stock from here.</span>
      </div>
      {editing && (
        <Field label="Status" hint="Items already here keep this location, but it can't be picked for new items while inactive.">
          <Select
            value={form.status}
            onChange={set("status")}
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
            ]}
            disabled={!allowed}
          />
        </Field>
      )}
      <ModalFooter onClose={onClose} onSubmit={save} submitLabel={editing ? "Save changes" : "Add location"} busy={busy} disabled={!form.name.trim()} allowed={allowed} />
    </div>
  );
}

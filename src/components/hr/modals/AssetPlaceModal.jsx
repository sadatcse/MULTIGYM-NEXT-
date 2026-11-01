"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { FieldError, useSubmitLock } from "@/components/hr/GymAssetUi";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Add or edit a place inside a location. `place`: null = closed,
// { location } = add to that location, a place row = edit.
export default function AssetPlaceModal({ place, locations = [], permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const editing = !!place?._id;
  return (
    <ModalShell isOpen={!!place} onClose={onClose} size="md" title={editing ? "Edit place" : "Add place"}>
      {place && <Body key={place._id || `new-${place.location}`} place={place} editing={editing} locations={locations} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

const SUGGESTIONS = ["Main Gym Floor", "Reception Area", "Office Room", "Changing Room", "Store Room", "Trainer Room", "Storage Room", "Maintenance Room", "Parking Area"];

function Body({ place, editing, locations, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const [form, setForm] = useState({ location: String(place.location?._id || place.location || ""), name: place.name || "", description: place.description || "", status: place.status || "active" });
  const [errors, setErrors] = useState({});
  const allowed = editing ? permissions.canEdit : permissions.canAdd;
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const save = async () => {
    const e = {};
    if (!form.location) e.location = "Pick the location";
    if (!form.name.trim()) e.name = "Place name is required";
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = { ...form, name: form.name.trim(), description: form.description.trim() };
    const res = editing ? await run("patch", `/gym-asset/places/${place._id}`, body) : await run("post", "/gym-asset/places", body);
    if (res) onSaved(res.data);
  };
  return (
    <>
      <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-4 min-w-0">
        <Field label="Location" required>
          <Select value={form.location} onChange={set("location")} options={locations.map((l) => ({ value: l._id, label: l.name }))} placeholder="Select location" />
          {errors.location && <FieldError>{errors.location}</FieldError>}
        </Field>
        <Field label="Place name" required>
          <input value={form.name} onChange={(e) => set("name")(e.target.value)} maxLength={80} placeholder="e.g. Main Gym Floor" className={inputCls} aria-invalid={!!errors.name} />
          {!editing && (
            <span className="flex flex-wrap gap-1.5 pt-1">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" onClick={() => set("name")(s)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer">
                  {s}
                </button>
              ))}
            </span>
          )}
          {errors.name && <FieldError>{errors.name}</FieldError>}
        </Field>
        <Field label="Description">
          <input value={form.description} onChange={(e) => set("description")(e.target.value)} maxLength={300} placeholder="e.g. Ground floor, next to the cardio area" className={inputCls} />
        </Field>
        {editing && (
          <Field label="Status" hint="Inactive places can't be picked for new assets or transfers.">
            <Select value={form.status} onChange={set("status")} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
          </Field>
        )}
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel={editing ? "Save changes" : "Add place"} busy={busy} allowed={allowed} />
      </div>
    </>
  );
}

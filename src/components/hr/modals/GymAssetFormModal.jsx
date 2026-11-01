"use client";

import { useMemo, useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { money, useHrMutation } from "@/hooks/useHr";
import { AssetImagesInput, FieldError, LocationPlaceFields, useSubmitLock, useGymSuggestions, Suggestions } from "@/components/hr/GymAssetUi";
import { EDITABLE_CONDITIONS, isoDay, newRequestId, todayISO, UNITS, WARRANTY_OPTIONS } from "@/components/hr/gymAssets";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

// Add or edit a register line. `asset`: null = closed, {} = add, an asset = edit.
// `lookups` = useGymLookups(). Supplier and responsible-person boxes suggest names already used.
export default function GymAssetFormModal({ asset, lookups, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  const editing = !!asset?._id;
  return (
    <ModalShell isOpen={!!asset} onClose={onClose} size="2xl" title={editing ? `Edit ${asset.assetCode}` : "Add asset"}>
      {asset && <Body key={asset._id || "new"} asset={asset} editing={editing} lookups={lookups} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

const addMonths = (iso, months) => {
  if (!iso || !Number(months)) return "";
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + Number(months));
  return d.toISOString().slice(0, 10);
};

function initial(a) {
  return {
    name: a.name || "",
    category: a.category?._id || a.category || "",
    images: a.images || [],
    brand: a.brand || "",
    modelNumber: a.modelNumber || "",
    serialNumber: a.serialNumber || "",
    description: a.description || "",
    specification: a.specification || "",
    quantity: a.quantity ?? 1,
    unit: a.unit || "pcs",
    purchaseDate: isoDay(a.purchaseDate),
    unitPrice: a.unitPrice ?? "",
    supplier: a.supplier || "",
    warrantyMonths: String(a.warrantyMonths ?? 0),
    warrantyExpiry: isoDay(a.warrantyExpiry),
    location: a.location?._id || a.location || "",
    place: a.place?._id || a.place || "",
    responsiblePerson: a.responsiblePerson || "",
    condition: a.condition || "new",
    notes: a.notes || "",
  };
}

function validate(f) {
  const e = {};
  if (!f.name.trim()) e.name = "Asset name is required";
  if (!f.category) e.category = "Pick a category";
  const qty = Number(f.quantity);
  if (!Number.isInteger(qty) || qty < 1) e.quantity = "Quantity must be a whole number of at least 1";
  if (f.unitPrice !== "" && (isNaN(Number(f.unitPrice)) || Number(f.unitPrice) < 0)) e.unitPrice = "Enter a price of 0 or more";
  if (f.purchaseDate && f.purchaseDate > todayISO()) e.purchaseDate = "Purchase date can't be in the future";
  if (f.purchaseDate && f.warrantyExpiry && f.warrantyExpiry < f.purchaseDate) e.warrantyExpiry = "Warranty expiry must be after the purchase date";
  if (!f.location) e.location = "Pick the location";
  if (!f.place) e.place = "Pick the place inside the location";
  return e;
}

function Body({ asset, editing, lookups, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const suggest = useGymSuggestions();
  const [form, setForm] = useState(() => initial(asset));
  const [errors, setErrors] = useState({});
  const [expiryTouched, setExpiryTouched] = useState(!!asset.warrantyExpiry);
  const [requestId] = useState(newRequestId);
  const allowed = editing ? permissions.canEdit : permissions.canAdd;
  const set = (key) => (value) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      // Expiry follows purchase date + warranty length until typed by hand.
      if ((key === "purchaseDate" || key === "warrantyMonths") && !expiryTouched) next.warrantyExpiry = addMonths(next.purchaseDate, next.warrantyMonths);
      return next;
    });
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const categoryOptions = useMemo(
    () => lookups.categories.filter((c) => c.status === "active" || c._id === form.category).map((c) => ({ value: c._id, label: c.status === "active" ? c.name : `${c.name} (inactive)` })),
    [lookups.categories, form.category],
  );
  const total = (Number(form.unitPrice) || 0) * (Number(form.quantity) || 0);

  const save = async () => {
    const e = validate(form);
    setErrors(e);
    if (Object.keys(e).length) return;
    const body = {
      ...form,
      name: form.name.trim(),
      quantity: Number(form.quantity),
      unitPrice: form.unitPrice === "" ? 0 : Number(form.unitPrice),
      warrantyMonths: Number(form.warrantyMonths) || 0,
      responsiblePerson: form.responsiblePerson.trim(),
    };
    const res = editing ? await run("patch", `/gym-asset/assets/${asset._id}`, body) : await run("post", "/gym-asset/assets", { ...body, requestId });
    if (res) onSaved(res.data);
  };

  const input = (key, props = {}) => <input value={form[key]} onChange={(e) => set(key)(e.target.value)} className={inputCls} disabled={!allowed} aria-invalid={!!errors[key]} {...props} />;

  return (
    <>
    <fieldset disabled={!allowed || busy} className="p-5 sm:p-6 pb-3 space-y-6 min-w-0">
      <Section title="Basic information">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Asset name" required className="sm:col-span-2">
            {input("name", { placeholder: "e.g. Commercial treadmill", maxLength: 120 })}
            {errors.name && <FieldError>{errors.name}</FieldError>}
          </Field>
          <Field label="Category" required hint={!categoryOptions.length ? "No categories yet. Add them on the Asset Categories page." : undefined}>
            <Select value={form.category} onChange={set("category")} options={categoryOptions} placeholder="Select category" />
            {errors.category && <FieldError>{errors.category}</FieldError>}
          </Field>
          <Field label="Asset code" hint={editing ? undefined : "Given automatically when you save, e.g. AST-00042."}>
            <input value={asset.assetCode || "Auto"} readOnly disabled className={inputCls} />
          </Field>
          <Field label="Brand">{input("brand", { placeholder: "e.g. Life Fitness", maxLength: 80 })}</Field>
          <Field label="Model number">{input("modelNumber", { maxLength: 80 })}</Field>
          <Field label="Serial number">{input("serialNumber", { maxLength: 80 })}</Field>
          <div className="grid grid-cols-[1fr_7rem] gap-3">
            <Field label="Quantity" required>
              {input("quantity", { type: "number", min: 1, step: 1, inputMode: "numeric" })}
              {errors.quantity && <FieldError>{errors.quantity}</FieldError>}
            </Field>
            <Field label="Unit">
              <Select value={form.unit} onChange={set("unit")} options={UNITS.includes(form.unit) ? UNITS : [...UNITS, form.unit]} />
            </Field>
          </div>
          <Field label="Description" className="sm:col-span-2">
            <textarea value={form.description} onChange={(e) => set("description")(e.target.value)} rows={2} maxLength={1000} className={inputCls} />
          </Field>
          <Field label="Specification" hint="Size, weight, power, capacity…" className="sm:col-span-2">
            <textarea value={form.specification} onChange={(e) => set("specification")(e.target.value)} rows={2} maxLength={2000} className={inputCls} />
          </Field>
          <div className="sm:col-span-2 space-y-1.5">
            <span className="block text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">Photos</span>
            <AssetImagesInput value={form.images} onChange={set("images")} disabled={!allowed} />
            <span className="block text-[10px] text-brand-dark-grey/80 dark:text-brand-gold-light/60">Up to 8 photos. They are shrunk before upload, so slow connections are fine.</span>
          </div>
        </div>
      </Section>

      <Section title="Purchase">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Purchase date">
            {input("purchaseDate", { type: "date", max: todayISO() })}
            {errors.purchaseDate && <FieldError>{errors.purchaseDate}</FieldError>}
          </Field>
          <Field label="Purchase price (per unit)" hint={total ? `Total value: ${money(total)}` : undefined}>
            {input("unitPrice", { type: "number", min: 0, step: "0.01", inputMode: "decimal", placeholder: "0" })}
            {errors.unitPrice && <FieldError>{errors.unitPrice}</FieldError>}
          </Field>
          <Field label="Supplier / vendor" className="sm:col-span-2">
            {input("supplier", { list: "gym-asset-vendors", maxLength: 120, placeholder: "Shop or company it was bought from" })}
            <Suggestions id="gym-asset-vendors" items={suggest.suppliers} />
          </Field>
          <Field label="Warranty">
            <Select value={form.warrantyMonths} onChange={set("warrantyMonths")} options={WARRANTY_OPTIONS.some((o) => o.value === form.warrantyMonths) ? WARRANTY_OPTIONS : [...WARRANTY_OPTIONS, { value: form.warrantyMonths, label: `${form.warrantyMonths} months` }]} />
          </Field>
          <Field label="Warranty expiry" hint={!expiryTouched && form.warrantyExpiry ? "Worked out from the purchase date; change it if needed." : undefined}>
            <input
              type="date"
              value={form.warrantyExpiry}
              onChange={(e) => {
                setExpiryTouched(true);
                set("warrantyExpiry")(e.target.value);
              }}
              className={inputCls}
              aria-invalid={!!errors.warrantyExpiry}
            />
            {errors.warrantyExpiry && <FieldError>{errors.warrantyExpiry}</FieldError>}
          </Field>
        </div>
      </Section>

      <Section title="Location">
        <LocationPlaceFields
          locations={lookups.locations}
          places={lookups.places}
          location={form.location}
          place={form.place}
          required
          errors={errors}
          disabled={!allowed}
          onChange={({ location, place }) => {
            setForm((f) => ({ ...f, location, place }));
            setErrors((e) => ({ ...e, location: undefined, place: undefined }));
          }}
        />
        {editing && (form.location !== (asset.location?._id || asset.location) || form.place !== (asset.place?._id || asset.place)) && (
          <p className="mt-2 text-[11px] font-bold text-amber-600 dark:text-amber-400">Saving records a location change in the history. Use Transfer instead if you need a transfer order letter.</p>
        )}
      </Section>

      <Section title="Condition and responsibility">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Condition" hint={asset.condition === "under_maintenance" ? "Set when its maintenance is completed." : undefined}>
            <Select
              value={form.condition}
              onChange={set("condition")}
              options={asset.condition === "under_maintenance" ? [{ value: "under_maintenance", label: "Under maintenance" }] : EDITABLE_CONDITIONS}
              disabled={asset.condition === "under_maintenance"}
            />
          </Field>
          <Field label="Responsible person" hint="Optional: who looks after this item.">
            {input("responsiblePerson", { list: "gym-asset-people", maxLength: 80, placeholder: "Name" })}
            <Suggestions id="gym-asset-people" items={suggest.responsible} />
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea value={form.notes} onChange={(e) => set("notes")(e.target.value)} rows={2} maxLength={1000} className={inputCls} />
          </Field>
        </div>
      </Section>

      {Object.keys(errors).some((k) => errors[k]) && <p className="text-xs font-bold text-brand-red">Please fix the highlighted fields.</p>}
    </fieldset>
    <div className="px-5 sm:px-6 pb-5 sm:pb-6">
      <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel={editing ? "Save changes" : "Add asset"} busy={busy} allowed={allowed} />
    </div>
    </>
  );
}

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-black text-brand-black dark:text-brand-white">{title}</h3>
      {children}
    </section>
  );
}

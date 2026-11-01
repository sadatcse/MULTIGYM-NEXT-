"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import { AssetPicker, FieldError, LocationPlaceFields, useSubmitLock } from "@/components/hr/GymAssetUi";
import { newRequestId, todayISO, whereText } from "@/components/hr/gymAssets";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const REASONS = ["New branch setup", "Replacement", "Repair / servicing", "Not needed here", "Storage"];

// Move an asset to another location / place. `state`: null = closed,
// {} = pick the asset here, { asset } = transfer that asset.
export default function AssetTransferModal({ state, lookups, permissions = NO_PERMISSIONS, onClose, onSaved }) {
  return (
    <ModalShell isOpen={!!state} onClose={onClose} size="lg" title="Transfer asset">
      {state && <Body key={state.asset?._id || "pick"} preset={state.asset} lookups={lookups} permissions={permissions} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ preset, lookups, permissions, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const once = useSubmitLock();
  const [asset, setAsset] = useState(preset || null);
  const [form, setForm] = useState({ quantity: preset?.quantity ?? 1, location: "", place: "", transferDate: todayISO(), reason: "", note: "" });
  const [errors, setErrors] = useState({});
  const [requestId] = useState(newRequestId);
  const allowed = permissions.canAdd;
  const set = (k) => (v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };
  const curLoc = asset?.location?._id || asset?.location;
  const curPlace = asset?.place?._id || asset?.place;
  const partial = asset && Number(form.quantity) < asset.quantity;

  const save = async () => {
    const e = {};
    if (!asset) e.asset = "Pick the asset to transfer";
    const qty = Number(form.quantity);
    if (asset && (!Number.isInteger(qty) || qty < 1 || qty > asset.quantity)) e.quantity = `Enter 1 to ${asset.quantity}`;
    if (!form.location) e.location = "Pick the destination location";
    if (!form.place) e.place = "Pick the destination place";
    if (asset && form.location === String(curLoc) && form.place === String(curPlace)) e.place = "The asset is already here; pick a different place";
    if (!form.transferDate) e.transferDate = "Transfer date is required";
    else if (form.transferDate > todayISO()) e.transferDate = "Transfer date can't be in the future";
    if (!form.reason.trim()) e.reason = "Give a reason for the transfer";
    setErrors(e);
    if (Object.keys(e).length) return;
    const res = await run("post", "/gym-asset/transfers", {
      asset: asset._id,
      quantity: qty,
      toLocation: form.location,
      toPlace: form.place,
      transferDate: form.transferDate,
      reason: form.reason.trim(),
      note: form.note.trim(),
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
              <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80">Now at {whereText(preset.location, preset.place)}</span>
            </div>
          ) : (
            <AssetPicker
              value={asset}
              onChange={(a) => {
                setAsset(a);
                setForm((f) => ({ ...f, quantity: a?.quantity ?? 1 }));
                setErrors((e) => ({ ...e, asset: undefined }));
              }}
              error={errors.asset}
            />
          )}
        </Field>

        {asset?.quantity > 1 && (
          <Field label={`Quantity to move (of ${asset.quantity} ${asset.unit})`} hint={partial ? `${asset.quantity - Number(form.quantity || 0)} stay here; the moved ${asset.unit} get their own asset code at the destination.` : "The whole line moves."}>
            <input type="number" min={1} max={asset.quantity} step={1} inputMode="numeric" value={form.quantity} onChange={(e) => set("quantity")(e.target.value)} className={inputCls} aria-invalid={!!errors.quantity} />
            {errors.quantity && <FieldError>{errors.quantity}</FieldError>}
          </Field>
        )}

        <LocationPlaceFields
          locations={lookups.locations}
          places={lookups.places}
          location={form.location}
          place={form.place}
          labels={["To location", "To place"]}
          required
          errors={errors}
          onChange={({ location, place }) => {
            setForm((f) => ({ ...f, location, place }));
            setErrors((e) => ({ ...e, location: undefined, place: undefined }));
          }}
        />

        <Field label="Transfer date" required>
          <input type="date" max={todayISO()} value={form.transferDate} onChange={(e) => set("transferDate")(e.target.value)} className={inputCls} aria-invalid={!!errors.transferDate} />
          {errors.transferDate && <FieldError>{errors.transferDate}</FieldError>}
        </Field>

        <Field label="Reason" required>
          <input value={form.reason} onChange={(e) => set("reason")(e.target.value)} maxLength={300} placeholder="Why is it moving?" className={inputCls} aria-invalid={!!errors.reason} />
          <span className="flex flex-wrap gap-1.5 pt-1">
            {REASONS.map((r) => (
              <button key={r} type="button" onClick={() => set("reason")(r)} className="px-2.5 py-1 rounded-lg text-[10px] font-bold border border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-gold cursor-pointer">
                {r}
              </button>
            ))}
          </span>
          {errors.reason && <FieldError>{errors.reason}</FieldError>}
        </Field>

        <Field label="Note">
          <textarea value={form.note} onChange={(e) => set("note")(e.target.value)} rows={2} maxLength={1000} placeholder="Packing, who carries it, anything the receiver should know" className={inputCls} />
        </Field>
      </fieldset>
      <div className="px-5 sm:px-6 pb-5 sm:pb-6">
        <ModalFooter onClose={onClose} onSubmit={() => once(save)} submitLabel="Transfer" busy={busy} allowed={allowed} />
      </div>
    </>
  );
}

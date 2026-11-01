"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import { FiCamera, FiDownload, FiFileText, FiLoader, FiPrinter, FiSearch, FiX } from "react-icons/fi";
import { Badge, Btn, Field, inputCls, Select } from "@/components/hr/HrUi";
import { errMsg, useHrQuery, useHrUpload } from "@/hooks/useHr";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { AuthContext } from "@/providers/AuthProvider";
import { downloadDocumentPdf, printDocument } from "@/lib/hrPrint";
import useDebounce from "@/hooks/useDebounce";
import { CONDITION, compressImage, transferLetterHtml, whereText } from "./gymAssets";

export function ConditionBadge({ value }) {
  const c = CONDITION[value];
  return <Badge tone={c?.tone || "slate"}>{c?.label || value || "—"}</Badge>;
}

/**
 * Gym locations, places and categories for the asset forms and filters. The
 * list endpoints are open to every signed-in user, so this never trips the
 * 403 → sign-out handling.
 */
export function useGymLookups() {
  const loc = useHrQuery("/gym-asset/locations");
  const plc = useHrQuery("/gym-asset/places");
  const cat = useHrQuery("/gym-asset/categories");
  return {
    locations: useMemo(() => loc.data?.data || [], [loc.data]),
    places: useMemo(() => plc.data?.data || [], [plc.data]),
    categories: useMemo(() => cat.data?.data || [], [cat.data]),
    loading: loc.loading || plc.loading || cat.loading,
    error: loc.error || plc.error || cat.error,
    refetch: () => Promise.all([loc.refetch(), plc.refetch(), cat.refetch()]),
  };
}

/**
 * Location select + Place select filtered to that location. For new records
 * (activeOnly) inactive entries are hidden, except the ones already chosen.
 */
export function LocationPlaceFields({ locations, places, location, place, onChange, activeOnly = true, required, errors = {}, disabled, labels = ["Location", "Place"], placeholders = ["Select location", "Select place"], className = "" }) {
  const locOptions = locations.filter((l) => !activeOnly || l.status === "active" || l._id === location).map((l) => ({ value: l._id, label: l.status === "active" ? l.name : `${l.name} (inactive)` }));
  const placeOptions = places
    .filter((p) => String(p.location) === String(location) && (!activeOnly || p.status === "active" || p._id === place))
    .map((p) => ({ value: p._id, label: p.status === "active" ? p.name : `${p.name} (inactive)` }));
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${className}`}>
      <Field label={labels[0]} required={required}>
        <Select value={location} onChange={(v) => onChange({ location: v, place: "" })} options={locOptions} placeholder={placeholders[0]} disabled={disabled} aria-invalid={!!errors.location} />
        {errors.location && <FieldError>{errors.location}</FieldError>}
      </Field>
      <Field label={labels[1]} required={required} hint={location && !placeOptions.length ? "This location has no places yet. Add them on the Locations & Places page." : undefined}>
        <Select value={place} onChange={(v) => onChange({ location, place: v })} options={placeOptions} placeholder={location ? placeholders[1] : "Pick a location first"} disabled={disabled || !location} aria-invalid={!!errors.place} />
        {errors.place && <FieldError>{errors.place}</FieldError>}
      </Field>
    </div>
  );
}

export const FieldError = ({ children }) => <span className="block text-[11px] font-bold text-brand-red">{children}</span>;

/** Search-as-you-type picker over active assets. `value` is the chosen asset object. */
export function AssetPicker({ value, onChange, disabled, error, placeholder = "Search code, name or serial…" }) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [search] = useDebounce(text, 350);
  const q = useHrQuery("/gym-asset/assets/options", { search, limit: 15 }, { enabled: open });
  const rows = q.data?.data || [];
  const box = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => box.current && !box.current.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  if (value && !open) {
    return (
      <div className={`${inputCls} flex items-center justify-between gap-2`}>
        <span className="min-w-0">
          <span className="block truncate">
            {value.assetCode} · {value.name}
          </span>
          <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/80 truncate">
            {value.quantity} {value.unit} · {whereText(value.location, value.place)}
          </span>
        </span>
        {!disabled && (
          <button type="button" onClick={() => { onChange(null); setOpen(true); }} className="shrink-0 text-[11px] font-black text-brand-gold hover:underline cursor-pointer">
            Change
          </button>
        )}
      </div>
    );
  }

  return (
    <div ref={box} className="relative">
      <div className="relative">
        <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light/70 text-sm" />
        <input value={text} disabled={disabled} onFocus={() => setOpen(true)} onChange={(e) => { setText(e.target.value); setOpen(true); }} placeholder={placeholder} className={`${inputCls} pl-9`} aria-invalid={!!error} />
      </div>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-brand-beige dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal shadow-2xl p-1.5 max-h-72 overflow-y-auto">
          {q.loading && !rows.length ? (
            <p className="flex items-center gap-2 px-3 py-3 text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light/70"><FiLoader className="animate-spin" /> Searching…</p>
          ) : q.error ? (
            <p className="px-3 py-3 text-[11px] font-bold text-brand-red">{q.error}</p>
          ) : !rows.length ? (
            <p className="px-3 py-3 text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light/70">No active asset matches.</p>
          ) : (
            rows.map((a) => (
              <button key={a._id} type="button" onClick={() => { onChange(a); setOpen(false); setText(""); }} className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-gold/10 cursor-pointer">
                <span className="block text-xs font-black text-brand-black dark:text-brand-white truncate">{a.assetCode} · {a.name}</span>
                <span className="block text-[10px] font-semibold text-brand-dark-grey dark:text-brand-gold-light/70 truncate">
                  {a.quantity} {a.unit} · {whereText(a.location, a.place)}
                </span>
              </button>
            ))
          )}
        </div>
      )}
      {error && <FieldError>{error}</FieldError>}
    </div>
  );
}

/** Asset photos: compressed in the browser, uploaded one by one, shown as thumbnails. */
export function AssetImagesInput({ value = [], onChange, max = 8, disabled }) {
  const { upload } = useHrUpload();
  const [pending, setPending] = useState(0);
  const input = useRef(null);
  const add = async (files) => {
    const list = [...files].slice(0, max - value.length);
    let next = value;
    setPending(list.length);
    for (const f of list) {
      const small = await compressImage(f);
      const res = await upload(small, "gym-assets");
      if (res?.url) {
        next = [...next, res];
        onChange(next);
      }
      setPending((n) => n - 1);
    }
  };
  return (
    <div className="flex flex-wrap gap-2">
      {value.map((img, i) => (
        <div key={img.url} className="relative w-20 h-20 rounded-xl overflow-hidden border border-brand-beige/60 dark:border-brand-dark-grey bg-brand-offwhite dark:bg-brand-midnight">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img.url} alt={img.name || `Asset photo ${i + 1}`} loading="lazy" className="w-full h-full object-cover" />
          {!disabled && (
            <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} title="Remove photo" aria-label="Remove photo" className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center cursor-pointer">
              <FiX className="text-xs" />
            </button>
          )}
        </div>
      ))}
      {Array.from({ length: pending }).map((_, i) => (
        <div key={`p${i}`} className="w-20 h-20 rounded-xl border border-dashed border-brand-gold/50 flex items-center justify-center text-brand-gold">
          <FiLoader className="animate-spin" />
        </div>
      ))}
      {!disabled && value.length + pending < max && (
        <>
          <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple hidden onChange={(e) => { add(e.target.files || []); e.target.value = ""; }} />
          <button type="button" onClick={() => input.current?.click()} disabled={pending > 0} className="w-20 h-20 rounded-xl border border-dashed border-brand-beige dark:border-brand-dark-grey text-brand-dark-grey dark:text-brand-gold-light/70 hover:border-brand-gold hover:text-brand-gold flex flex-col items-center justify-center gap-1 text-[10px] font-bold cursor-pointer disabled:opacity-50">
            <FiCamera className="text-lg" /> Add photo
          </button>
        </>
      )}
    </div>
  );
}

/** Excel / PDF / Print buttons for a report or list. */
export function ExportButtons({ onExcel, onPdf, onPrint, busy, disabled }) {
  return (
    <>
      <Btn variant="ghost" size="sm" onClick={onExcel} disabled={disabled || !!busy} loading={busy === "excel"}>
        <FiDownload /> Excel
      </Btn>
      <Btn variant="ghost" size="sm" onClick={onPdf} disabled={disabled || !!busy} loading={busy === "pdf"}>
        <FiFileText /> PDF
      </Btn>
      <Btn variant="ghost" size="sm" onClick={onPrint} disabled={disabled || !!busy} loading={busy === "print"}>
        <FiPrinter /> Print
      </Btn>
    </>
  );
}

/** Thin bar shown while a list refreshes with data already on screen (slow connections). */
export const Refreshing = ({ show }) => (show ? <div className="h-0.5 w-full overflow-hidden rounded bg-brand-gold/20"><div className="h-full w-1/3 bg-brand-gold animate-pulse" /></div> : null);

/** Prints or downloads the transfer order letter for a transfer id. */
export function useTransferLetter() {
  const axiosSecure = useAxiosSecure();
  const { company } = useContext(AuthContext);
  const [busy, setBusy] = useState(null); // `${id}:${mode}` while working
  const open = useCallback(
    async (id, mode = "print") => {
      setBusy(`${id}:${mode}`);
      try {
        const t = (await axiosSecure.get(`/gym-asset/transfers/${id}`)).data?.data;
        const doc = { title: "Asset Transfer Order", subtitle: `${t.transferId} · ${t.assetCode} ${t.assetName}`, company, bodyHtml: transferLetterHtml(t) };
        if (mode === "pdf") await downloadDocumentPdf({ ...doc, fileName: `${t.transferId}-transfer-order.pdf` });
        else printDocument(doc);
      } catch (err) {
        toast.error(errMsg(err, "Couldn't prepare the transfer letter"));
      } finally {
        setBusy(null);
      }
    },
    [axiosSecure, company],
  );
  return { open, busy };
}

/**
 * Ignores repeat clicks while a save is in flight. React state ("busy") only
 * disables the button after a re-render, so fast double taps on a slow
 * connection could otherwise send the request twice; a ref blocks at once.
 */
export function useSubmitLock() {
  const lock = useRef(false);
  return useCallback(async (fn) => {
    if (lock.current) return undefined;
    lock.current = true;
    try {
      return await fn();
    } finally {
      lock.current = false;
    }
  }, []);
}

/**
 * Names already used in Gym Assets (responsible people, approvers, suppliers,
 * service providers, who recorded records), offered as typing suggestions.
 */
export function useGymSuggestions({ enabled = true } = {}) {
  const q = useHrQuery("/gym-asset/suggestions", {}, { enabled });
  return q.data?.data || { responsible: [], suppliers: [], approvers: [], recordedBy: [], serviceProviders: [] };
}

/** <datalist> for a free-text input's `list` attribute. */
export const Suggestions = ({ id, items = [] }) => (
  <datalist id={id}>
    {items.map((v) => (
      <option key={v} value={v} />
    ))}
  </datalist>
);

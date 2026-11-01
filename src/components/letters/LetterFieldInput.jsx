"use client";

import { inputCls } from "@/components/hr/HrUi";

// Input for one template info field, chosen by its type (sent by the API:
// text | textarea | date | money | percent | number). Values are stored raw
// ("2026-10-21", "25000") and formatted on the letter by the server.
export default function LetterFieldInput({ field, value, onChange, error, currency = "৳", disabled, suggestions, hintValue }) {
  const id = `lf-${field.key}`;
  const type = field.type || "text";
  const placeholder = hintValue ? `From profile: ${hintValue}` : field.placeholder || field.defaultValue || (type === "date" ? "" : field.labelEnglish || field.labelBangla);
  const listId = suggestions?.length ? `${id}-list` : undefined;
  const cls = `${inputCls} ${error ? "!border-brand-red focus:!ring-brand-red/30" : ""}`;

  let control;
  if (type === "textarea") {
    control = <textarea id={id} rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={`${cls} resize-y min-h-[76px]`} />;
  } else if (type === "date") {
    control = <input id={id} type="date" value={/^\d{4}-\d{2}-\d{2}/.test(value || "") ? String(value).slice(0, 10) : ""} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={`${cls} dark:[color-scheme:dark]`} />;
  } else if (type === "money" || type === "percent" || type === "number") {
    control = (
      <div className="relative">
        {type === "money" && <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-brand-gold">{currency}</span>}
        <input
          id={id}
          inputMode="decimal"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={type === "money" ? "25000" : type === "percent" ? "10" : placeholder}
          disabled={disabled}
          className={`${cls} ${type === "money" ? "pl-8" : ""} ${type === "percent" ? "pr-8" : ""}`}
        />
        {type === "percent" && <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-brand-gold">%</span>}
      </div>
    );
  } else {
    control = (
      <>
        <input id={id} list={listId} value={value ?? ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} disabled={disabled} className={cls} />
        {listId && (
          <datalist id={listId}>
            {suggestions.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        )}
      </>
    );
  }

  return (
    <div className={`space-y-1.5 ${type === "textarea" ? "sm:col-span-2" : ""}`}>
      <label htmlFor={id} className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
          {field.labelBangla} {field.required && <span className="text-brand-red">*</span>}
        </span>
        {field.source === "employee" && (
          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">From profile</span>
        )}
      </label>
      {control}
      {error ? <span className="block text-[10px] font-bold text-brand-red">{error}</span> : field.labelEnglish ? <span className="block text-[10px] text-brand-dark-grey/80 dark:text-brand-gold-light/60">{field.labelEnglish}</span> : null}
    </div>
  );
}

// Required custom fields that are still empty (employee fields fall back to
// the profile and defaults fill in on the server).
export function missingRequired(fields = [], values = {}) {
  const errors = {};
  for (const f of fields) {
    if (!f.required || f.source === "employee" || f.defaultValue) continue;
    const v = values[f.key];
    if (v === undefined || v === null || String(v).trim() === "") errors[f.key] = "Required";
  }
  return errors;
}

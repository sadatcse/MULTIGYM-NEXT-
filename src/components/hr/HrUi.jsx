"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { FiInbox, FiLoader, FiPaperclip, FiSearch, FiX } from "react-icons/fi";
import { useHrUpload, titleCase } from "@/hooks/useHr";

// Small presentational kit shared by the HR operations pages so they match
// the standard dashboard look used by the settings pages (Mtitle header,
// rounded-3xl cards, gold segmented controls) without every page
// re-declaring the same class strings.

// Page wrapper used by every HR page; same container as the settings pages.
export const pageCls = "space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans";

export const inputCls =
  "w-full px-3.5 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-base sm:text-xs font-bold text-brand-black dark:text-brand-white outline-none focus:ring-2 focus:ring-brand-gold/50 transition-all disabled:opacity-60";

// Compact inline control (month/date pickers, small selects) for header toolbars.
export const controlCls =
  "bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white text-xs font-bold rounded-xl px-3 py-1.5 outline-none cursor-pointer focus:ring-2 focus:ring-brand-gold/50 dark:[color-scheme:dark]";

// Same markup as components/Comon/Mtitle, but the action area wraps so
// toolbars with several controls stay usable on phones.
export function PageHeader({ icon, title, subtitle, actions }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-brand-beige/50 dark:border-brand-dark-grey/50">
      <div className="flex flex-col gap-1 min-w-0">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight text-brand-black dark:text-brand-white flex items-center gap-2">{title}</h2>
        {subtitle && <p className="text-xs sm:text-sm font-medium text-brand-dark-grey dark:text-brand-gold-light">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3 sm:justify-end">{actions}</div>}
    </div>
  );
}

const TONES = {
  gold: "bg-brand-gold/10 text-brand-gold",
  green: "bg-emerald-500/10 text-emerald-500",
  red: "bg-red-500/10 text-red-500",
  amber: "bg-amber-500/10 text-amber-500",
  blue: "bg-blue-500/10 text-blue-500",
  purple: "bg-purple-500/10 text-purple-500",
  slate: "bg-zinc-500/10 text-zinc-500",
  cyan: "bg-cyan-500/10 text-cyan-500",
};

const VALUE_TONE = {
  gold: "text-brand-black dark:text-brand-white",
  green: "text-emerald-500",
  red: "text-rose-500",
  amber: "text-amber-500",
  blue: "text-blue-500",
  purple: "text-purple-500",
  slate: "text-brand-black dark:text-brand-white",
  cyan: "text-cyan-500",
};

const HOVER_TONE = {
  gold: "hover:border-brand-gold/50",
  green: "hover:border-emerald-500/50",
  red: "hover:border-rose-500/50",
  amber: "hover:border-amber-500/50",
  blue: "hover:border-blue-500/50",
  purple: "hover:border-purple-500/50",
  slate: "hover:border-zinc-500/50",
  cyan: "hover:border-cyan-500/50",
};

export function StatCard({ icon, label, value, hint, tone = "gold", onClick, active, index = 0 }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut", delay: index * 0.08 }}
      className={`text-left bg-brand-white dark:bg-brand-charcoal p-5 rounded-3xl border shadow-sm transition-all duration-300 group ${
        active ? "border-brand-gold ring-2 ring-brand-gold/30" : `border-brand-beige/50 dark:border-brand-dark-grey/50 ${HOVER_TONE[tone] || HOVER_TONE.gold}`
      } ${onClick ? "cursor-pointer" : "cursor-default"}`}
    >
      <span className="flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light block truncate">{label}</span>
          <span className={`text-2xl font-black mt-1 block truncate ${VALUE_TONE[tone] || VALUE_TONE.gold}`}>{value}</span>
          {hint && <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold block truncate">{hint}</span>}
        </span>
        <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shrink-0 group-hover:scale-110 transition-transform ${TONES[tone] || TONES.gold}`}>{icon}</span>
      </span>
    </motion.button>
  );
}

export function Card({ title, subtitle, actions, children, className = "", bodyClassName = "p-5" }) {
  return (
    <section className={`bg-brand-white dark:bg-brand-charcoal rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm ${className}`}>
      {(title || actions) && (
        <header className="p-4 sm:px-5 border-b border-brand-beige/40 dark:border-brand-dark-grey/40 flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && <h2 className="text-base font-black text-brand-black dark:text-brand-white">{title}</h2>}
            {subtitle && <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">{subtitle}</p>}
          </div>
          {/* On phones every toolbar control takes a full row. */}
          {actions && <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto max-sm:*:w-full">{actions}</div>}
        </header>
      )}
      <div className={bodyClassName}>{children}</div>
    </section>
  );
}

const STATUS_TONE = {
  // attendance
  present: "green", late: "amber", half_day: "purple", absent: "red", leave: "blue", missing_punch: "amber",
  weekend: "slate", holiday: "cyan", not_punched: "slate",
  // leave
  pending_branch: "amber", pending_hr: "amber", pending_director: "purple", approved: "green", rejected: "red", cancelled: "slate",
  recommended: "green", partially_recommended: "amber", not_recommended: "red", partially_approved: "amber",
  // generic / requisition / payroll / discipline
  active: "green", pending: "amber", disabled: "slate", completed: "blue", draft: "amber", finalized: "blue", paid: "green",
  submitted: "amber", verified: "blue", purchased: "purple", received: "green",
  open: "amber", awaiting_reply: "purple", under_investigation: "blue", decision_made: "cyan", closed: "slate",
  low: "slate", normal: "blue", medium: "blue", high: "amber", urgent: "red", critical: "red",
};

const BADGE = {
  green: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
  red: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20",
  blue: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
  purple: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
  cyan: "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/20",
  slate: "bg-zinc-500/10 text-zinc-600 dark:text-zinc-300 border-zinc-500/20",
  gold: "bg-brand-gold/10 text-brand-gold border-brand-gold/30",
};

const STATUS_LABEL = {
  pending_branch: "Branch Verification",
  pending_hr: "HR Verification",
  pending_director: "Director Approval",
  not_punched: "Not In",
};

const DOT = {
  green: "bg-emerald-500", amber: "bg-amber-500", red: "bg-red-500", blue: "bg-blue-500",
  purple: "bg-purple-500", cyan: "bg-cyan-500", slate: "bg-zinc-500", gold: "bg-brand-gold",
};

export function Badge({ status, tone, children }) {
  const t = tone || STATUS_TONE[status] || "slate";
  return (
    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full border text-[11px] font-extrabold capitalize whitespace-nowrap ${BADGE[t]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${DOT[t]}`} />
      {children || STATUS_LABEL[status] || titleCase(status)}
    </span>
  );
}

export function Btn({ children, variant = "primary", size = "md", className = "", loading, ...props }) {
  const ghost = "bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey text-brand-black dark:text-brand-white hover:border-brand-gold";
  const v = {
    primary: "bg-brand-red hover:bg-brand-red-dark text-white shadow-lg shadow-brand-red/20",
    gold: "bg-brand-gold hover:bg-brand-gold-light text-brand-midnight shadow-md shadow-brand-gold/20",
    ghost,
    // Kept for older call sites; the header is no longer dark, so it renders as ghost.
    glass: ghost,
    success: "bg-emerald-600 hover:bg-emerald-700 text-white",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  }[variant];
  const s = size === "sm" ? "px-3 py-1.5 text-[11px] rounded-xl" : "px-5 py-2.5 text-xs rounded-2xl";
  return (
    <button
      type="button"
      disabled={loading || props.disabled}
      className={`inline-flex items-center justify-center gap-2 font-bold transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer ${v} ${s} ${className}`}
      {...props}
    >
      {loading && <FiLoader className="animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, required, hint, children, className = "" }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className="text-[11px] font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
        {label} {required && <span className="text-brand-red">*</span>}
      </span>
      {children}
      {hint && <span className="block text-[10px] text-brand-dark-grey/80 dark:text-brand-gold-light/60">{hint}</span>}
    </label>
  );
}

export function Select({ value, onChange, options, placeholder, className = "", ...props }) {
  return (
    <select value={value ?? ""} onChange={(e) => onChange(e.target.value)} className={`${inputCls} cursor-pointer ${className}`} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        return (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        );
      })}
    </select>
  );
}

export function SearchBox({ value, onChange, placeholder = "Search…", className = "" }) {
  return (
    <div className={`relative ${className}`}>
      <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey dark:text-brand-gold-light text-sm" />
      <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputCls} pl-9`} />
      {value && (
        <button type="button" onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-dark-grey hover:text-brand-red cursor-pointer">
          <FiX />
        </button>
      )}
    </div>
  );
}

// Searchable employee picker over a preloaded staff list.
export function EmployeePicker({ staff = [], value, onChange, placeholder = "Select employee", filter, disabled }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return staff
      .filter((e) => (filter ? filter(e) : true))
      .filter((e) => !s || `${e.name} ${e.employeeId || ""} ${e.jobPosition || ""}`.toLowerCase().includes(s))
      .slice(0, 60);
  }, [staff, q, filter]);
  const selected = staff.find((e) => e._id === value);
  return (
    <div className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} className={`${inputCls} text-left flex items-center justify-between cursor-pointer`}>
        <span className={selected ? "" : "text-brand-dark-grey/70"}>
          {selected ? `${selected.name}${selected.employeeId ? ` · ${selected.employeeId}` : ""}` : placeholder}
        </span>
        <FiSearch className="opacity-60" />
      </button>
      {open && (
        <div className="absolute z-30 mt-1.5 w-full rounded-2xl border border-brand-beige dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal shadow-2xl p-2">
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Type name or ID…" className={inputCls} />
          <div className="max-h-64 overflow-y-auto mt-1.5">
            {list.map((e) => (
              <button
                key={e._id}
                type="button"
                onClick={() => {
                  onChange(e._id, e);
                  setOpen(false);
                  setQ("");
                }}
                className="w-full text-left px-3 py-2 rounded-xl hover:bg-brand-gold/10 flex items-center gap-2.5 cursor-pointer"
              >
                <Avatar name={e.name} photo={e.photo} size={28} />
                <span className="min-w-0">
                  <span className="block text-xs font-black text-brand-black dark:text-brand-white truncate">{e.name}</span>
                  <span className="block text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 truncate">
                    {[e.employeeId, e.jobPosition, e.branches?.[0]].filter(Boolean).join(" · ")}
                  </span>
                </span>
              </button>
            ))}
            {!list.length && <p className="text-[11px] text-center py-4 text-brand-dark-grey">No match</p>}
          </div>
        </div>
      )}
    </div>
  );
}

export function Avatar({ name = "", photo, size = 36 }) {
  const initials = name.split(" ").map((p) => p[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} style={{ width: size, height: size }} className="rounded-xl object-cover shrink-0 border border-brand-beige/50" />;
  }
  return (
    <span style={{ width: size, height: size }} className="rounded-xl shrink-0 bg-gradient-to-br from-brand-gold to-amber-600 text-brand-black font-black text-[11px] flex items-center justify-center">
      {initials || "?"}
    </span>
  );
}

export function EmptyState({ icon = <FiInbox />, title = "Nothing here yet", text, action }) {
  return (
    <div className="py-12 px-6 text-center">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-brand-gold/10 text-brand-gold flex items-center justify-center text-2xl font-bold">{icon}</div>
      <h3 className="text-lg font-black text-brand-black dark:text-brand-white mb-1">{title}</h3>
      {text && <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light max-w-sm mx-auto mb-6">{text}</p>}
      {action}
    </div>
  );
}

export function Loading({ rows = 5 }) {
  return (
    <div className="p-5 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight animate-pulse" style={{ opacity: 1 - i * 0.12 }} />
      ))}
    </div>
  );
}

export function Table({ head, children, footer }) {
  return (
    <div className="overflow-x-auto overscroll-x-contain [-webkit-overflow-scrolling:touch]">
      <table className="w-full min-w-max sm:min-w-0 text-left border-collapse">
        <thead className="bg-brand-offwhite dark:bg-brand-midnight uppercase text-[10px] font-black tracking-wider text-brand-dark-grey dark:text-brand-gold-light border-b border-brand-beige/60 dark:border-brand-dark-grey/60">
          <tr>
            {head.map((h, i) => (
              <th key={i} className={`py-4 px-4 sm:px-5 whitespace-nowrap ${typeof h === "object" ? h.className : ""}`}>
                {typeof h === "object" ? h.label : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30 text-xs font-bold text-brand-black dark:text-brand-white [&>tr]:transition-all [&>tr]:duration-150 [&>tr:hover]:bg-brand-gold/5 dark:[&>tr:hover]:bg-brand-gold/10">{children}</tbody>
        {footer}
      </table>
    </div>
  );
}

export const Td = ({ children, className = "", ...props }) => (
  <td className={`py-3 px-4 sm:py-4 sm:px-5 align-middle ${className}`} {...props}>
    {children}
  </td>
);

// File attach list backed by the S3 upload endpoint.
export function Attachments({ value = [], onChange, folder, max = 5, readOnly }) {
  const { upload, uploading } = useHrUpload();
  const inputRef = useRef(null);
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((a, i) => (
          <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-gold/10 border border-brand-gold/30 text-[11px] font-bold">
            <FiPaperclip className="text-brand-gold" />
            <a href={a.url} target="_blank" rel="noreferrer" className="hover:underline max-w-[180px] truncate">
              {a.name}
            </a>
            {!readOnly && (
              <button type="button" onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-brand-dark-grey hover:text-brand-red cursor-pointer">
                <FiX />
              </button>
            )}
          </span>
        ))}
        {!value.length && readOnly && <span className="text-[11px] text-brand-dark-grey">No attachments</span>}
      </div>
      {!readOnly && value.length < max && (
        <>
          <input
            ref={inputRef}
            type="file"
            hidden
            accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              e.target.value = "";
              const res = await upload(f, folder);
              if (res?.url) onChange([...value, res]);
            }}
          />
          <Btn variant="ghost" size="sm" loading={uploading} onClick={() => inputRef.current?.click()}>
            <FiPaperclip /> Attach file
          </Btn>
        </>
      )}
    </div>
  );
}

// Vertical timeline used by leave/requisition/discipline/history pages.
export function Timeline({ items }) {
  return (
    <ol className="relative border-l-2 border-brand-gold/30 ml-3 space-y-5">
      {items.map((it, i) => (
        <motion.li key={it.key || i} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }} className="ml-5">
          <span className={`absolute -left-[11px] w-5 h-5 rounded-full border-4 border-brand-white dark:border-brand-charcoal ${it.dot || "bg-brand-gold"}`} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-black text-brand-black dark:text-brand-white">{it.title}</span>
            {it.badge}
            <span className="text-[10px] text-brand-dark-grey dark:text-brand-gold-light/70 font-semibold">{it.meta}</span>
          </div>
          {it.body && <div className="mt-1 text-[12px] text-brand-dark-grey dark:text-zinc-300 font-medium leading-relaxed">{it.body}</div>}
        </motion.li>
      ))}
    </ol>
  );
}

export function Tabs({ tabs, value, onChange }) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
      {tabs.map((t) => {
        const tab = typeof t === "string" ? { value: t, label: titleCase(t) } : t;
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={`relative px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${active ? "text-brand-midnight" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"}`}
          >
            {active && <motion.span layoutId="hr-tab" className="absolute inset-0 rounded-xl bg-brand-gold shadow-xs" transition={{ type: "spring", duration: 0.35 }} />}
            <span className="relative">
              {tab.label}
              {tab.count !== undefined && <span className="ml-1.5 opacity-70">{tab.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

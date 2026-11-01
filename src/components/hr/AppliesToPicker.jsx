"use client";

import { useMemo } from "react";
import { FiX } from "react-icons/fi";
import { useHrLookups, useHrQuery } from "@/hooks/useHr";
import { Select } from "@/components/hr/HrUi";

const EMPLOYEE_TYPES = ["Full-time", "Part-time", "Contract"];
const LABELS = { designations: "Designations", branches: "Branches", roles: "Roles", employeeTypes: "Employment type" };
const ADD_LABEL = { designations: "Limit to a designation…", branches: "Limit to a branch…", roles: "Limit to a role…", employeeTypes: "Limit to an employment type…" };

/** "Everyone", or the filters in words. */
export function appliesToText(a) {
  const parts = Object.entries(LABELS)
    .filter(([k]) => a?.[k]?.length)
    .map(([k, l]) => `${l}: ${a[k].join(", ")}`);
  return parts.length ? parts.join("; ") : "Everyone";
}

// Who a payroll rule covers. Each list narrows it down; empty lists = everyone.
export default function AppliesToPicker({ value = {}, onChange, fields = ["designations", "branches", "roles", "employeeTypes"], disabled }) {
  const { branches } = useHrLookups({ employees: false });
  const positions = useHrQuery("/job-position", { limit: 200 });
  const roles = useHrQuery("/role", { limit: 200 });
  const options = useMemo(
    () => ({
      designations: (positions.data?.data || []).filter((p) => p.status !== "inactive").map((p) => p.title),
      branches,
      roles: (roles.data?.data || roles.data?.roles || [])
        .filter((r) => r.status !== "inactive" && !/^super ?admin$/i.test(r.name))
        .map((r) => r.name),
      employeeTypes: EMPLOYEE_TYPES,
    }),
    [positions.data, roles.data, branches],
  );
  const set = (k, list) => onChange({ ...value, [k]: list });

  return (
    <div className="space-y-2">
      <div className="grid sm:grid-cols-2 gap-2.5">
        {fields.map((k) => {
          const chosen = value?.[k] || [];
          const rest = (options[k] || []).filter((o) => !chosen.some((c) => c.toLowerCase() === o.toLowerCase()));
          return (
            <div key={k} className="rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey/60 p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black text-brand-black dark:text-brand-white">{LABELS[k]}</span>
                <span className={`text-[10px] font-bold ${chosen.length ? "text-brand-gold" : "text-brand-dark-grey dark:text-brand-gold-light/70"}`}>{chosen.length ? `${chosen.length} selected` : "All"}</span>
              </div>
              {chosen.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {chosen.map((c) => (
                    <span key={c} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-lg bg-brand-gold/15 border border-brand-gold/30 text-[11px] font-bold">
                      {c}
                      {!disabled && (
                        <button type="button" onClick={() => set(k, chosen.filter((x) => x !== c))} className="p-0.5 rounded hover:text-brand-red cursor-pointer" aria-label={`Remove ${c}`}>
                          <FiX />
                        </button>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {!disabled && rest.length > 0 && (
                <Select value="" onChange={(v) => v && set(k, [...chosen, v])} placeholder={ADD_LABEL[k]} options={rest} className="mt-2 !py-1.5 !text-[11px]" />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">Empty lists mean everyone. With several lists set, a person has to match all of them.</p>
    </div>
  );
}

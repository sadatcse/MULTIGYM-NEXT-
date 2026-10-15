"use client";

import { useHrLookups } from "@/hooks/useHr";
import { Attachments, EmployeePicker, Field, inputCls, Select } from "@/components/hr/HrUi";

const DOC_CATEGORIES = ["nid", "cv", "certificate", "appointment_letter", "contract", "photo", "medical", "other"];

// Extra employee-profile fields (reporting line, salary headline, device ID,
// documents) rendered inside the Employee Directory form's Work tab.
export default function EmployeeHrFields({ formData, setFormData, editingId }) {
  const { staff } = useHrLookups();
  const set = (patch) => setFormData({ ...formData, ...patch });
  const docs = formData.documents || [];

  return (
    <div className="space-y-4 p-4 rounded-2xl border border-brand-gold/30 bg-brand-gold/5">
      <h4 className="text-xs font-extrabold uppercase text-brand-gold tracking-wider">Reporting, Salary & Attendance Device</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Reporting authority">
          <EmployeePicker
            staff={staff}
            value={formData.reportingAuthority}
            filter={(e) => e._id !== editingId}
            onChange={(id, emp) => set({ reportingAuthority: id, reportingAuthorityName: emp?.name || "" })}
            placeholder={formData.reportingAuthorityName || "Select line manager"}
          />
        </Field>
        <Field label="Device user ID / PIN" hint="ID enrolled on the ZKTeco / biometric device">
          <input value={formData.deviceUserId || ""} onChange={(e) => set({ deviceUserId: e.target.value })} className={inputCls} placeholder="e.g. 105" />
        </Field>
        <Field label="Basic salary" hint="Full breakdown lives in Payroll → Salary Structures">
          <input type="number" min={0} value={formData.basicSalary ?? ""} onChange={(e) => set({ basicSalary: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputCls} />
        </Field>
        <Field label="Gross salary">
          <input type="number" min={0} value={formData.grossSalary ?? ""} onChange={(e) => set({ grossSalary: e.target.value === "" ? undefined : Number(e.target.value) })} className={inputCls} />
        </Field>
      </div>

      <Field label="Employee documents" hint="NID copy, CV, certificates, signed appointment letter…">
        <div className="space-y-2">
          {docs.map((d, i) => (
            <div key={i} className="flex flex-wrap gap-2 items-center">
              <input value={d.title} onChange={(e) => set({ documents: docs.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} className={`${inputCls} flex-1 min-w-[140px]`} />
              <Select value={d.category || "other"} onChange={(v) => set({ documents: docs.map((x, j) => (j === i ? { ...x, category: v } : x)) })} options={DOC_CATEGORIES.map((c) => ({ value: c, label: c.replace(/_/g, " ") }))} className="w-40" />
              <a href={d.url} target="_blank" rel="noreferrer" className="text-[11px] font-black text-brand-gold underline">Open</a>
              <button type="button" onClick={() => set({ documents: docs.filter((_, j) => j !== i) })} className="text-[11px] font-black text-brand-red cursor-pointer">Remove</button>
            </div>
          ))}
          <Attachments
            value={[]}
            max={1}
            folder="employee-documents"
            onChange={(added) => {
              const a = added[added.length - 1];
              if (a) set({ documents: [...docs, { title: a.name.replace(/\.[^.]+$/, ""), category: "other", url: a.url, fileName: a.name, uploadedAt: new Date().toISOString().slice(0, 10) }] });
            }}
          />
        </div>
      </Field>
      {editingId && <p className="text-[10px] text-brand-dark-grey">Changing designation, branch, salary or status is recorded automatically in Employee History.</p>}
    </div>
  );
}

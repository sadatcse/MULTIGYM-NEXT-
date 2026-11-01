"use client";

import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { toast } from "react-toastify";
import { FiArrowDown, FiArrowUp, FiEye, FiPlus, FiRotateCcw, FiSave, FiTrash2 } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { errMsg } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Field, Loading, PageHeader, SearchBox, Select, Tabs, inputCls, pageCls } from "@/components/hr/HrUi";
import LetterPreviewModal from "@/components/modals/letters/LetterPreviewModal";
import { letterTypeMeta } from "@/components/letters/letterConstants";

const FIELD_TYPES = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "date", label: "Date" },
  { value: "money", label: "Amount (money)" },
  { value: "percent", label: "Percentage" },
  { value: "number", label: "Number" },
];
const EMPLOYEE_FIELDS = [
  { value: "name", label: "Name" },
  { value: "employeeId", label: "Employee ID" },
  { value: "jobPosition", label: "Designation" },
  { value: "department", label: "Department" },
  { value: "branches", label: "Branch" },
  { value: "joiningDate", label: "Joining date" },
  { value: "mobileNumber", label: "Mobile number" },
  { value: "nidPassport", label: "NID / passport" },
  { value: "dateOfBirth", label: "Date of birth" },
];
const BASE_VARS = ["employeeName", "employeeId", "designation", "department", "branch", "letterNumber", "letterDate", "effectiveDate", "companyName"];
const TABS = [
  { value: "basics", label: "Basics" },
  { value: "fields", label: "Information fields" },
  { value: "sections", label: "Sections & clauses" },
  { value: "signatures", label: "Signatures" },
];

const toForm = (t) => ({
  name: t.name || "",
  titleBangla: t.titleBangla || "",
  titleEnglish: t.titleEnglish || "",
  memoPrefix: t.memoPrefix || "",
  subjectTemplate: t.subjectTemplate || "",
  hasEmployeeAcknowledgment: t.hasEmployeeAcknowledgment !== false,
  status: t.status || "active",
  infoFields: (t.infoFields || []).map((f) => ({ key: f.key, labelBangla: f.labelBangla || "", labelEnglish: f.labelEnglish || "", source: f.source || "custom", employeeField: f.employeeField || "", required: !!f.required, defaultValue: f.defaultValue || "", type: f.type || "text" })),
  sections: (t.sections || []).map((s) => ({ sectionNumber: s.sectionNumber || "", titleBangla: s.titleBangla || "", titleEnglish: s.titleEnglish || "", introText: s.introText || "", clausesText: (s.clauses || []).join("\n") })),
  defaultSignatories: {
    issuedBy: { name: "", designation: "", title: "", ...(t.defaultSignatories?.issuedBy || {}) },
    approvedBy: { name: "", designation: "", company: "", onBehalfOf: "", ...(t.defaultSignatories?.approvedBy || {}) },
    copyText: (t.defaultSignatories?.copyTo || []).join("\n"),
  },
});

// Form → API body (drops UI-only helpers, trims, removes empty optionals).
const toDto = (f) => ({
  name: f.name.trim(),
  titleBangla: f.titleBangla.trim(),
  titleEnglish: f.titleEnglish.trim(),
  memoPrefix: f.memoPrefix.trim(),
  subjectTemplate: f.subjectTemplate.trim(),
  hasEmployeeAcknowledgment: f.hasEmployeeAcknowledgment,
  status: f.status,
  infoFields: f.infoFields.map((x) => ({
    key: x.key.trim(),
    labelBangla: x.labelBangla.trim(),
    ...(x.labelEnglish.trim() ? { labelEnglish: x.labelEnglish.trim() } : {}),
    source: x.source,
    ...(x.source === "employee" && x.employeeField ? { employeeField: x.employeeField } : {}),
    required: x.required,
    ...(x.defaultValue.trim() ? { defaultValue: x.defaultValue.trim() } : {}),
    type: x.type,
  })),
  sections: f.sections.map((s) => ({
    sectionNumber: s.sectionNumber.trim(),
    titleBangla: s.titleBangla.trim(),
    ...(s.titleEnglish.trim() ? { titleEnglish: s.titleEnglish.trim() } : {}),
    ...(s.introText.trim() ? { introText: s.introText.trim() } : {}),
    clauses: s.clausesText.split("\n").map((c) => c.trim()).filter(Boolean),
  })),
  defaultSignatories: {
    issuedBy: f.defaultSignatories.issuedBy,
    approvedBy: f.defaultSignatories.approvedBy,
    copyTo: f.defaultSignatories.copyText.split("\n").map((c) => c.trim()).filter(Boolean),
  },
});

const move = (arr, i, d) => {
  const j = i + d;
  if (j < 0 || j >= arr.length) return arr;
  const next = [...arr];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
};

export default function LetterTemplatesPage() {
  const { can } = useUserPermissions();
  const canEdit = can("hr-letters", "edit");
  const actions = useHrLetterActions();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [savedJson, setSavedJson] = useState("");
  const [tab, setTab] = useState("basics");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState(null);
  const [previewing, setPreviewing] = useState(false);

  const selected = templates.find((t) => t._id === selectedId) || null;
  const dirty = form && JSON.stringify(form) !== savedJson;

  const openTemplate = (t) => {
    const f = toForm(t);
    setSelectedId(t._id);
    setForm(f);
    setSavedJson(JSON.stringify(f));
  };

  useEffect(() => {
    actions
      .fetchTemplates()
      .then((list) => {
        setTemplates(list);
        if (list[0]) openTemplate(list[0]);
      })
      .catch((e) => setLoadError(errMsg(e, "Could not load templates")))
      .finally(() => setLoading(false));
     
  }, [actions]);

  const choose = async (t) => {
    if (t._id === selectedId) return;
    if (dirty) {
      const ok = await Swal.fire({ title: "Discard unsaved changes?", icon: "warning", showCancelButton: true, confirmButtonText: "Discard", confirmButtonColor: "#FF1818" });
      if (!ok.isConfirmed) return;
    }
    openTemplate(t);
  };

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setFieldAt = (i, patch) => setForm((f) => ({ ...f, infoFields: f.infoFields.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const setSectionAt = (i, patch) => setForm((f) => ({ ...f, sections: f.sections.map((x, j) => (j === i ? { ...x, ...patch } : x)) }));
  const setSig = (who, key, v) => setForm((f) => ({ ...f, defaultSignatories: { ...f.defaultSignatories, [who]: { ...f.defaultSignatories[who], [key]: v } } }));

  const validate = () => {
    if (!form.titleBangla.trim()) return "Bangla title is required";
    if (!form.subjectTemplate.trim()) return "Subject is required";
    if (!/^[A-Za-z0-9][A-Za-z0-9/_-]{1,39}$/.test(form.memoPrefix.trim())) return "Memo prefix may use letters, numbers, / _ - (e.g. MGP/HR/APT)";
    const keys = form.infoFields.map((x) => x.key.trim());
    if (keys.some((k) => !/^[a-zA-Z][a-zA-Z0-9_]{0,40}$/.test(k))) return "Each field key must start with a letter and use only letters, numbers or _";
    if (new Set(keys).size !== keys.length) return "Two information fields use the same key";
    if (form.infoFields.some((x) => !x.labelBangla.trim())) return "Every information field needs a label";
    if (form.sections.some((s) => !s.titleBangla.trim())) return "Every section needs a title";
    return "";
  };

  const save = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setSaving(true);
    try {
      const res = await actions.updateTemplate(selectedId, toDto(form));
      const updated = res?.data;
      setTemplates((list) => list.map((t) => (t._id === selectedId ? updated : t)));
      openTemplate(updated);
      toast.success("Template saved. New letters will use this wording.");
    } catch (e) {
      toast.error(errMsg(e, "Could not save the template"));
    } finally {
      setSaving(false);
    }
  };

  const reset = async () => {
    const ok = await Swal.fire({
      title: "Restore the built-in wording?",
      text: "All edits to this template (fields, clauses, signatures) are replaced by the original version. Letters already issued are not affected.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Restore default",
      confirmButtonColor: "#FF1818",
    });
    if (!ok.isConfirmed) return;
    setSaving(true);
    try {
      const res = await actions.resetTemplate(selectedId);
      setTemplates((list) => list.map((t) => (t._id === selectedId ? res.data : t)));
      openTemplate(res.data);
      toast.success("Template restored");
    } catch (e) {
      toast.error(errMsg(e, "Could not restore the template"));
    } finally {
      setSaving(false);
    }
  };

  const showPreview = async () => {
    const problem = validate();
    if (problem) return toast.error(problem);
    setPreviewing(true);
    try {
      setPreview(await actions.previewTemplate(selectedId, toDto(form)));
    } catch (e) {
      toast.error(errMsg(e, "Preview failed"));
    } finally {
      setPreviewing(false);
    }
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return q ? templates.filter((t) => `${t.titleBangla} ${t.titleEnglish} ${t.name} ${t.memoPrefix}`.toLowerCase().includes(q)) : templates;
  }, [templates, search]);

  const vars = form ? [...new Set([...BASE_VARS, ...form.infoFields.map((f) => f.key).filter(Boolean)])] : BASE_VARS;
  const ro = !canEdit;

  return (
    <div className={pageCls}>
      <PageHeader
        title="Letter Templates"
        subtitle="Edit the wording, information fields, numbering and signatures used for each official letter. Issued letters never change."
        actions={
          form && (
            <>
              <Btn variant="ghost" onClick={showPreview} loading={previewing}>
                <FiEye /> Preview
              </Btn>
              {canEdit && (
                <>
                  <Btn variant="ghost" onClick={reset} disabled={saving}>
                    <FiRotateCcw /> Reset to default
                  </Btn>
                  <Btn onClick={save} loading={saving} disabled={!dirty}>
                    <FiSave /> {dirty ? "Save changes" : "Saved"}
                  </Btn>
                </>
              )}
            </>
          )
        }
      />

      {loading ? (
        <Loading rows={8} />
      ) : loadError ? (
        <EmptyState title="Templates unavailable" text={loadError} />
      ) : (
        <div className="grid lg:grid-cols-[300px_minmax(0,1fr)] gap-6 items-start">
          <Card title={`${templates.length} letter templates`} bodyClassName="p-3 space-y-2 lg:max-h-[75vh] lg:overflow-y-auto">
            <SearchBox value={search} onChange={setSearch} placeholder="Find a template…" className="mb-1" />
            {visible.map((t) => {
              const meta = letterTypeMeta(t.letterType);
              const Icon = meta.icon;
              const active = t._id === selectedId;
              return (
                <button
                  key={t._id}
                  type="button"
                  onClick={() => choose(t)}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${active ? "border-brand-gold bg-brand-gold/10" : "border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold/60"}`}
                >
                  <span className="w-8 h-8 rounded-xl bg-brand-offwhite dark:bg-brand-midnight flex items-center justify-center text-brand-gold shrink-0">
                    <Icon />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs font-black text-brand-black dark:text-brand-white truncate">{t.titleBangla}</span>
                    <span className="block text-[10px] text-brand-dark-grey dark:text-brand-gold-light truncate">
                      {t.titleEnglish} · <span className="font-mono">{t.memoPrefix}</span>
                    </span>
                  </span>
                  {t.status === "inactive" && <Badge tone="slate">Off</Badge>}
                </button>
              );
            })}
          </Card>

          {form && selected && (
            <Card
              title={
                <span className="flex flex-wrap items-center gap-2">
                  {form.titleBangla || selected.titleBangla}
                  {dirty && <Badge tone="amber">Unsaved</Badge>}
                  {ro && <Badge tone="slate">Read only</Badge>}
                </span>
              }
              subtitle={`${selected.titleEnglish || ""} · ${form.infoFields.length} fields · ${form.sections.length} sections`}
              actions={<Tabs tabs={TABS} value={tab} onChange={setTab} />}
            >
              <fieldset disabled={ro} className="space-y-5">
                {tab === "basics" && (
                  <>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Title (Bangla)" required><input value={form.titleBangla} onChange={(e) => set({ titleBangla: e.target.value })} className={inputCls} /></Field>
                      <Field label="Title (English)"><input value={form.titleEnglish} onChange={(e) => set({ titleEnglish: e.target.value })} className={inputCls} /></Field>
                      <Field label="Template name" hint="Shown in HR only"><input value={form.name} onChange={(e) => set({ name: e.target.value })} className={inputCls} /></Field>
                      <Field label="Memo number prefix" required hint={`Letters are numbered ${form.memoPrefix || "PREFIX"}/${new Date().getFullYear()}/0001, 0002 …`}>
                        <input value={form.memoPrefix} onChange={(e) => set({ memoPrefix: e.target.value.toUpperCase() })} className={`${inputCls} font-mono`} />
                      </Field>
                    </div>
                    <Field label="Subject line" required>
                      <input value={form.subjectTemplate} onChange={(e) => set({ subjectTemplate: e.target.value })} className={inputCls} />
                    </Field>
                    <div className="p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50">
                      <p className="text-[11px] font-bold text-brand-dark-grey dark:text-brand-gold-light mb-2">
                        Placeholders you can use in the subject and in any clause (click to copy):
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {vars.map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => navigator.clipboard?.writeText(`{{${v}}}`).then(() => toast.success(`Copied {{${v}}}`))}
                            className="px-2 py-1 rounded-lg bg-brand-gold/10 text-brand-gold text-[10px] font-mono font-bold hover:bg-brand-gold hover:text-brand-midnight transition-colors cursor-pointer"
                          >
                            {`{{${v}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <label className="flex items-center gap-3 p-3 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 cursor-pointer">
                        <input type="checkbox" checked={form.hasEmployeeAcknowledgment} onChange={(e) => set({ hasEmployeeAcknowledgment: e.target.checked })} className="w-4 h-4 accent-brand-gold" />
                        <span className="text-xs font-bold text-brand-black dark:text-brand-white">
                          Employee acknowledgement box
                          <span className="block text-[10px] font-medium text-brand-dark-grey dark:text-brand-gold-light">Signature, name, ID and date at the end</span>
                        </span>
                      </label>
                      <Field label="Status">
                        <Select value={form.status} onChange={(v) => set({ status: v })} options={[{ value: "active", label: "Active" }, { value: "inactive", label: "Inactive" }]} />
                      </Field>
                    </div>
                  </>
                )}

                {tab === "fields" && (
                  <>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">
                      These rows make up the “প্রয়োজনীয় তথ্য বিবরণী” table. Profile fields fill in from the employee record; letter fields are typed in when creating the letter.
                    </p>
                    {form.infoFields.map((f, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/50 dark:bg-brand-midnight/50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Row {i + 1}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" title="Move up" onClick={() => set({ infoFields: move(form.infoFields, i, -1) })} className="p-1.5 rounded-lg hover:bg-brand-gold/10 cursor-pointer"><FiArrowUp /></button>
                            <button type="button" title="Move down" onClick={() => set({ infoFields: move(form.infoFields, i, 1) })} className="p-1.5 rounded-lg hover:bg-brand-gold/10 cursor-pointer"><FiArrowDown /></button>
                            <button type="button" title="Remove" onClick={() => set({ infoFields: form.infoFields.filter((_, j) => j !== i) })} className="p-1.5 rounded-lg text-brand-red hover:bg-brand-red/10 cursor-pointer"><FiTrash2 /></button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                          <Field label="Label (Bangla)" required><input value={f.labelBangla} onChange={(e) => setFieldAt(i, { labelBangla: e.target.value })} className={inputCls} /></Field>
                          <Field label="Label (English)"><input value={f.labelEnglish} onChange={(e) => setFieldAt(i, { labelEnglish: e.target.value })} className={inputCls} /></Field>
                          <Field label="Key" hint="Used as {{key}}"><input value={f.key} onChange={(e) => setFieldAt(i, { key: e.target.value.replace(/\s/g, "") })} className={`${inputCls} font-mono`} /></Field>
                          <Field label="Comes from">
                            <Select value={f.source} onChange={(v) => setFieldAt(i, { source: v })} options={[{ value: "custom", label: "Typed in the letter" }, { value: "employee", label: "Employee profile" }]} />
                          </Field>
                          {f.source === "employee" ? (
                            <Field label="Profile field">
                              <Select value={f.employeeField} onChange={(v) => setFieldAt(i, { employeeField: v })} placeholder="Choose…" options={EMPLOYEE_FIELDS} />
                            </Field>
                          ) : (
                            <Field label="Input type">
                              <Select value={f.type} onChange={(v) => setFieldAt(i, { type: v })} options={FIELD_TYPES} />
                            </Field>
                          )}
                          <Field label="Default value"><input value={f.defaultValue} onChange={(e) => setFieldAt(i, { defaultValue: e.target.value })} className={inputCls} /></Field>
                        </div>
                        <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                          <input type="checkbox" checked={f.required} onChange={(e) => setFieldAt(i, { required: e.target.checked })} className="w-4 h-4 accent-brand-gold" /> Required
                        </label>
                      </div>
                    ))}
                    {canEdit && (
                      <Btn variant="ghost" onClick={() => set({ infoFields: [...form.infoFields, { key: `field${form.infoFields.length + 1}`, labelBangla: "", labelEnglish: "", source: "custom", employeeField: "", required: false, defaultValue: "", type: "text" }] })}>
                        <FiPlus /> Add field
                      </Btn>
                    )}
                  </>
                )}

                {tab === "sections" && (
                  <>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">Section ১ is always the information table. Write one clause per line, e.g. “(ক) …”.</p>
                    {form.sections.map((s, i) => (
                      <div key={i} className="p-4 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/50 dark:bg-brand-midnight/50 space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Section {s.sectionNumber || i + 2}</span>
                          <div className="flex items-center gap-1">
                            <button type="button" title="Move up" onClick={() => set({ sections: move(form.sections, i, -1) })} className="p-1.5 rounded-lg hover:bg-brand-gold/10 cursor-pointer"><FiArrowUp /></button>
                            <button type="button" title="Move down" onClick={() => set({ sections: move(form.sections, i, 1) })} className="p-1.5 rounded-lg hover:bg-brand-gold/10 cursor-pointer"><FiArrowDown /></button>
                            <button type="button" title="Remove" onClick={() => set({ sections: form.sections.filter((_, j) => j !== i) })} className="p-1.5 rounded-lg text-brand-red hover:bg-brand-red/10 cursor-pointer"><FiTrash2 /></button>
                          </div>
                        </div>
                        <div className="grid sm:grid-cols-[90px_minmax(0,1fr)_minmax(0,1fr)] gap-3">
                          <Field label="No."><input value={s.sectionNumber} onChange={(e) => setSectionAt(i, { sectionNumber: e.target.value })} className={inputCls} /></Field>
                          <Field label="Title (Bangla)" required><input value={s.titleBangla} onChange={(e) => setSectionAt(i, { titleBangla: e.target.value })} className={inputCls} /></Field>
                          <Field label="Title (English)"><input value={s.titleEnglish} onChange={(e) => setSectionAt(i, { titleEnglish: e.target.value })} className={inputCls} /></Field>
                        </div>
                        <Field label="Opening paragraph">
                          <textarea rows={3} value={s.introText} onChange={(e) => setSectionAt(i, { introText: e.target.value })} className={`${inputCls} resize-y`} />
                        </Field>
                        <Field label={`Clauses (${s.clausesText.split("\n").filter((c) => c.trim()).length})`} hint="One clause per line">
                          <textarea rows={Math.min(12, Math.max(3, s.clausesText.split("\n").length + 1))} value={s.clausesText} onChange={(e) => setSectionAt(i, { clausesText: e.target.value })} className={`${inputCls} resize-y leading-relaxed`} />
                        </Field>
                      </div>
                    ))}
                    {canEdit && (
                      <Btn variant="ghost" onClick={() => set({ sections: [...form.sections, { sectionNumber: "", titleBangla: "", titleEnglish: "", introText: "", clausesText: "" }] })}>
                        <FiPlus /> Add section
                      </Btn>
                    )}
                  </>
                )}

                {tab === "signatures" && (
                  <>
                    <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">Defaults for new letters of this type — they can still be changed on each letter.</p>
                    <div className="grid md:grid-cols-2 gap-5">
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Left — issued by</h5>
                        <Field label="Name"><input value={form.defaultSignatories.issuedBy.name} onChange={(e) => setSig("issuedBy", "name", e.target.value)} className={inputCls} /></Field>
                        <Field label="Designation"><input value={form.defaultSignatories.issuedBy.designation} onChange={(e) => setSig("issuedBy", "designation", e.target.value)} className={inputCls} /></Field>
                        <Field label="Second line"><input value={form.defaultSignatories.issuedBy.title} onChange={(e) => setSig("issuedBy", "title", e.target.value)} className={inputCls} /></Field>
                      </div>
                      <div className="space-y-3">
                        <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Right — approved by</h5>
                        <Field label="Name"><input value={form.defaultSignatories.approvedBy.name} onChange={(e) => setSig("approvedBy", "name", e.target.value)} className={inputCls} /></Field>
                        <Field label="Designation"><input value={form.defaultSignatories.approvedBy.designation} onChange={(e) => setSig("approvedBy", "designation", e.target.value)} className={inputCls} /></Field>
                        <Field label="Company"><input value={form.defaultSignatories.approvedBy.company} onChange={(e) => setSig("approvedBy", "company", e.target.value)} className={inputCls} /></Field>
                        <Field label="On behalf of"><input value={form.defaultSignatories.approvedBy.onBehalfOf} onChange={(e) => setSig("approvedBy", "onBehalfOf", e.target.value)} className={inputCls} /></Field>
                      </div>
                    </div>
                    <Field label="Copy to (one per line)">
                      <textarea rows={5} value={form.defaultSignatories.copyText} onChange={(e) => setForm((f) => ({ ...f, defaultSignatories: { ...f.defaultSignatories, copyText: e.target.value } }))} className={`${inputCls} resize-y`} />
                    </Field>
                  </>
                )}
              </fieldset>
            </Card>
          )}
        </div>
      )}

      <LetterPreviewModal isOpen={!!preview} onClose={() => setPreview(null)} snapshot={preview} status="preview" title={`${form?.titleBangla || "Template"} — sample`} subtitle="Sample employee and values — for checking layout and wording" />
    </div>
  );
}

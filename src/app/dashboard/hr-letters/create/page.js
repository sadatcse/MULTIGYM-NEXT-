"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "react-toastify";
import { FiArrowLeft, FiArrowRight, FiCheck, FiChevronDown, FiEye, FiEdit3, FiLoader, FiSave, FiSend, FiUser, FiUsers } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import { useHrLookups, errMsg, todayISO } from "@/hooks/useHr";
import useUserPermissions from "@/hooks/useUserPermissions";
import useSystemTimeZone from "@/hooks/useSystemTimeZone";
import { Avatar, Btn, Card, EmptyState, Field, Loading, PageHeader, SearchBox, Select, inputCls, pageCls } from "@/components/hr/HrUi";
import LetterViewer from "@/components/letters/LetterViewer";
import LetterFieldInput, { missingRequired } from "@/components/letters/LetterFieldInput";
import { LETTER_GROUPS, LETTER_TYPES, letterTypeMeta } from "@/components/letters/letterConstants";

const TONE_TEXT = { green: "text-emerald-500", blue: "text-blue-500", amber: "text-amber-500", red: "text-rose-500", purple: "text-purple-500", cyan: "text-cyan-500", gold: "text-brand-gold", slate: "text-zinc-500" };
const EMPTY_SIGNATORIES = { issuedBy: { name: "", designation: "", title: "" }, approvedBy: { name: "", designation: "", company: "", onBehalfOf: "" }, copyTo: [] };

export default function CreateHrLetterPage() {
  return (
    <Suspense fallback={<Loading rows={6} />}>
      <CreateHrLetter />
    </Suspense>
  );
}

function CreateHrLetter() {
  const router = useRouter();
  const params = useSearchParams();
  const draftId = params.get("draftId");
  const { can } = useUserPermissions();
  const { settings } = useSystemTimeZone();
  const currency = settings?.currencySymbol || "৳";
  const actions = useHrLetterActions();
  const { staff, branches } = useHrLookups();

  const [step, setStep] = useState(draftId ? 3 : 1);
  const [employee, setEmployee] = useState(null);
  const [letterType, setLetterType] = useState(params.get("type") || "");
  const [template, setTemplate] = useState(null);
  const [letterDate, setLetterDate] = useState(todayISO());
  const [effectiveDate, setEffectiveDate] = useState(todayISO());
  const [branch, setBranch] = useState("");
  const [values, setValues] = useState({});
  const [signatories, setSignatories] = useState(EMPTY_SIGNATORIES);
  const [remarks, setRemarks] = useState("");
  const [errors, setErrors] = useState({});
  const [empSearch, setEmpSearch] = useState("");
  const [draft, setDraft] = useState(null);
  const [loadingDraft, setLoadingDraft] = useState(!!draftId);
  const [submitting, setSubmitting] = useState(null); // "draft" | "issue"
  const [dirty, setDirty] = useState(false);
  const [mobileView, setMobileView] = useState("form");
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [showSignatories, setShowSignatories] = useState(false);
  const [preview, setPreview] = useState({ snapshot: null, loading: false, error: "" });
  const submitLock = useRef(false);
  const previewAbort = useRef(null);

  // ---- Load a saved draft --------------------------------------------------
  useEffect(() => {
    if (!draftId) return;
    let alive = true;
    actions
      .getLetterById(draftId)
      .then((d) => {
        const l = d?.letter;
        if (!alive || !l) return;
        if (l.status !== "draft") {
          router.replace(`/dashboard/hr-letters/${l._id}`);
          return;
        }
        setDraft(l);
        setEmployee({ _id: l.employeeId, name: l.employeeName, employeeId: l.employeeCode, photo: l.employeePhoto, jobPosition: l.designation, department: l.department, branches: l.branch ? [l.branch] : [] });
        setLetterType(l.letterType);
        setLetterDate(l.letterDate || todayISO());
        setEffectiveDate(l.effectiveDate || l.letterDate || todayISO());
        setBranch(l.branch || "");
        setValues({ ...(l.inputData || {}) });
        setSignatories({ ...EMPTY_SIGNATORIES, ...(l.contentSnapshot?.signatories || {}) });
        setRemarks(l.remarks || "");
      })
      .catch((e) => toast.error(errMsg(e, "Could not open the draft")))
      .finally(() => alive && setLoadingDraft(false));
    return () => {
      alive = false;
    };
  }, [draftId, actions, router]);

  // ---- Pre-select employee from ?employeeId= (employee profile, discipline) --
  useEffect(() => {
    const id = params.get("employeeId");
    if (!id || employee || draftId || !staff.length) return;
    const match = staff.find((e) => e._id === id);
    if (match) {
       
      setEmployee(match);
      setBranch(match.branches?.[0] || "");
      setStep(letterType ? 3 : 2);
    }
  }, [params, staff, employee, draftId, letterType]);

  // ---- Template for the chosen type ----------------------------------------
  useEffect(() => {
    if (!letterType) return;
    let alive = true;
    actions
      .getTemplateForType(letterType)
      .then((tpl) => {
        if (!alive) return;
        setTemplate(tpl);
        if (draftId) return; // keep the draft's own values
        // Fresh letter: pre-fill defaults and the template's signatories.
        setValues((prev) => {
          const next = {};
          for (const f of tpl?.infoFields || []) {
            if (prev[f.key] !== undefined && prev[f.key] !== "") next[f.key] = prev[f.key];
            else if (f.source !== "employee" && f.defaultValue) next[f.key] = f.defaultValue;
          }
          return next;
        });
        const d = tpl?.defaultSignatories || {};
        setSignatories({
          issuedBy: { ...EMPTY_SIGNATORIES.issuedBy, ...(d.issuedBy || {}) },
          approvedBy: { ...EMPTY_SIGNATORIES.approvedBy, ...(d.approvedBy || {}) },
          copyTo: d.copyTo || [],
        });
      })
      .catch((e) => toast.error(errMsg(e, "Could not load the letter template")));
    return () => {
      alive = false;
    };
  }, [letterType, actions, draftId]);

  // ---- Warn before leaving with unsaved changes -----------------------------
  useEffect(() => {
    if (!dirty) return undefined;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const fields = useMemo(() => template?.infoFields || [], [template]);
  const customFields = fields.filter((f) => f.source !== "employee");
  const profileFields = fields.filter((f) => f.source === "employee");
  const hasEffectiveField = fields.some((f) => f.key === "effectiveDate");
  const branchOptions = branches.length ? branches : employee?.branches || [];
  const designations = useMemo(() => [...new Set(staff.map((s) => s.jobPosition).filter(Boolean))].sort(), [staff]);

  const suggestionsFor = (key) => (/branch/i.test(key) ? branchOptions : /designation/i.test(key) ? designations : undefined);
  const profileHint = (f) => {
    if (!employee || !f.employeeField) return "";
    const v = employee[f.employeeField];
    return Array.isArray(v) ? v.join(", ") : v || "";
  };

  const setValue = (key, v) => {
    setValues((p) => ({ ...p, [key]: v }));
    setErrors((p) => ({ ...p, [key]: undefined }));
    setDirty(true);
  };
  const setSig = (who, key, v) => {
    setSignatories((p) => ({ ...p, [who]: { ...p[who], [key]: v } }));
    setDirty(true);
  };

  const buildDto = () => ({
    employeeId: employee?._id,
    letterType,
    templateId: template?._id,
    letterDate,
    effectiveDate: (hasEffectiveField ? values.effectiveDate : effectiveDate) || letterDate,
    branch,
    inputData: Object.fromEntries(Object.entries(values).filter(([, v]) => v !== undefined && v !== null && String(v).trim() !== "")),
    remarks,
    customSignatories: { ...signatories, copyTo: (signatories.copyTo || []).map((c) => c.trim()).filter(Boolean) },
  });

  // ---- Live preview (rendered by the server, debounced) ---------------------
  const previewKey = JSON.stringify(step === 3 && employee && template ? buildDto() : null);
  useEffect(() => {
    if (previewKey === "null") return undefined;
    const t = setTimeout(async () => {
      previewAbort.current?.abort();
      const controller = new AbortController();
      previewAbort.current = controller;
      setPreview((p) => ({ ...p, loading: true, error: "" }));
      try {
        const data = await actions.previewLetter({ ...JSON.parse(previewKey), draftId: draft?._id }, { signal: controller.signal });
        setPreview({ snapshot: data?.snapshot || null, loading: false, error: "" });
      } catch (e) {
        if (e?.code === "ERR_CANCELED") return;
        setPreview((p) => ({ ...p, loading: false, error: errMsg(e, "Preview unavailable") }));
      }
    }, 600);
    return () => clearTimeout(t);
  }, [previewKey, actions, draft?._id]);

  // ---- Employee search -------------------------------------------------------
  const employeeResults = useMemo(() => {
    const q = empSearch.trim().toLowerCase();
    const list = q
      ? staff.filter((e) => `${e.name} ${e.employeeId || ""} ${e.jobPosition || ""} ${e.department || ""} ${(e.branches || []).join(" ")}`.toLowerCase().includes(q))
      : staff;
    return list.slice(0, 30);
  }, [staff, empSearch]);

  const chooseEmployee = (e) => {
    setEmployee(e);
    setBranch(e.branches?.[0] || "");
    setDirty(true);
    setStep(letterType ? 3 : 2);
  };
  const chooseType = (key) => {
    setLetterType(key);
    setErrors({});
    setDirty(true);
    setStep(3);
  };

  // ---- Save / issue ----------------------------------------------------------
  const submit = async (kind) => {
    if (submitLock.current) return;
    if (!employee || !template) return;
    if (kind === "issue") {
      const missing = missingRequired(customFields, values);
      if (!letterDate) missing.letterDate = "Required";
      setErrors(missing);
      if (Object.keys(missing).length) {
        setMobileView("form");
        toast.error("Please fill the required fields marked in red.");
        return;
      }
    }
    submitLock.current = true;
    setSubmitting(kind);
    try {
      const dto = buildDto();
      let letter;
      if (draft) {
        letter = (await actions.updateDraft(draft._id, dto))?.data;
        if (kind === "issue") letter = (await actions.issueDraft(draft._id))?.data;
      } else {
        letter = (await actions.createLetter({ ...dto, status: kind === "issue" ? "generated" : "draft" }))?.data;
      }
      setDirty(false);
      if (kind === "issue") {
        toast.success(`Letter ${letter?.letterNumber || ""} issued`);
        router.replace(`/dashboard/hr-letters/${letter?._id}`);
      } else {
        toast.success("Draft saved");
        if (!draft && letter?._id) {
          setDraft(letter);
          router.replace(`/dashboard/hr-letters/create?draftId=${letter._id}`, { scroll: false });
        }
      }
    } catch (e) {
      toast.error(errMsg(e, kind === "issue" ? "Could not issue the letter" : "Could not save the draft"));
    } finally {
      submitLock.current = false;
      setSubmitting(null);
    }
  };

  if (!can("hr-letters", "add") && !can("hr-letters", "edit")) {
    return (
      <div className={pageCls}>
        <PageHeader title="Create HR letter" />
        <EmptyState title="Access restricted" text="You don't have permission to create HR letters." />
      </div>
    );
  }
  if (loadingDraft) return <Loading rows={8} />;

  const typeMeta = letterType ? letterTypeMeta(letterType) : null;
  const steps = [
    { n: 1, label: "Employee", value: employee?.name },
    { n: 2, label: "Letter type", value: typeMeta?.titleEnglish },
    { n: 3, label: "Details & preview", value: draft ? "Draft" : "" },
  ];

  return (
    <div className={pageCls}>
      <PageHeader
        title={draft ? "Edit draft letter" : "Create HR letter"}
        subtitle="Pick the employee and letter type, fill in the details, check the live preview, then issue."
        actions={
          <Link href="/dashboard/hr-letters">
            <Btn variant="ghost">
              <FiArrowLeft /> All letters
            </Btn>
          </Link>
        }
      />

      {/* Stepper */}
      <div className="grid grid-cols-3 gap-2 bg-brand-white dark:bg-brand-charcoal p-2 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-sm">
        {steps.map((s) => {
          const enabled = s.n === 1 ? !draft : s.n === 2 ? !!employee && !draft : !!employee && !!letterType;
          const active = step === s.n;
          const done = step > s.n || (s.n === 1 && employee) || (s.n === 2 && letterType);
          return (
            <button
              key={s.n}
              type="button"
              disabled={!enabled}
              onClick={() => setStep(s.n)}
              className={`flex items-center gap-2.5 p-2.5 rounded-2xl text-left transition-all cursor-pointer disabled:cursor-not-allowed min-w-0 ${
                active ? "bg-brand-gold text-brand-midnight" : done ? "text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10" : "text-brand-dark-grey dark:text-brand-gold-light opacity-60"
              }`}
            >
              <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black shrink-0 ${active ? "bg-brand-midnight text-brand-gold" : done ? "bg-emerald-500 text-white" : "border border-current"}`}>
                {done && !active ? <FiCheck /> : s.n}
              </span>
              <span className="min-w-0 hidden sm:block">
                <span className="block text-[10px] font-black uppercase tracking-wider">{s.label}</span>
                <span className="block text-xs font-bold truncate">{s.value || "—"}</span>
              </span>
              <span className="sm:hidden text-[11px] font-black truncate">{s.label}</span>
            </button>
          );
        })}
      </div>

      {/* Selected employee strip */}
      {employee && step !== 1 && (
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-3xl bg-brand-gold/5 border border-brand-gold/25">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar name={employee.name} photo={employee.photo} size={42} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-black text-sm text-brand-black dark:text-brand-white truncate">{employee.name}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-brand-gold/15 text-brand-gold">{employee.employeeId || "—"}</span>
              </div>
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light truncate">
                {[employee.jobPosition, employee.department, employee.branches?.join(", ")].filter(Boolean).join(" · ")}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {typeMeta && (
              <span className="px-3 py-1 rounded-full text-[11px] font-black bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey/50">
                {typeMeta.titleBangla}
              </span>
            )}
            {!draft && (
              <button type="button" onClick={() => setStep(1)} className="text-[11px] font-bold text-brand-red hover:underline cursor-pointer">
                Change
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 1 — employee */}
      {step === 1 && (
        <Card title="Who is this letter for?" subtitle="Search by name, employee ID, designation, department or branch.">
          <SearchBox value={empSearch} onChange={setEmpSearch} placeholder="Start typing a name or ID…" className="mb-4" />
          {!staff.length ? (
            <Loading rows={4} />
          ) : employeeResults.length === 0 ? (
            <EmptyState icon={<FiUsers />} title="No matching employee" text="Check the spelling or search by employee ID." />
          ) : (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {employeeResults.map((e) => (
                  <button
                    key={e._id}
                    type="button"
                    onClick={() => chooseEmployee(e)}
                    className={`p-3.5 rounded-2xl border text-left flex items-center gap-3 transition-all cursor-pointer ${
                      employee?._id === e._id ? "border-brand-gold bg-brand-gold/10" : "border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/50 dark:bg-brand-midnight/50 hover:border-brand-gold/60"
                    }`}
                  >
                    <Avatar name={e.name} photo={e.photo} size={40} />
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-black text-brand-black dark:text-brand-white truncate">{e.name}</span>
                      <span className="block text-[10px] font-bold text-brand-gold uppercase tracking-wider">{e.employeeId || "—"}</span>
                      <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light/80 truncate">{[e.jobPosition, e.branches?.[0]].filter(Boolean).join(" · ")}</span>
                    </span>
                    <FiArrowRight className="text-brand-dark-grey shrink-0" />
                  </button>
                ))}
              </div>
              {!empSearch && staff.length > employeeResults.length && (
                <p className="mt-3 text-[11px] text-brand-dark-grey dark:text-brand-gold-light">Showing 30 of {staff.length} employees — type to find others.</p>
              )}
            </>
          )}
        </Card>
      )}

      {/* STEP 2 — letter type */}
      {step === 2 && (
        <Card title="Which letter do you need?" actions={<Btn variant="ghost" size="sm" onClick={() => setStep(1)}><FiArrowLeft /> Back</Btn>}>
          <div className="space-y-6">
            {LETTER_GROUPS.map((g) => (
              <div key={g.key}>
                <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold mb-2.5">{g.label}</h4>
                <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {LETTER_TYPES.filter((t) => t.group === g.key).map((t) => {
                    const Icon = t.icon;
                    const active = letterType === t.key;
                    return (
                      <button
                        key={t.key}
                        type="button"
                        onClick={() => chooseType(t.key)}
                        className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all cursor-pointer group ${
                          active ? "border-brand-gold bg-brand-gold/10 ring-2 ring-brand-gold/25" : "border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/50 dark:bg-brand-midnight/50 hover:border-brand-gold/60"
                        }`}
                      >
                        <span className={`w-10 h-10 rounded-xl bg-brand-white dark:bg-brand-charcoal flex items-center justify-center text-lg shrink-0 group-hover:scale-110 transition-transform ${TONE_TEXT[t.tone] || ""}`}>
                          <Icon />
                        </span>
                        <span className="min-w-0">
                          <span className="block text-xs font-black text-brand-black dark:text-brand-white">{t.titleBangla}</span>
                          <span className="block text-[10px] font-bold text-brand-dark-grey dark:text-brand-gold-light">{t.titleEnglish}</span>
                          <span className="block text-[11px] text-brand-dark-grey dark:text-brand-gold-light/70 mt-1">{t.desc}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* STEP 3 — details + live preview */}
      {step === 3 && employee && (
        <>
          {/* Phone / tablet: switch between the form and the preview */}
          <div className="xl:hidden inline-flex bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
            {[
              ["form", <FiEdit3 key="i" />, "Details"],
              ["preview", <FiEye key="i" />, "Preview"],
            ].map(([v, icon, label]) => (
              <button
                key={v}
                type="button"
                onClick={() => setMobileView(v)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${mobileView === v ? "bg-brand-gold text-brand-midnight" : "text-brand-dark-grey dark:text-brand-gold-light"}`}
              >
                {icon} {label}
              </button>
            ))}
          </div>

          <div className="grid xl:grid-cols-[minmax(0,5fr)_minmax(0,6fr)] gap-6 items-start">
            {/* Form */}
            <div className={`space-y-5 ${mobileView === "form" ? "" : "hidden xl:block"}`}>
              {!template ? (
                <Card>
                  <Loading rows={5} />
                </Card>
              ) : (
                <>
                  <Card title="Letter basics">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <Field label="Letter date" required>
                        <input
                          type="date"
                          value={letterDate}
                          onChange={(e) => {
                            setLetterDate(e.target.value);
                            setDirty(true);
                          }}
                          className={`${inputCls} dark:[color-scheme:dark] ${errors.letterDate ? "!border-brand-red" : ""}`}
                        />
                      </Field>
                      {!hasEffectiveField && (
                        <Field label="Effective date">
                          <input
                            type="date"
                            value={effectiveDate}
                            onChange={(e) => {
                              setEffectiveDate(e.target.value);
                              setDirty(true);
                            }}
                            className={`${inputCls} dark:[color-scheme:dark]`}
                          />
                        </Field>
                      )}
                      <Field label="Branch on letterhead" hint="Branch address printed under the company name">
                        <Select
                          value={branch}
                          onChange={(v) => {
                            setBranch(v);
                            setDirty(true);
                          }}
                          placeholder="Head office (no branch line)"
                          options={branchOptions}
                        />
                      </Field>
                    </div>
                  </Card>

                  <Card title="Letter details" subtitle={`${template.titleBangla} · fields marked * are required`}>
                    {customFields.length === 0 ? (
                      <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">This letter only uses details from the employee profile.</p>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-4">
                        {customFields.map((f) => (
                          <LetterFieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} error={errors[f.key]} currency={currency} suggestions={suggestionsFor(f.key)} />
                        ))}
                      </div>
                    )}
                  </Card>

                  {profileFields.length > 0 && (
                    <Card>
                      <button type="button" onClick={() => setShowProfileFields((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left cursor-pointer">
                        <span>
                          <span className="flex items-center gap-2 text-base font-black text-brand-black dark:text-brand-white">
                            <FiUser className="text-brand-gold" /> From the employee profile
                          </span>
                          <span className="block text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                            Filled automatically ({profileFields.length} fields). Open only if this letter needs a different value.
                          </span>
                        </span>
                        <FiChevronDown className={`shrink-0 transition-transform ${showProfileFields ? "rotate-180" : ""}`} />
                      </button>
                      {showProfileFields && (
                        <div className="grid sm:grid-cols-2 gap-4 mt-4 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                          {profileFields.map((f) => (
                            <LetterFieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValue(f.key, v)} hintValue={profileHint(f)} currency={currency} suggestions={suggestionsFor(f.key)} />
                          ))}
                        </div>
                      )}
                    </Card>
                  )}

                  <Card>
                    <button type="button" onClick={() => setShowSignatories((v) => !v)} className="w-full flex items-center justify-between gap-3 text-left cursor-pointer">
                      <span>
                        <span className="block text-base font-black text-brand-black dark:text-brand-white">Signatures & copies</span>
                        <span className="block text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5 truncate">
                          {signatories.issuedBy?.name || "Issued by"} · {signatories.approvedBy?.name || "Approved by"}
                        </span>
                      </span>
                      <FiChevronDown className={`shrink-0 transition-transform ${showSignatories ? "rotate-180" : ""}`} />
                    </button>
                    {showSignatories && (
                      <div className="space-y-5 mt-4 pt-4 border-t border-brand-beige/40 dark:border-brand-dark-grey/40">
                        <div className="grid sm:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Left — issued by</h5>
                            <Field label="Name"><input value={signatories.issuedBy?.name || ""} onChange={(e) => setSig("issuedBy", "name", e.target.value)} className={inputCls} /></Field>
                            <Field label="Designation"><input value={signatories.issuedBy?.designation || ""} onChange={(e) => setSig("issuedBy", "designation", e.target.value)} className={inputCls} /></Field>
                            <Field label="Second line (optional)"><input value={signatories.issuedBy?.title || ""} onChange={(e) => setSig("issuedBy", "title", e.target.value)} className={inputCls} /></Field>
                          </div>
                          <div className="space-y-3">
                            <h5 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">Right — approved by</h5>
                            <Field label="Name"><input value={signatories.approvedBy?.name || ""} onChange={(e) => setSig("approvedBy", "name", e.target.value)} className={inputCls} /></Field>
                            <Field label="Designation"><input value={signatories.approvedBy?.designation || ""} onChange={(e) => setSig("approvedBy", "designation", e.target.value)} className={inputCls} /></Field>
                            <Field label="Company"><input value={signatories.approvedBy?.company || ""} onChange={(e) => setSig("approvedBy", "company", e.target.value)} className={inputCls} /></Field>
                            <Field label="On behalf of"><input value={signatories.approvedBy?.onBehalfOf || ""} onChange={(e) => setSig("approvedBy", "onBehalfOf", e.target.value)} className={inputCls} /></Field>
                          </div>
                        </div>
                        <Field label="Copy to (one per line)" hint="“Personal file / office copy” is always added at the end">
                          <textarea
                            rows={4}
                            value={(signatories.copyTo || []).join("\n")}
                            onChange={(e) => {
                              setSignatories((p) => ({ ...p, copyTo: e.target.value.split("\n") }));
                              setDirty(true);
                            }}
                            className={`${inputCls} resize-y`}
                          />
                        </Field>
                      </div>
                    )}
                  </Card>

                  <Card title="Internal note" subtitle="Saved with the letter for HR reference — not printed.">
                    <textarea
                      rows={2}
                      value={remarks}
                      onChange={(e) => {
                        setRemarks(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Optional"
                      className={`${inputCls} resize-none`}
                    />
                  </Card>
                </>
              )}
            </div>

            {/* Live preview */}
            <div className={`xl:sticky xl:top-4 ${mobileView === "preview" ? "" : "hidden xl:block"}`}>
              <Card
                title={
                  <span className="flex items-center gap-2">
                    Live preview
                    {preview.loading && <FiLoader className="animate-spin text-brand-gold" />}
                  </span>
                }
                subtitle={preview.error || "Updates as you type. The memo number is assigned when you issue."}
                bodyClassName="p-3 sm:p-4"
              >
                {preview.snapshot ? (
                  <LetterViewer snapshot={preview.snapshot} status={draft ? "draft" : "preview"} showToolbar={false} />
                ) : (
                  <Loading rows={8} />
                )}
              </Card>
            </div>
          </div>

          {/* Action bar */}
          <div className="sticky bottom-3 z-20 flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4 rounded-3xl bg-brand-white/95 dark:bg-brand-charcoal/95 backdrop-blur border border-brand-beige/50 dark:border-brand-dark-grey/50 shadow-xl">
            <p className="text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
              {draft ? "Editing a saved draft." : "Save a draft to finish later, or issue to assign the memo number."}
            </p>
            <div className="flex items-center gap-2 ml-auto">
              {!draft && (
                <Btn variant="ghost" onClick={() => setStep(2)} disabled={!!submitting}>
                  <FiArrowLeft /> Back
                </Btn>
              )}
              <Btn variant="ghost" onClick={() => submit("draft")} loading={submitting === "draft"} disabled={!!submitting || !template}>
                <FiSave /> {draft ? "Save changes" : "Save draft"}
              </Btn>
              {can("hr-letters", "add") && (
                <Btn onClick={() => submit("issue")} loading={submitting === "issue"} disabled={!!submitting || !template}>
                  <FiSend /> Issue letter
                </Btn>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

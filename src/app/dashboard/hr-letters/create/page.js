"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FiUser,
  FiFileText,
  FiCheck,
  FiArrowRight,
  FiArrowLeft,
  FiSearch,
  FiPrinter,
  FiSave,
  FiAward,
  FiBriefcase,
  FiCalendar,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiLogOut,
  FiTrendingUp,
  FiRefreshCw,
} from "react-icons/fi";
import Mtitle from "@/components/Comon/Mtitle";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import useBranchApi from "@/hooks/useBranchApi";
import LetterDocumentView from "@/components/letters/LetterDocumentView";
import Swal from "sweetalert2";

export default function CreateHrLetterPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs">Loading creation wizard...</div>}>
      <CreateHrLetterContent />
    </Suspense>
  );
}

function CreateHrLetterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedEmployeeId = searchParams.get("employeeId");

  const { employees, loading: empLoading } = useEmployeeApi(50);
  const { branches } = useBranchApi();
  const {
    createLetter,
    getTemplateForType,
    getNextNumberPreview,
  } = useHrLetterApi();

  // Wizard Steps: 1: Employee, 2: Letter Type, 3: Details & Custom Fields, 4: Live Preview & Issue
  const [step, setStep] = useState(1);

  // Selected Data
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedType, setSelectedType] = useState("appointment");
  const [activeTemplate, setActiveTemplate] = useState(null);

  // Form Inputs
  const [letterDate, setLetterDate] = useState(new Date().toISOString().split("T")[0]);
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [remarks, setRemarks] = useState("");
  const [dynamicInputs, setDynamicInputs] = useState({});

  // Signatory Customization
  const [customSignatories, setCustomSignatories] = useState({
    issuedBy: {
      name: "মোঃ ফয়জুর রহমান মানিক",
      designation: "Manager: Admin & HR",
      title: "Senior Trainer",
    },
    approvedBy: {
      name: "কর্নেল মোঃ বনী ইয়ামীন (অবঃ)",
      designation: "পরিচালক",
      company: "মাল্টি জিম প্রিমিয়াম ও মাল্টি জিম",
      onBehalfOf: "পক্ষে, ব্যবস্থাপনা পরিচালক",
    },
    copyTo: [
      "ব্যবস্থাপনা পরিচালক, মাল্টি জিম প্রিমিয়াম ও মাল্টি জিম",
      "পরিচালক, মাল্টি জিম প্রিমিয়াম ও মাল্টি জিম",
      "ম্যানেজার এডমিন",
      "ম্যানেজার একাউন্টস",
    ],
  });

  // Search in Step 1
  const [empSearch, setEmpSearch] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewNumber, setPreviewNumber] = useState("");

  // 13 Letter Types Categorized by Lifecycle
  const LETTER_CATEGORIES = [
    {
      name: "Joining & Onboarding",
      types: [
        {
          key: "appointment",
          titleBangla: "অফিসিয়াল নিয়োগপত্র",
          titleEnglish: "Appointment Letter",
          icon: <FiBriefcase className="text-lg text-emerald-500" />,
          desc: "New staff employment terms, probationary period, salary breakdown",
        },
        {
          key: "confirmation",
          titleBangla: "চাকরি স্থায়ীকরণ পত্র",
          titleEnglish: "Confirmation Letter",
          icon: <FiCheckCircle className="text-lg text-blue-500" />,
          desc: "Successful probation completion and job confirmation",
        },
      ],
    },
    {
      name: "Career Growth & Progression",
      types: [
        {
          key: "promotion",
          titleBangla: "পদোন্নতি পত্র",
          titleEnglish: "Promotion Letter",
          icon: <FiTrendingUp className="text-lg text-amber-500" />,
          desc: "Designation upgrade, enhanced responsibilities and benefits",
        },
        {
          key: "transfer",
          titleBangla: "বদলি আদেশ পত্র",
          titleEnglish: "Transfer Letter",
          icon: <FiRefreshCw className="text-lg text-cyan-500" />,
          desc: "Branch transfer order with handover and reporting dates",
        },
        {
          key: "promotion_transfer",
          titleBangla: "পদোন্নতি ও বদলি পত্র",
          titleEnglish: "Promotion & Transfer",
          icon: <FiAward className="text-lg text-purple-500" />,
          desc: "Combined promotion with relocation to a new branch",
        },
      ],
    },
    {
      name: "Salary & Compensation",
      types: [
        {
          key: "salary_revision",
          titleBangla: "বেতন পুনর্নির্ধারণ পত্র",
          titleEnglish: "Salary Revision",
          icon: <FiDollarSign className="text-lg text-emerald-600" />,
          desc: "Base salary restructuring and revised remuneration",
        },
        {
          key: "increment",
          titleBangla: "বার্ষিক বেতন বৃদ্ধি পত্র",
          titleEnglish: "Increment Letter",
          icon: <FiTrendingUp className="text-lg text-emerald-500" />,
          desc: "Annual increment amount, increment percentage, effective date",
        },
      ],
    },
    {
      name: "Conduct, Discipline & Recognition",
      types: [
        {
          key: "warning",
          titleBangla: "সতর্কীকরণ পত্র",
          titleEnglish: "Warning Letter",
          icon: <FiAlertTriangle className="text-lg text-rose-500" />,
          desc: "Formal written warning for attendance or policy violation",
        },
        {
          key: "show_cause",
          titleBangla: "কারণ দর্শানো নোটিশ",
          titleEnglish: "Show Cause Notice",
          icon: <FiAlertTriangle className="text-lg text-amber-600" />,
          desc: "Formal directive requiring written explanation within deadline",
        },
        {
          key: "appreciation",
          titleBangla: "প্রশংসা ও অভিনন্দন পত্র",
          titleEnglish: "Appreciation Letter",
          icon: <FiAward className="text-lg text-yellow-500" />,
          desc: "Recognition for exceptional performance and dedication",
        },
      ],
    },
    {
      name: "Exit & Offboarding",
      types: [
        {
          key: "resignation_acceptance",
          titleBangla: "পদত্যাগপত্র গ্রহণ পত্র",
          titleEnglish: "Resignation Acceptance",
          icon: <FiLogOut className="text-lg text-slate-500" />,
          desc: "Formal acceptance of resignation and handover schedule",
        },
        {
          key: "experience_certificate",
          titleBangla: "অভিজ্ঞতা সনদ",
          titleEnglish: "Experience Certificate",
          icon: <FiAward className="text-lg text-indigo-500" />,
          desc: "Official certification of service tenure, role, and conduct",
        },
        {
          key: "relieving",
          titleBangla: "অবমুক্তি পত্র",
          titleEnglish: "Relieving Letter",
          icon: <FiCheck className="text-lg text-teal-600" />,
          desc: "Official release from duties following clearance completion",
        },
      ],
    },
  ];

  // Auto-select employee if param is provided
  useEffect(() => {
    if (preselectedEmployeeId && employees?.length > 0) {
      const match = employees.find((e) => e._id === preselectedEmployeeId);
      if (match) {
        handleSelectEmployee(match);
      }
    }
  }, [preselectedEmployeeId, employees]);

  // Load template whenever type changes
  useEffect(() => {
    const loadTpl = async () => {
      try {
        const tpl = await getTemplateForType(selectedType);
        setActiveTemplate(tpl);
        const nextNum = await getNextNumberPreview(selectedType);
        setPreviewNumber(nextNum);
      } catch (err) {
        console.error("Failed to load template:", err);
      }
    };
    loadTpl();
  }, [selectedType]);

  // Filtered employees for Step 1
  const filteredEmployees = useMemo(() => {
    if (!employees) return [];
    if (!empSearch.trim()) return employees.slice(0, 15);
    const q = empSearch.toLowerCase();
    return employees.filter(
      (e) =>
        e.name?.toLowerCase().includes(q) ||
        e.employeeId?.toLowerCase().includes(q) ||
        e.mobileNumber?.includes(q) ||
        e.department?.toLowerCase().includes(q) ||
        e.jobPosition?.toLowerCase().includes(q)
    );
  }, [employees, empSearch]);

  const handleSelectEmployee = (emp) => {
    setSelectedEmployee(emp);
    setSelectedBranch((emp.branches && emp.branches[0]) || "");

    // Pre-populate dynamic inputs with employee baseline
    const defaults = {
      employeeName: emp.name,
      employeeCode: emp.employeeId,
      designation: emp.jobPosition,
      previousDesignation: emp.jobPosition,
      department: emp.department,
      branch: (emp.branches && emp.branches[0]) || "",
      previousBranch: (emp.branches && emp.branches[0]) || "",
      joiningDate: emp.joiningDate || "",
    };
    setDynamicInputs(defaults);
    setStep(2);
  };

  const handleSelectType = (typeKey) => {
    setSelectedType(typeKey);
    setStep(3);
  };

  const handleInputChange = (fieldKey, val) => {
    setDynamicInputs((prev) => ({
      ...prev,
      [fieldKey]: val,
    }));
  };

  // Build live preview snapshot
  const liveSnapshot = useMemo(() => {
    if (!selectedEmployee || !activeTemplate) return null;

    const branchObj = branches?.find((b) => b.name === selectedBranch) || null;

    // Info table
    const infoTable = (activeTemplate.infoFields || []).map((f) => {
      let val = dynamicInputs[f.key];
      if (val === undefined || val === null || val === "") {
        if (f.source === "employee" && f.employeeField) {
          const empVal = selectedEmployee[f.employeeField];
          val = Array.isArray(empVal) ? empVal.join(", ") : empVal;
        } else if (f.defaultValue) {
          val = f.defaultValue;
        }
      }
      return {
        key: f.key,
        labelBangla: f.labelBangla,
        labelEnglish: f.labelEnglish,
        value: val ? String(val) : "—",
      };
    });

    // Subject
    let subject = activeTemplate.subjectTemplate || "";
    const vars = {
      employeeName: selectedEmployee.name,
      employeeId: selectedEmployee.employeeId,
      designation: dynamicInputs.newDesignation || dynamicInputs.designation || selectedEmployee.jobPosition || "",
      department: dynamicInputs.department || selectedEmployee.department || "",
      branch: selectedBranch || "",
      effectiveDate,
      letterDate,
      letterNumber: previewNumber || "MGP/HR/XXXX/2026/0001",
      ...dynamicInputs,
    };
    for (const [k, v] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(`{{\\s*${k}\\s*}}`, "g"), String(v || ""));
    }

    return {
      company: {
        name: "MULTI GYM PREMIUM & MULTI GYM",
        tagline: "Multi Gym Premium | Multi Gym | Power FiT",
        brands: "Multi Gym Premium  |  Multi Gym  |  Power FiT",
        address: "Dhaka, Bangladesh",
        phone: "+880 1700-000000",
      },
      branch: branchObj
        ? {
            name: branchObj.name,
            address: branchObj.address,
            phone: branchObj.phone,
          }
        : null,
      letterMeta: {
        letterType: selectedType,
        letterNumber: previewNumber || "MGP/HR/XXXX/2026/0001",
        letterDate,
        titleBangla: activeTemplate.titleBangla,
        titleEnglish: activeTemplate.titleEnglish,
        subject,
      },
      recipient: {
        employeeId: selectedEmployee.employeeId,
        name: selectedEmployee.name,
        designation: dynamicInputs.newDesignation || dynamicInputs.designation || selectedEmployee.jobPosition,
        department: dynamicInputs.department || selectedEmployee.department,
        branch: selectedBranch,
        joiningDate: selectedEmployee.joiningDate,
        phone: selectedEmployee.mobileNumber,
        nidPassport: selectedEmployee.nidPassport,
      },
      infoTable,
      sections: activeTemplate.sections || [],
      signatories: customSignatories,
      acknowledgementRequired: activeTemplate.hasEmployeeAcknowledgment,
    };
  }, [
    selectedEmployee,
    activeTemplate,
    selectedType,
    previewNumber,
    letterDate,
    effectiveDate,
    selectedBranch,
    branches,
    dynamicInputs,
    customSignatories,
  ]);

  const handleSubmit = async (asDraft = false) => {
    if (!selectedEmployee) {
      Swal.fire("Error", "Please select an employee first.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        employeeId: selectedEmployee._id,
        letterType: selectedType,
        letterDate,
        effectiveDate,
        templateId: activeTemplate?._id,
        branch: selectedBranch || (selectedEmployee.branches && selectedEmployee.branches[0]) || "",
        department: dynamicInputs.department || selectedEmployee.department || "",
        designation: dynamicInputs.newDesignation || dynamicInputs.designation || selectedEmployee.jobPosition || "",
        status: asDraft ? "draft" : "generated",
        inputData: dynamicInputs,
        remarks,
        customSignatories,
      };

      const res = await createLetter(payload);
      if (res?.success) {
        Swal.fire({
          icon: "success",
          title: asDraft ? "Draft Saved" : "Official Letter Generated",
          text: asDraft
            ? "Your draft has been saved successfully."
            : `Letter ${res.data?.letterNumber} has been officially issued!`,
        }).then(() => {
          router.push("/dashboard/hr-letters");
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Creation Failed",
        text: err?.response?.data?.message || "Failed to generate HR letter.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Top Breadcrumb & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <Mtitle
          title="Create Official HR Letter"
          subtitle="Generate authenticated employee lifecycle letters with dynamic template merging."
        />

        <button
          onClick={() => router.push("/dashboard/hr-letters")}
          className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey font-bold text-xs hover:bg-brand-beige/50 transition-all cursor-pointer self-start"
        >
          Cancel & Exit
        </button>
      </div>

      {/* Progress Steps Header */}
      <div className="grid grid-cols-4 gap-2 bg-brand-white dark:bg-brand-charcoal p-3 rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm">
        <button
          onClick={() => setStep(1)}
          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left cursor-pointer ${
            step === 1
              ? "bg-brand-primary text-white"
              : selectedEmployee
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "text-brand-dark-grey"
          }`}
        >
          <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
            1
          </div>
          <div className="truncate">
            <span className="block font-black text-[10px] uppercase">Step 1</span>
            <span className="truncate block">{selectedEmployee ? selectedEmployee.name : "Select Employee"}</span>
          </div>
        </button>

        <button
          onClick={() => selectedEmployee && setStep(2)}
          disabled={!selectedEmployee}
          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left disabled:opacity-40 cursor-pointer ${
            step === 2
              ? "bg-brand-primary text-white"
              : step > 2
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "text-brand-dark-grey"
          }`}
        >
          <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
            2
          </div>
          <div className="truncate">
            <span className="block font-black text-[10px] uppercase">Step 2</span>
            <span className="truncate block">{selectedType?.replace(/_/g, " ")}</span>
          </div>
        </button>

        <button
          onClick={() => selectedEmployee && setStep(3)}
          disabled={!selectedEmployee}
          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left disabled:opacity-40 cursor-pointer ${
            step === 3
              ? "bg-brand-primary text-white"
              : step > 3
              ? "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10"
              : "text-brand-dark-grey"
          }`}
        >
          <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
            3
          </div>
          <div className="truncate">
            <span className="block font-black text-[10px] uppercase">Step 3</span>
            <span className="truncate block">Details & Fields</span>
          </div>
        </button>

        <button
          onClick={() => selectedEmployee && setStep(4)}
          disabled={!selectedEmployee}
          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-bold transition-all text-left disabled:opacity-40 cursor-pointer ${
            step === 4
              ? "bg-brand-primary text-white"
              : "text-brand-dark-grey"
          }`}
        >
          <div className="w-6 h-6 rounded-full border border-current flex items-center justify-center text-[10px] shrink-0">
            4
          </div>
          <div className="truncate">
            <span className="block font-black text-[10px] uppercase">Step 4</span>
            <span className="truncate block">Live Preview</span>
          </div>
        </button>
      </div>

      {/* Selected Employee Summary Sticky Strip (when chosen) */}
      {selectedEmployee && (
        <div className="p-3.5 rounded-2xl bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={selectedEmployee.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
              alt={selectedEmployee.name}
              className="w-10 h-10 rounded-xl object-cover border border-brand-gold"
            />
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                  {selectedEmployee.name}
                </h4>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                  {selectedEmployee.employeeId || "EMP"}
                </span>
              </div>
              <p className="text-[11px] text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                {selectedEmployee.jobPosition || "Staff"} • {selectedEmployee.department || "General"} • {selectedEmployee.branches?.join(", ") || "Main Branch"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep(1)}
            type="button"
            className="text-[11px] font-bold text-brand-primary hover:underline cursor-pointer"
          >
            Change Employee
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: SELECT EMPLOYEE */}
      {/* ========================================================================= */}
      {step === 1 && (
        <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-5">
          <div>
            <h3 className="text-base font-black text-brand-black dark:text-brand-white mb-1">
              Step 1: Choose Employee
            </h3>
            <p className="text-xs text-brand-dark-grey dark:text-brand-sage">
              Search and pick the employee for whom this official document is being issued.
            </p>
          </div>

          {/* Search Box */}
          <div className="relative">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-dark-grey text-sm" />
            <input
              type="text"
              placeholder="Search by Employee Name, ID, Mobile number, or Designation..."
              value={empSearch}
              onChange={(e) => setEmpSearch(e.target.value)}
              className="w-full pl-9 pr-3.5 py-3 rounded-2xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium text-brand-black dark:text-brand-white focus:outline-none focus:border-brand-primary"
            />
          </div>

          {/* Employee Cards Grid */}
          {empLoading ? (
            <div className="p-8 text-center text-xs text-brand-dark-grey">Loading employees...</div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-xs text-brand-dark-grey">No matching employees found.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredEmployees.map((emp) => (
                <div
                  key={emp._id}
                  onClick={() => handleSelectEmployee(emp)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                    selectedEmployee?._id === emp._id
                      ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-sm"
                      : "border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-primary/50 bg-brand-offwhite/30 dark:bg-brand-midnight/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <img
                      src={emp.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                      alt={emp.name}
                      className="w-11 h-11 rounded-xl object-cover border border-brand-gold/30"
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                        {emp.name}
                      </h4>
                      <p className="text-[10px] font-bold text-brand-gold uppercase tracking-wider">
                        {emp.employeeId || "EMP"}
                      </p>
                      <p className="text-[11px] text-brand-dark-grey mt-0.5">
                        {emp.jobPosition || "Staff"} • {emp.department || "General"}
                      </p>
                    </div>
                  </div>

                  <FiArrowRight className="text-brand-dark-grey text-base shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: SELECT LETTER TYPE */}
      {/* ========================================================================= */}
      {step === 2 && (
        <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-black text-brand-black dark:text-brand-white mb-1">
                Step 2: Select Letter Type (13 Master Types)
              </h3>
              <p className="text-xs text-brand-dark-grey dark:text-brand-sage">
                Select from the official Multi Gym Master HR letters.
              </p>
            </div>

            <button
              onClick={() => setStep(1)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FiArrowLeft /> Back
            </button>
          </div>

          <div className="space-y-6">
            {LETTER_CATEGORIES.map((cat, cIdx) => (
              <div key={cIdx} className="space-y-2.5">
                <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
                  <span>{cat.name}</span>
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {cat.types.map((type) => (
                    <div
                      key={type.key}
                      onClick={() => handleSelectType(type.key)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                        selectedType === type.key
                          ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-md ring-2 ring-brand-primary/20"
                          : "border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-primary/60 bg-brand-offwhite/30 dark:bg-brand-midnight/40"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 rounded-xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/50 dark:border-brand-dark-grey shrink-0 shadow-xs">
                          {type.icon}
                        </div>
                        <div>
                          <h5 className="font-extrabold text-xs text-brand-black dark:text-brand-white">
                            {type.titleBangla}
                          </h5>
                          <span className="text-[10px] font-bold text-brand-dark-grey block">
                            {type.titleEnglish}
                          </span>
                          <p className="text-[11px] text-brand-dark-grey dark:text-brand-sage mt-1 line-clamp-2">
                            {type.desc}
                          </p>
                        </div>
                      </div>

                      <div className="flex justify-end pt-1">
                        <span className="text-[10px] font-bold text-brand-primary flex items-center gap-1">
                          Configure Details <FiArrowRight />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: DYNAMIC FORM FIELDS */}
      {/* ========================================================================= */}
      {step === 3 && activeTemplate && (
        <div className="p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-brand-beige/50 dark:border-brand-dark-grey/50 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Step 3: Dynamic Information Form
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-primary/10 text-brand-primary">
                  {activeTemplate.titleBangla}
                </span>
              </div>
              <p className="text-xs text-brand-dark-grey dark:text-brand-sage mt-0.5">
                Baseline employee information has been auto-populated. Enter only letter-specific dynamic values.
              </p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="px-3.5 py-1.5 rounded-xl bg-brand-offwhite dark:bg-brand-midnight font-bold text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <FiArrowLeft /> Back
            </button>
          </div>

          <div className="space-y-6">
            {/* Meta Dates & Branch Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/60 dark:border-brand-dark-grey">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Issue / Letter Date *
                </label>
                <input
                  type="date"
                  required
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-white dark:bg-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Effective Date *
                </label>
                <input
                  type="date"
                  required
                  value={effectiveDate}
                  onChange={(e) => setEffectiveDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-white dark:bg-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1">
                  Branch Letterhead
                </label>
                <select
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-white dark:bg-brand-charcoal text-xs font-medium focus:outline-none focus:border-brand-primary"
                >
                  <option value="">Head Office / Default</option>
                  {branches?.map((b) => (
                    <option key={b._id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Template Specific Dynamic Fields */}
            <div>
              <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3 flex items-center gap-1.5">
                <FiFileText /> Letter Information Table Fields
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {(activeTemplate.infoFields || []).map((field) => {
                  const currentVal = dynamicInputs[field.key] ?? "";
                  return (
                    <div key={field.key} className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[11px] font-bold text-brand-black dark:text-brand-white">
                          {field.labelBangla} {field.required ? "*" : ""}
                        </label>
                        {field.source === "employee" && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                            Auto-filled
                          </span>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={field.defaultValue || `Enter ${field.labelBangla}`}
                        value={currentVal}
                        onChange={(e) => handleInputChange(field.key, e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Remarks */}
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-brand-dark-grey mb-1">
                Internal Remarks / File Notes (Optional)
              </label>
              <textarea
                rows={2}
                placeholder="Optional administrative tracking note (will not appear on the official print)..."
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary resize-none"
              />
            </div>

            {/* Next Step Action */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-beige/50 dark:border-brand-dark-grey/50">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="px-6 py-2.5 rounded-2xl bg-brand-primary hover:bg-brand-secondary text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <span>Proceed to Live Preview</span>
                <FiArrowRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: LIVE PREVIEW & ISSUE */}
      {/* ========================================================================= */}
      {step === 4 && liveSnapshot && (
        <div className="space-y-6">
          {/* Action Toolbar */}
          <div className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Step 4: Official Live A4 Preview
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                  Ready to Issue
                </span>
              </div>
              <p className="text-xs text-brand-dark-grey dark:text-brand-sage mt-0.5">
                Review exact margins, clauses, and signatories before committing to the immutable database record.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setStep(3)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey font-bold text-xs hover:bg-brand-beige/50 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <FiArrowLeft /> Back to Edit
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(true)}
                className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <FiSave className="text-sm" />
                <span>Save Draft</span>
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={() => handleSubmit(false)}
                className="px-6 py-2 rounded-xl bg-brand-primary hover:bg-brand-secondary text-white font-black text-xs transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <FiCheck className="text-base" />
                <span>{isSubmitting ? "Issuing..." : "Generate Official Letter"}</span>
              </button>
            </div>
          </div>

          {/* Rendered Live Document Canvas */}
          <div className="p-4 sm:p-8 rounded-3xl bg-slate-100 dark:bg-slate-900/60 border border-brand-beige/60 dark:border-brand-dark-grey flex justify-center shadow-inner">
            <LetterDocumentView snapshot={liveSnapshot} showActions={false} />
          </div>
        </div>
      )}
    </div>
  );
}

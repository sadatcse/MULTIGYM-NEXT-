"use client";

import React, { useState, useEffect } from "react";
import {
  FiFileText,
  FiEdit3,
  FiEye,
  FiCheckCircle,
  FiLayers,
  FiLoader,
  FiArrowLeft,
  FiSave,
} from "react-icons/fi";
import Mtitle from "@/components/Comon/Mtitle";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import LetterPreviewModal from "@/components/letters/LetterPreviewModal";
import Swal from "sweetalert2";

export default function LetterTemplatesPage() {
  const { can } = useUserPermissions();
  const { fetchTemplates, updateTemplate } = useHrLetterApi();

  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Preview Modal
  const [previewSnapshot, setPreviewSnapshot] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchTemplates();
      setTemplates(data || []);
      if (data?.length > 0 && !selectedTemplate) {
        setSelectedTemplate(data[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleSelectTemplate = (tpl) => {
    setSelectedTemplate(tpl);
    setIsEditing(false);
  };

  const handleStartEdit = (tpl) => {
    setSelectedTemplate(tpl);
    setEditForm({
      name: tpl.name,
      titleBangla: tpl.titleBangla,
      titleEnglish: tpl.titleEnglish || "",
      subjectTemplate: tpl.subjectTemplate,
      memoPrefix: tpl.memoPrefix,
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedTemplate) return;
    setIsSaving(true);
    try {
      await updateTemplate(selectedTemplate._id, editForm);
      Swal.fire("Saved!", "Template updated successfully.", "success");
      setIsEditing(false);
      await loadTemplates();
    } catch (err) {
      Swal.fire("Error", "Failed to update template.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePreviewTemplate = (tpl) => {
    const dummySnapshot = {
      company: {
        name: "MULTI GYM PREMIUM & MULTI GYM",
        tagline: "Multi Gym Premium | Multi Gym | Power FiT",
        brands: "Multi Gym Premium  |  Multi Gym  |  Power FiT",
        address: "Dhaka, Bangladesh",
        phone: "+880 1700-000000",
      },
      letterMeta: {
        letterType: tpl.letterType,
        letterNumber: `${tpl.memoPrefix}/2026/0001`,
        letterDate: new Date().toLocaleDateString("bn-BD"),
        titleBangla: tpl.titleBangla,
        titleEnglish: tpl.titleEnglish,
        subject: tpl.subjectTemplate.replace(/{{\s*designation\s*}}/g, "Senior Trainer"),
      },
      recipient: {
        employeeId: "EMP-001",
        name: "মোহাম্মদ রফিকুল ইসলাম",
        designation: "Senior Fitness Trainer",
        department: "Gym Operations",
        branch: "Dhanmondi Branch",
        joiningDate: "01 Jan 2024",
        phone: "+880 1711-000000",
      },
      infoTable: (tpl.infoFields || []).map((f) => ({
        key: f.key,
        labelBangla: f.labelBangla,
        labelEnglish: f.labelEnglish,
        value: f.defaultValue || "নমুনা তথ্য বিবরণী",
      })),
      sections: tpl.sections || [],
      signatories: tpl.defaultSignatories || {
        issuedBy: { name: "মোঃ ফয়জুর রহমান মানিক", designation: "Manager: Admin & HR" },
        approvedBy: { name: "কর্নেল মোঃ বনী ইয়ামীন (অবঃ)", designation: "পরিচালক" },
        copyTo: ["ব্যবস্থাপনা পরিচালক", "পরিচালক", "ম্যানেজার এডমিন"],
      },
      acknowledgementRequired: tpl.hasEmployeeAcknowledgment,
    };

    setPreviewSnapshot(dummySnapshot);
    setIsPreviewOpen(true);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      <Mtitle
        title="Master HR Letter Templates"
        subtitle="Manage standard clauses, numbering prefixes, and dynamic variables for all 13 official letters."
      />

      {loading ? (
        <div className="p-12 flex items-center justify-center text-xs text-brand-dark-grey">
          <FiLoader className="animate-spin text-base mr-2" /> Loading master templates...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Templates Directory List */}
          <div className="p-4 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-2 h-[75vh] overflow-y-auto">
            <h4 className="font-black text-xs uppercase text-brand-gold px-2 py-1 tracking-wider">
              13 Official Letters
            </h4>
            {templates.map((tpl) => (
              <div
                key={tpl._id}
                onClick={() => handleSelectTemplate(tpl)}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  selectedTemplate?._id === tpl._id
                    ? "border-brand-primary bg-brand-primary/5 dark:bg-brand-primary/10 shadow-xs"
                    : "border-brand-beige/60 dark:border-brand-dark-grey hover:border-brand-primary/40 bg-brand-offwhite/40 dark:bg-brand-midnight/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <h5 className="font-extrabold text-xs text-brand-black dark:text-brand-white truncate">
                    {tpl.titleBangla}
                  </h5>
                  <span className="text-[9px] font-mono font-bold uppercase text-brand-dark-grey bg-brand-beige/50 px-1.5 py-0.5 rounded">
                    {tpl.memoPrefix}
                  </span>
                </div>
                <p className="text-[10px] text-brand-dark-grey mt-0.5 truncate">
                  {tpl.titleEnglish || tpl.name}
                </p>
              </div>
            ))}
          </div>

          {/* Template Details & Clause Viewer */}
          <div className="md:col-span-2 p-6 rounded-3xl bg-brand-white dark:bg-brand-charcoal border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm space-y-5 h-[75vh] overflow-y-auto">
            {selectedTemplate && (
              <>
                <div className="flex items-center justify-between border-b border-brand-beige/50 dark:border-brand-dark-grey/50 pb-4">
                  <div>
                    <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                      {selectedTemplate.titleBangla}
                    </h3>
                    <p className="text-xs text-brand-dark-grey">
                      {selectedTemplate.titleEnglish} • Memo Prefix: <strong className="font-mono">{selectedTemplate.memoPrefix}</strong>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePreviewTemplate(selectedTemplate)}
                      className="px-3.5 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-beige/50 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <FiEye className="text-sm" /> Preview
                    </button>

                    {can("hr-letters", "edit") && !isEditing && (
                      <button
                        onClick={() => handleStartEdit(selectedTemplate)}
                        className="px-3.5 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-secondary transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <FiEdit3 className="text-sm" /> Edit Info
                      </button>
                    )}
                  </div>
                </div>

                {isEditing ? (
                  /* Edit Form */
                  <form onSubmit={handleSaveEdit} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-brand-dark-grey mb-1">
                        Title (Bangla)
                      </label>
                      <input
                        type="text"
                        value={editForm.titleBangla}
                        onChange={(e) => setEditForm({ ...editForm, titleBangla: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-brand-dark-grey mb-1">
                        Title (English)
                      </label>
                      <input
                        type="text"
                        value={editForm.titleEnglish}
                        onChange={(e) => setEditForm({ ...editForm, titleEnglish: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-brand-dark-grey mb-1">
                        Memo Number Prefix
                      </label>
                      <input
                        type="text"
                        value={editForm.memoPrefix}
                        onChange={(e) => setEditForm({ ...editForm, memoPrefix: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold uppercase text-brand-dark-grey mb-1">
                        Subject Template
                      </label>
                      <input
                        type="text"
                        value={editForm.subjectTemplate}
                        onChange={(e) => setEditForm({ ...editForm, subjectTemplate: e.target.value })}
                        className="w-full px-3.5 py-2 rounded-xl border border-brand-beige/80 dark:border-brand-dark-grey/80 bg-brand-offwhite/50 dark:bg-brand-midnight text-xs font-medium focus:outline-none focus:border-brand-primary"
                      />
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight font-bold text-xs"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="px-5 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-secondary flex items-center gap-1.5"
                      >
                        <FiSave /> {isSaving ? "Saving..." : "Save Changes"}
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Read-Only Details */
                  <div className="space-y-4 text-xs">
                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-dark-grey block">Default Subject</span>
                      <p className="font-semibold text-brand-black dark:text-brand-white mt-0.5">
                        {selectedTemplate.subjectTemplate}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-dark-grey block mb-2">
                        Information Table Fields ({(selectedTemplate.infoFields || []).length})
                      </span>
                      <div className="grid grid-cols-2 gap-2">
                        {(selectedTemplate.infoFields || []).map((f, idx) => (
                          <div key={idx} className="p-2 rounded-xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                            <span className="font-bold block text-brand-black dark:text-brand-white">{f.labelBangla}</span>
                            <span className="text-[10px] text-brand-dark-grey">Key: {f.key} • Source: {f.source}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold uppercase text-brand-dark-grey block mb-2">
                        Official Sections & Clauses ({(selectedTemplate.sections || []).length})
                      </span>
                      <div className="space-y-3">
                        {(selectedTemplate.sections || []).map((sec, idx) => (
                          <div key={idx} className="p-3 rounded-2xl bg-brand-offwhite/40 dark:bg-brand-midnight/40 border border-brand-beige/50 dark:border-brand-dark-grey/50 space-y-1">
                            <h5 className="font-bold text-brand-black dark:text-brand-white">
                              {sec.sectionNumber}। {sec.titleBangla}
                            </h5>
                            {sec.introText && (
                              <p className="text-[11px] text-brand-dark-grey dark:text-brand-sage">{sec.introText}</p>
                            )}
                            {sec.clauses && (
                              <p className="text-[10px] text-brand-gold font-bold">
                                {sec.clauses.length} clauses defined in this section.
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewSnapshot && (
        <LetterPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          snapshot={previewSnapshot}
        />
      )}
    </div>
  );
}

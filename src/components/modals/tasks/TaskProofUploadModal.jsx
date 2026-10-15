"use client";

import { FiX, FiUploadCloud } from "react-icons/fi";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// is passed for consistency (this modal has no submit form).
export default function TaskProofUploadModal({ handleSaveProof, proofFile, proofRemark, setProofFile, setProofRemark, setShowProofModal, showProofModal, uploadingProof, permissions = FULL_ACCESS }) {
  return (
    <>
{showProofModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-md p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-5 animate-scale-in max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white">
                Upload Completion Proof
              </h4>
              <button onClick={() => setShowProofModal(false)} className="text-brand-dark-grey hover:text-brand-red">
                <FiX />
              </button>
            </div>

            <div className="space-y-4">
              <label className="p-6 rounded-2xl border-2 border-dashed border-brand-gold/60 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-brand-gold/5 text-center">
                <FiUploadCloud className="text-2xl text-brand-gold" />
                <span className="text-xs font-extrabold text-brand-black dark:text-brand-white">
                  {proofFile ? proofFile.name : "Select photo, PDF, or document"}
                </span>
                <input
                  type="file"
                  onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                  className="hidden"
                />
              </label>

              <input
                type="text"
                value={proofRemark}
                onChange={(e) => setProofRemark(e.target.value)}
                placeholder="Proof description / note"
                className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowProofModal(false)}
                className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={uploadingProof || !proofFile}
                onClick={handleSaveProof}
                className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black"
              >
                {uploadingProof ? "Uploading..." : "Save Proof"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  FiFileText,
  FiEye,
  FiPrinter,
  FiPlus,
  FiLoader,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import useHrLetterApi from "@/hooks/useHrLetterApi";
import LetterPreviewModal from "./LetterPreviewModal";

export default function EmployeeLettersSection({ employeeId, employeeData }) {
  const router = useRouter();
  const { getEmployeeLetters, logClientAction } = useHrLetterApi();

  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewSnapshot, setPreviewSnapshot] = useState(null);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const loadLetters = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    try {
      const data = await getEmployeeLetters(employeeId);
      setLetters(data || []);
    } catch (err) {
      console.error("Failed to load employee letters:", err);
    } finally {
      setLoading(false);
    }
  }, [employeeId, getEmployeeLetters]);

  useEffect(() => {
    loadLetters();
  }, [loadLetters]);

  const handleOpenPreview = (letter) => {
    setSelectedLetter(letter);
    setPreviewSnapshot(letter.contentSnapshot);
    setIsPreviewOpen(true);
    logClientAction(letter._id, "viewed");
  };

  const getStatusBadge = (status, version) => {
    if (status === "draft") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/30">
          Draft
        </span>
      );
    }
    if (status === "reissued") {
      return (
        <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/10 text-blue-600 border border-blue-500/30">
          Superseded (v{version})
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
        Issued {version > 1 ? `(v${version})` : ""}
      </span>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
          <FiFileText /> Official HR Letters & Documents ({letters.length})
        </h4>

        <button
          onClick={() => router.push(`/dashboard/hr-letters/create?employeeId=${employeeId}`)}
          type="button"
          className="px-3 py-1.5 rounded-xl bg-brand-primary/10 hover:bg-brand-primary text-brand-primary hover:text-white font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
        >
          <FiPlus className="text-xs" />
          <span>Issue New Letter</span>
        </button>
      </div>

      {loading ? (
        <div className="p-8 flex items-center justify-center text-brand-dark-grey text-xs">
          <FiLoader className="animate-spin text-base mr-2" /> Loading HR letters...
        </div>
      ) : letters.length === 0 ? (
        <div className="p-6 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-center border border-dashed border-brand-beige/60 dark:border-brand-dark-grey">
          <p className="text-xs text-brand-dark-grey dark:text-brand-sage mb-3">
            No official HR letters have been generated for this employee yet.
          </p>
          <button
            onClick={() => router.push(`/dashboard/hr-letters/create?employeeId=${employeeId}`)}
            type="button"
            className="px-4 py-2 rounded-xl bg-brand-primary text-white font-bold text-xs hover:bg-brand-secondary transition-all inline-flex items-center gap-2 cursor-pointer"
          >
            <FiPlus className="text-xs" />
            <span>Generate First Letter</span>
          </button>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey bg-brand-white dark:bg-brand-charcoal shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-offwhite/70 dark:bg-brand-midnight text-[11px] uppercase font-black text-brand-dark-grey">
                <th className="py-2.5 px-3">Letter Type</th>
                <th className="py-2.5 px-3">Letter No.</th>
                <th className="py-2.5 px-3">Issue Date</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-beige/30 dark:divide-brand-dark-grey/30">
              {letters.map((letter) => (
                <tr
                  key={letter._id}
                  className="hover:bg-brand-offwhite/50 dark:hover:bg-brand-midnight/50 transition-colors"
                >
                  <td className="py-2.5 px-3 font-bold text-brand-black dark:text-brand-white">
                    {letter.contentSnapshot?.letterMeta?.titleBangla || letter.letterType}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
                    {letter.letterNumber}
                  </td>
                  <td className="py-2.5 px-3 text-brand-dark-grey">
                    {letter.letterDate}
                  </td>
                  <td className="py-2.5 px-3">
                    {getStatusBadge(letter.status, letter.version)}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div className="inline-flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenPreview(letter)}
                        type="button"
                        title="View Official Document"
                        className="p-1.5 rounded-lg hover:bg-brand-primary/10 text-brand-primary transition-all cursor-pointer"
                      >
                        <FiEye className="text-sm" />
                      </button>
                      <button
                        onClick={() => handleOpenPreview(letter)}
                        type="button"
                        title="Print / Save PDF"
                        className="p-1.5 rounded-lg hover:bg-brand-charcoal/10 text-brand-charcoal dark:text-brand-white transition-all cursor-pointer"
                      >
                        <FiPrinter className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Preview Modal */}
      {isPreviewOpen && previewSnapshot && (
        <LetterPreviewModal
          isOpen={isPreviewOpen}
          onClose={() => setIsPreviewOpen(false)}
          snapshot={previewSnapshot}
          letter={selectedLetter}
        />
      )}
    </div>
  );
}

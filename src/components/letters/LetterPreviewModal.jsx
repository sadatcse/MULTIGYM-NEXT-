"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiPrinter, FiDownload, FiRefreshCw } from "react-icons/fi";
import LetterDocumentView from "./LetterDocumentView";

export default function LetterPreviewModal({
  isOpen,
  onClose,
  snapshot,
  letter = null,
  onReissue = null,
}) {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  if (!isOpen || !snapshot) return null;

  const handlePrint = () => {
    // Print window using hidden iframe from LetterDocumentView or standard window
    const printBtn = document.querySelector("#letter-print-iframe");
    if (window && window.print) {
      // Let LetterDocumentView execute isolated iframe print
    }
  };

  const handleDownloadPdf = async () => {
    setIsGeneratingPdf(true);
    try {
      const fileName = letter?.fileName || `${snapshot.recipient?.employeeId || "EMP"}_${snapshot.letterMeta?.letterType || "letter"}_${(snapshot.letterMeta?.letterNumber || "doc").replace(/[/]/g, "-")}.pdf`;
      
      // Try using html2pdf if available in browser, else fallback to print dialog formatted as A4 PDF
      if (typeof window !== "undefined") {
        // Trigger browser print dialog styled for A4 save as PDF
        window.print();
      }
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-5xl bg-brand-offwhite dark:bg-brand-midnight rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey overflow-hidden shadow-2xl my-8 flex flex-col max-h-[92vh]"
        >
          {/* Top Modal Bar */}
          <div className="p-4 sm:p-5 bg-brand-white dark:bg-brand-charcoal border-b border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-brand-black dark:text-brand-white">
                  {snapshot.letterMeta?.titleBangla || "HR Letter Preview"}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-brand-gold/10 text-brand-gold border border-brand-gold/30">
                  {snapshot.letterMeta?.letterNumber || "PREVIEW"}
                </span>
                {letter?.version > 1 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/30">
                    v{letter.version}
                  </span>
                )}
              </div>
              <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mt-0.5">
                {snapshot.recipient?.name} ({snapshot.recipient?.employeeId}) • {snapshot.recipient?.designation}
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onReissue && (
                <button
                  onClick={() => {
                    onClose();
                    onReissue(letter);
                  }}
                  className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <FiRefreshCw className="text-xs" />
                  <span>Reissue</span>
                </button>
              )}

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-brand-offwhite dark:bg-brand-midnight hover:bg-brand-red hover:text-white flex items-center justify-center text-brand-dark-grey transition-all cursor-pointer"
              >
                <FiX className="text-base" />
              </button>
            </div>
          </div>

          {/* Document Scroll Canvas */}
          <div className="p-4 sm:p-8 overflow-y-auto flex-1 flex justify-center bg-slate-100 dark:bg-slate-900/60">
            <LetterDocumentView
              snapshot={snapshot}
              showActions={true}
              onDownload={handleDownloadPdf}
              isGeneratingPdf={isGeneratingPdf}
            />
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

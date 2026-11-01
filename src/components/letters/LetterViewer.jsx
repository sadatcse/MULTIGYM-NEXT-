"use client";

import { useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FiDownload, FiFileText, FiLoader, FiPrinter } from "react-icons/fi";
import { toast } from "react-toastify";
import { AuthContext } from "@/providers/AuthProvider";
import LetterDocument from "./LetterDocument";
import { downloadLetterPdf, printLetter } from "./letterPrint";
import { watermarkFor } from "./letterConstants";

const PAGE_PX = 794; // 210mm at 96dpi
const MODE_KEY = "hl-print-mode";

const readMode = (fallback) => {
  try {
    return localStorage.getItem(MODE_KEY) || fallback;
  } catch {
    return fallback;
  }
};

/**
 * A4 letter preview with Print / Download PDF and a paper switch:
 *  - "Plain paper": prints the company letterhead, contacts and footer.
 *  - "Company pad": leaves the header/footer blank for pre-printed pads,
 *    using the margins from Settings → Print Header & Footer.
 * The page scales down to fit phones; print/PDF always use the real A4 size.
 */
export default function LetterViewer({ snapshot, status, version = 1, fileName, onAction, toolbarExtra, showToolbar = true, className = "" }) {
  const { company } = useContext(AuthContext) || {};
  const padTopIn = Number(company?.printHeaderInch) || 1.6;
  const padBottomIn = Number(company?.printFooterInch) || 0.75;
  const defaultMode = company?.enablePrintHeader === "no" ? "pad" : "letterhead";

  const [mode, setMode] = useState("letterhead");
  const [busy, setBusy] = useState(null); // "print" | "pdf"
  const [scale, setScale] = useState(1);
  const [height, setHeight] = useState(null);
  const wrapRef = useRef(null);
  const pageRef = useRef(null);

  // Remembered per browser; Settings decides the first-time default.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMode(readMode(defaultMode));
  }, [defaultMode]);

  const changeMode = (m) => {
    setMode(m);
    try {
      localStorage.setItem(MODE_KEY, m);
    } catch {
      // private mode — remember for this page only
    }
  };

  // Fit the A4 page into the available width.
  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const page = pageRef.current;
    if (!wrap || !page) return undefined;
    const measure = () => {
      const s = Math.min(1, (wrap.clientWidth - 2) / PAGE_PX);
      setScale(s);
      setHeight(page.offsetHeight * s);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(page);
    return () => ro.disconnect();
  }, [snapshot, mode]);

  if (!snapshot) {
    return (
      <div className="py-16 text-center text-xs text-brand-dark-grey dark:text-brand-gold-light">
        <FiFileText className="text-3xl mx-auto mb-2 opacity-60" />
        Nothing to preview yet.
      </div>
    );
  }

  const letterNumber = snapshot.letterMeta?.letterNumber || "";
  const footerRef = `${letterNumber}${version > 1 ? ` (v${version})` : ""}`;
  const file =
    fileName || `${snapshot.recipient?.employeeId || "EMP"}_${snapshot.letterMeta?.letterType || "letter"}_${letterNumber.replace(/[/]/g, "-")}${version > 1 ? `_v${version}` : ""}.pdf`;
  const opts = { mode, padTopIn, padBottomIn, footerRef };

  const run = async (kind) => {
    if (busy) return;
    setBusy(kind);
    try {
      if (kind === "print") {
        await printLetter(pageRef.current, { ...opts, title: `${snapshot.letterMeta?.titleBangla || "HR Letter"} — ${letterNumber}` });
        onAction?.("printed");
      } else {
        await downloadLetterPdf(pageRef.current, { ...opts, fileName: file, watermark: watermarkFor(status) });
        onAction?.("downloaded");
      }
    } catch (err) {
      console.error(err);
      toast.error(kind === "pdf" ? "Could not create the PDF. Try Print → Save as PDF instead." : "Could not open the print dialog.");
    } finally {
      setBusy(null);
    }
  };

  const seg = (value, label) => (
    <button
      type="button"
      onClick={() => changeMode(value)}
      className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all cursor-pointer ${
        mode === value ? "bg-brand-gold text-brand-midnight shadow-xs" : "text-brand-dark-grey dark:text-brand-gold-light hover:text-brand-black dark:hover:text-white"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className={`w-full ${className}`}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="bg-brand-offwhite dark:bg-brand-midnight p-1 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 inline-flex items-center gap-1" title="Choose the paper you will print on">
            {seg("letterhead", "Plain paper")}
            {seg("pad", "Company pad")}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {toolbarExtra}
            <button
              type="button"
              onClick={() => run("print")}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-charcoal dark:bg-brand-white text-white dark:text-brand-charcoal font-bold text-xs hover:opacity-90 transition-all cursor-pointer disabled:opacity-50"
            >
              {busy === "print" ? <FiLoader className="animate-spin" /> : <FiPrinter />} Print
            </button>
            <button
              type="button"
              onClick={() => run("pdf")}
              disabled={!!busy}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-red hover:bg-brand-red-dark text-white font-bold text-xs shadow-lg shadow-brand-red/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {busy === "pdf" ? <FiLoader className="animate-spin" /> : <FiDownload />} {busy === "pdf" ? "Creating PDF…" : "Download PDF"}
            </button>
          </div>
        </div>
      )}

      {mode === "pad" && showToolbar && (
        <p className="mb-3 text-[11px] font-semibold text-brand-dark-grey dark:text-brand-gold-light">
          Company pad: header space {padTopIn}&quot; and footer space {padBottomIn}&quot; are left blank (change in Settings → Print Header &amp; Footer).
        </p>
      )}

      <div ref={wrapRef} className="w-full rounded-3xl bg-slate-200/70 dark:bg-slate-900/70 p-3 sm:p-6 overflow-hidden">
        <div style={{ height: height ? height : undefined }} className="relative mx-auto" >
          <div
            style={{ width: PAGE_PX, transform: `scale(${scale})`, transformOrigin: "top left", position: scale < 1 ? "absolute" : "relative", left: 0, top: 0 }}
            className={`shadow-2xl ${scale < 1 ? "" : "mx-auto"}`}
          >
            <LetterDocument ref={pageRef} snapshot={snapshot} status={status} version={version} mode={mode} padTopIn={padTopIn} padBottomIn={padBottomIn} />
          </div>
        </div>
      </div>
    </div>
  );
}

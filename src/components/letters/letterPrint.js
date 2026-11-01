"use client";

import { LETTER_FONT_URL } from "./LetterDocument";

// Print and PDF export for a rendered <LetterDocument>. Both work from the
// letter's own DOM + embedded stylesheet, so the output matches the screen.

const esc = (v) => String(v ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const cssString = (v) => String(v ?? "").replace(/["\\\n]/g, " ");

const SIDE_MM = 16;
const marginsFor = ({ mode, padTopIn = 1.6, padBottomIn = 0.75 }) =>
  mode === "pad" ? { top: `${padTopIn}in`, bottom: `${padBottomIn}in`, topMm: padTopIn * 25.4, bottomMm: padBottomIn * 25.4 } : { top: "14mm", bottom: "16mm", topMm: 14, bottomMm: 16 };

const waitForImages = (doc) =>
  Promise.all(
    Array.from(doc.images || []).map((img) =>
      img.complete ? null : new Promise((r) => { img.onload = img.onerror = r; }),
    ),
  );

/**
 * Prints the letter through a hidden iframe (no pop-up blocker, nothing else
 * from the dashboard on the page). "Save as PDF" in the dialog also works.
 */
export async function printLetter(node, { title = "HR Letter", mode = "letterhead", padTopIn, padBottomIn, footerRef = "" } = {}) {
  if (!node) return;
  const m = marginsFor({ mode, padTopIn, padBottomIn });
  document.getElementById("hl-print-frame")?.remove();
  const iframe = document.createElement("iframe");
  iframe.id = "hl-print-frame";
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;";
  document.body.appendChild(iframe);

  const pageFooter =
    mode === "pad"
      ? ""
      : `@bottom-left { content: "${cssString(footerRef)}"; font: 7.5pt Inter, sans-serif; color: #64748b; }
         @bottom-right { content: "Page " counter(page) " of " counter(pages); font: 7.5pt Inter, sans-serif; color: #64748b; }`;

  const doc = iframe.contentDocument;
  doc.open();
  doc.write(`<!doctype html><html lang="bn"><head><meta charset="utf-8" /><title>${esc(title)}</title>
<link rel="stylesheet" href="${LETTER_FONT_URL}" />
<style>
  @page { size: A4 portrait; margin: ${m.top} ${SIDE_MM}mm ${m.bottom}; ${pageFooter} }
  html, body { margin: 0; padding: 0; background: #fff; }
  .hl-page { width: auto !important; min-height: 0 !important; padding: 0 !important; overflow: visible !important; }
  .hl-watermark { position: fixed !important; }
</style></head><body>${node.outerHTML}</body></html>`);
  doc.close();

  const win = iframe.contentWindow;
  try {
    await Promise.race([Promise.all([win.document.fonts?.ready, waitForImages(win.document)]), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // print anyway with fallback fonts
  }
  win.focus();
  win.print();
  // Remove after the dialog closes (afterprint) or after a minute.
  const cleanup = () => setTimeout(() => iframe.remove(), 500);
  win.addEventListener("afterprint", cleanup, { once: true });
  setTimeout(cleanup, 60000);
}

/**
 * Downloads a real .pdf file. The letter is rendered to A4 pages in the
 * browser, so Bangla text looks exactly as on screen. Page numbers, the
 * memo reference and any DRAFT / CANCELLED watermark are stamped per page.
 */
export async function downloadLetterPdf(node, { fileName = "hr-letter.pdf", mode = "letterhead", padTopIn, padBottomIn, footerRef = "", watermark = "" } = {}) {
  if (!node) return;
  const { default: html2pdf } = await import("html2pdf.js");
  const m = marginsFor({ mode, padTopIn, padBottomIn });

  try {
    await Promise.race([document.fonts?.load?.("16px 'Hind Siliguri'"), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // fall back to system fonts
  }

  // Render an off-screen copy at the printable width (A4 minus side margins).
  const holder = document.createElement("div");
  holder.className = "hl-export";
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${210 - SIDE_MM * 2}mm;background:#fff;z-index:-1;`;
  holder.appendChild(node.cloneNode(true));
  document.body.appendChild(holder);

  try {
    await html2pdf()
      .set({
        margin: [m.topMm, SIDE_MM, m.bottomMm, SIDE_MM],
        filename: fileName,
        image: { type: "jpeg", quality: 0.97 },
        html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait", compress: true },
        pagebreak: { mode: ["css", "legacy"], avoid: [".hl-avoid", "tr"] },
      })
      .from(holder.firstChild)
      .toPdf()
      .get("pdf")
      .then((pdf) => {
        const total = pdf.internal.getNumberOfPages();
        for (let i = 1; i <= total; i++) {
          pdf.setPage(i);
          if (watermark) {
            pdf.saveGraphicsState();
            pdf.setGState(new pdf.GState({ opacity: 0.08 }));
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(84);
            pdf.setTextColor(220, 38, 38);
            pdf.text(watermark, 38, 220, { angle: 32 });
            pdf.restoreGraphicsState();
          }
          if (mode !== "pad") {
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(7.5);
            pdf.setTextColor(100, 116, 139);
            if (footerRef) pdf.text(`Ref: ${footerRef}`, SIDE_MM, 291);
            pdf.text(`Page ${i} of ${total}`, 210 - SIDE_MM, 291, { align: "right" });
          }
        }
      })
      .save();
  } finally {
    holder.remove();
  }
}

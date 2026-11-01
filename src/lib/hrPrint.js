"use client";

// Opens a clean, branded A4 print window for a report. The user prints or
// chooses "Save as PDF" in the browser dialog — no PDF library needed, and
// Bangla text renders with the system fonts exactly as on screen.

const esc = (v) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

export function tableHtml(headers, rows, { totals } = {}) {
  const head = headers.map((h) => `<th>${esc(h)}</th>`).join("");
  const body = rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("");
  const foot = totals ? `<tfoot><tr>${totals.map((c) => `<td>${esc(c)}</td>`).join("")}</tr></tfoot>` : "";
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody>${foot}</table>`;
}

// Document styles as [selector, declarations]; scoped under a class for the
// in-page PDF render, unscoped for the print window.
const RULES = [
  ["@page", "", true],
  [":root", "font-family: \"Segoe UI\", \"Noto Sans Bengali\", Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.4; margin: 0; background: #fff;"],
  ["*", "box-sizing: border-box;"],
  [".head", "display:flex; align-items:center; border-bottom: 3px solid #E6BB60; padding-bottom: 8px; margin-bottom: 12px;"],
  [".head h1", "font-size: 18px; margin: 0;"],
  [".head p", "margin: 2px 0 0; color: #555; font-size: 10px;"],
  ["h2", "font-size: 14px; margin: 6px 0 2px;"],
  [".sub", "color:#555; margin: 0 0 10px;"],
  ["table", "width: 100%; border-collapse: collapse; margin: 6px 0 12px;"],
  ["th, td", "border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: middle; line-height: 1.4;"],
  ["th", "background: #18181B; color: #F0D494; font-size: 10px; text-transform: uppercase; letter-spacing: .03em;"],
  ["tfoot td", "font-weight: 700; background: #f6f1e4;"],
  ["tr:nth-child(even) td", "background: #fafafa;"],
  ["tr", "page-break-inside: avoid;"],
  [".grid", "display:grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin-bottom: 10px;"],
  [".grid div", "border-bottom: 1px dotted #bbb; padding: 3px 0;"],
  [".grid b", "display:inline-block; min-width: 130px; color:#333;"],
  [".sign", "display:flex; justify-content: space-between; margin-top: 46px; gap: 16px;"],
  [".sign div", "flex:1; border-top: 1px solid #333; text-align:center; padding-top: 4px; font-size: 10px;"],
  [".foot", "margin-top: 18px; font-size: 9px; color: #777; text-align:center;"],
];

function styles(scope, landscape) {
  return RULES.map(([sel, decl, page]) => {
    if (page) return scope ? "" : `@page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 12mm; }`;
    if (sel === ":root") return `${scope || "body"} { ${decl} }`;
    const s = sel
      .split(",")
      .map((x) => (scope ? `${scope} ${x.trim()}` : x.trim()))
      .join(", ");
    return `${s} { ${decl} }`;
  }).join("\n");
}

function markup({ title, subtitle = "", company = {}, bodyHtml }) {
  const logo = company.logo ? `<img src="${esc(company.logo)}" crossorigin="anonymous" style="height:46px;margin-right:12px" />` : "";
  return `<div class="head">${logo}<div><h1>${esc(company.companyName || "Multigym HR")}</h1><p>${esc(company.address || "")}</p></div></div>
<h2>${esc(title)}</h2>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}
${bodyHtml}
<div class="foot">Generated ${esc(new Date().toLocaleString("en-GB"))} — computer-generated document.</div>`;
}

export function printDocument({ title, subtitle = "", company = {}, bodyHtml, landscape = false }) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) {
    alert("Please allow pop-ups to print / save as PDF.");
    return;
  }
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
${styles("", landscape)}
</style></head><body>
${markup({ title, subtitle, company, bodyHtml })}
<script>window.onload = () => { setTimeout(() => window.print(), 250); };</script>
</body></html>`);
  w.document.close();
}

/**
 * Same document as printDocument, saved straight to a .pdf file (A4) without
 * the print dialog. Rendered from HTML in the browser, so Bangla text keeps
 * the system fonts.
 */
export async function downloadDocumentPdf({ title, subtitle = "", company = {}, bodyHtml, landscape = false, fileName }) {
  const { default: html2pdf } = await import("html2pdf.js");
  const holder = document.createElement("div");
  holder.style.cssText = `position:fixed;left:-10000px;top:0;width:${landscape ? 273 : 186}mm;z-index:-1;`;
  holder.innerHTML = `<div class="hpdoc" style="padding-bottom:6mm"><style>${styles(".hpdoc", landscape)}</style>${markup({ title, subtitle, company, bodyHtml })}</div>`;
  document.body.appendChild(holder);
  try {
    await html2pdf()
      .set({
        margin: 12,
        filename: fileName || `${title.replace(/[^\w-]+/g, "_")}.pdf`,
        image: { type: "jpeg", quality: 0.95 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          backgroundColor: "#ffffff",
          logging: false,
          // The renderer copies the whole page and can't read Tailwind's oklch()
          // colours, so the copy keeps only this document's own styles.
          onclone: (doc) => {
            doc.querySelectorAll('style, link[rel="stylesheet"]').forEach((n) => {
              if (!n.closest(".hpdoc")) n.remove();
            });
            doc.documentElement.removeAttribute("class");
            doc.documentElement.removeAttribute("style");
            doc.body.removeAttribute("class");
            doc.body.style.cssText = "background:#fff;color:#111;margin:0;";
          },
        },
        jsPDF: { unit: "mm", format: "a4", orientation: landscape ? "landscape" : "portrait", compress: true },
        pagebreak: { mode: ["css", "legacy"], avoid: ["tr", ".sign", ".grid"] },
      })
      .from(holder.firstChild)
      .save();
  } finally {
    holder.remove();
  }
}

export { esc as escapeHtml };

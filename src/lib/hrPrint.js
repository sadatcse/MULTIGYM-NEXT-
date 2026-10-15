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

export function printDocument({ title, subtitle = "", company = {}, bodyHtml, landscape = false }) {
  const w = window.open("", "_blank", "width=1100,height=800");
  if (!w) {
    alert("Please allow pop-ups to print / save as PDF.");
    return;
  }
  const logo = company.logo ? `<img src="${esc(company.logo)}" style="height:46px;margin-right:12px" />` : "";
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  @page { size: A4 ${landscape ? "landscape" : "portrait"}; margin: 12mm; }
  * { box-sizing: border-box; }
  body { font-family: "Segoe UI", "Noto Sans Bengali", Arial, sans-serif; color: #111; font-size: 11px; margin: 0; }
  .head { display:flex; align-items:center; border-bottom: 3px solid #E6BB60; padding-bottom: 8px; margin-bottom: 12px; }
  .head h1 { font-size: 18px; margin: 0; }
  .head p { margin: 2px 0 0; color: #555; font-size: 10px; }
  h2 { font-size: 14px; margin: 6px 0 2px; }
  .sub { color:#555; margin: 0 0 10px; }
  table { width: 100%; border-collapse: collapse; margin: 6px 0 12px; }
  th, td { border: 1px solid #ccc; padding: 4px 6px; text-align: left; vertical-align: top; }
  th { background: #18181B; color: #F0D494; font-size: 10px; text-transform: uppercase; letter-spacing: .03em; }
  tfoot td { font-weight: 700; background: #f6f1e4; }
  tr:nth-child(even) td { background: #fafafa; }
  .grid { display:grid; grid-template-columns: 1fr 1fr; gap: 4px 18px; margin-bottom: 10px; }
  .grid div { border-bottom: 1px dotted #bbb; padding: 3px 0; }
  .grid b { display:inline-block; min-width: 130px; color:#333; }
  .sign { display:flex; justify-content: space-between; margin-top: 46px; gap: 16px; }
  .sign div { flex:1; border-top: 1px solid #333; text-align:center; padding-top: 4px; font-size: 10px; }
  .foot { margin-top: 18px; font-size: 9px; color: #777; text-align:center; }
</style></head><body>
<div class="head">${logo}<div><h1>${esc(company.companyName || "Multigym HR")}</h1><p>${esc(company.address || "")}</p></div></div>
<h2>${esc(title)}</h2>${subtitle ? `<p class="sub">${esc(subtitle)}</p>` : ""}
${bodyHtml}
<div class="foot">Generated ${esc(new Date().toLocaleString("en-GB"))} — computer-generated document.</div>
<script>window.onload = () => { setTimeout(() => window.print(), 250); };</script>
</body></html>`);
  w.document.close();
}

export { esc as escapeHtml };

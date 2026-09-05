"use client";

import * as XLSX from "xlsx";
import { toast } from "react-toastify";

/**
 * Export array of objects to Excel (.xlsx)
 * @param {Array} data - Array of plain objects
 * @param {String} fileName - Desired file name (without extension)
 * @param {String} sheetName - Excel sheet tab name
 */
export const exportToExcel = (data, fileName = "vendor_report", sheetName = "Report") => {
  if (!data || data.length === 0) {
    toast.warning("No data available to export.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);

  const cleanName = fileName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  XLSX.writeFile(wb, `${cleanName}.xlsx`);
  toast.success("Excel report exported successfully!");
};

/**
 * Export array of objects to CSV (.csv)
 * @param {Array} data - Array of plain objects
 * @param {String} fileName - Desired file name (without extension)
 */
export const exportToCsv = (data, fileName = "vendor_report") => {
  if (!data || data.length === 0) {
    toast.warning("No data available to export.");
    return;
  }
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  const cleanName = fileName.replace(/[^a-zA-Z0-9_\-]/g, "_");
  XLSX.writeFile(wb, `${cleanName}.csv`, { bookType: "csv" });
  toast.success("CSV report exported successfully!");
};

export const exportToCSV = exportToCsv;

/**
 * Copy formatted data rows to System Clipboard
 * @param {Array} headers - List of column header titles
 * @param {Array} rows - List of array row data
 */
export const copyTableToClipboard = (headers = [], rows = []) => {
  if (!rows || rows.length === 0) {
    toast.warning("No data available to copy.");
    return;
  }

  const headerLine = headers.join("\t");
  const rowLines = rows.map((r) => r.join("\t"));
  const fullText = [headerLine, ...rowLines].join("\n");

  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(fullText).then(() => {
      toast.success("Table data copied to clipboard!");
    }).catch((err) => {
      console.error("Failed to copy:", err);
      toast.error("Failed to copy data to clipboard.");
    });
  } else {
    // Fallback for older browsers
    const textarea = document.createElement("textarea");
    textarea.value = fullText;
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    toast.success("Table data copied to clipboard!");
  }
};

/**
 * Generates an isolated HTML document and opens standard print window formatted for A4 paper.
 * Does not rely on main application DOM elements or styles.
 */
export const printHtmlReport = (optionsOrTitle, rawHtmlBody = null) => {
  let title = "Report";
  let dateStr = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  let preparedBy = "System Administrator";
  let branchFilter = "All Branches";
  let departmentFilter = "All Depts";
  let headers = [];
  let rows = [];
  let stats = [];

  let siteSettings = {};

  const executePrintInIframe = (html) => {
    let iframe = document.getElementById("print-iframe-element");
    if (iframe) {
      document.body.removeChild(iframe);
    }

    iframe = document.createElement("iframe");
    iframe.id = "print-iframe-element";
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "0";
    iframe.style.visibility = "hidden";
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 250);
  };

  if (typeof optionsOrTitle === "string") {
    title = optionsOrTitle;
    if (typeof rawHtmlBody === "string") {
      const rawHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; color: #111827; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; }
            th, td { padding: 8px; border: 1px solid #d1d5db; text-align: left; font-size: 11px; }
            th { background: #f3f4f6; text-transform: uppercase; font-size: 10px; font-weight: 800; }
            @page { size: A4 portrait; margin: 10mm; }
          </style>
        </head>
        <body>${rawHtmlBody}</body>
        </html>
      `;
      executePrintInIframe(rawHtml);
      return;
    }
  } else if (optionsOrTitle && typeof optionsOrTitle === "object") {
    title = optionsOrTitle.title || title;
    dateStr = optionsOrTitle.dateStr || dateStr;
    preparedBy = optionsOrTitle.preparedBy || preparedBy;
    branchFilter = optionsOrTitle.branchFilter || branchFilter;
    departmentFilter = optionsOrTitle.departmentFilter || departmentFilter;
    headers = optionsOrTitle.headers || [];
    rows = optionsOrTitle.rows || [];
    stats = optionsOrTitle.stats || [];
    siteSettings = optionsOrTitle.settings || optionsOrTitle.siteSettings || {};
  }

  // Universal Gym Company Information & Print Margin Settings
  const companyName = optionsOrTitle?.companyName || siteSettings.companyName || "Multigym HR";
  const companyTagline = optionsOrTitle?.companyTagline || siteSettings.companyTagline || "Complete Enterprise HR & Payroll Management";
  const companyAddress = optionsOrTitle?.companyAddress || siteSettings.address || "House 12, Road 5, Dhanmondi, Dhaka 1205, Bangladesh";
  const phone = optionsOrTitle?.phone || siteSettings.phone || "+880 1700-000000";
  const email = optionsOrTitle?.email || siteSettings.email || "info@multigymhr.com";
  const website = optionsOrTitle?.website || siteSettings.website || "https://multigymhr.com";
  const taxNumber = optionsOrTitle?.taxNumber || siteSettings.taxNumber || "BIN-123456789";
  const logo = optionsOrTitle?.logo || siteSettings.logo || "";

  const enablePrintHeader = optionsOrTitle?.enablePrintHeader ?? siteSettings.enablePrintHeader ?? "yes";
  const enablePrintFooter = optionsOrTitle?.enablePrintFooter ?? siteSettings.enablePrintFooter ?? "yes";
  const printHeaderText = optionsOrTitle?.printHeaderText || siteSettings.printHeaderText || "MULTIGYM HR MANAGEMENT SYSTEM";
  const printFooterText = optionsOrTitle?.printFooterText || siteSettings.printFooterText || "This is a computer-generated document. No signature required.";

  const statsHtml = stats && stats.length > 0 ? `
    <div style="display: grid; grid-template-columns: repeat(${Math.min(stats.length, 4)}, 1fr); gap: 12px; margin-bottom: 20px;">
      ${stats.map(s => `
        <div style="padding: 10px 14px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 10px;">
          <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6b7280; letter-spacing: 0.5px;">${s.label}</div>
          <div style="font-size: 16px; font-weight: 900; color: #111827; margin-top: 4px;">${s.value}</div>
        </div>
      `).join('')}
    </div>
  ` : '';

  const tableHeaderHtml = headers.map(h => {
    let align = "left";
    const lower = h.toLowerCase();
    if (lower === "sl" || lower === "qty" || lower.includes("size") || lower.includes("status") || lower.includes("code") || lower.includes("date") || lower.includes("condition")) {
      align = "center";
    }

    return `<th style="padding: 8px 10px; font-size: 10px; font-weight: 900; text-transform: uppercase; color: #111827; background-color: #e5e7eb; border: 1px solid #9ca3af; text-align: ${align}; vertical-align: middle; line-height: 1.3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">${h}</th>`;
  }).join('');

  const tableRowsHtml = rows.map((row) => `
    <tr style="border-bottom: 1px solid #e5e7eb;">
      ${row.map((cell, colIdx) => {
        const headerName = (headers[colIdx] || "").toLowerCase();
        let align = "left";
        if (headerName === "sl" || headerName === "qty" || headerName.includes("size") || headerName.includes("status") || headerName.includes("code") || headerName.includes("date") || headerName.includes("condition")) {
          align = "center";
        }
        return `<td style="padding: 7px 10px; font-size: 9.5px; color: #1f2937; border: 1px solid #d1d5db; text-align: ${align}; vertical-align: middle; line-height: 1.3; word-break: break-word;">${cell !== undefined && cell !== null ? cell : ''}</td>`;
      }).join('')}
    </tr>
  `).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        @page {
          size: A4 portrait;
          margin: 12mm 10mm 15mm 10mm;
        }
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          color: #111827;
          background: #ffffff;
          margin: 0;
          padding: 0;
          -webkit-print-color-adjust: exact;
          print-color-adjust: exact;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 14px;
          page-break-inside: auto;
        }
        tr {
          page-break-inside: avoid;
          page-break-after: auto;
        }
        thead {
          display: table-header-group;
        }
        tfoot {
          display: table-footer-group;
        }
        .filter-badge {
          display: inline-block;
          padding: 2px 8px;
          background-color: #f3f4f6;
          border-radius: 4px;
          font-size: 9.5px;
          font-weight: 700;
          color: #374151;
        }
        .gym-header {
          border-bottom: 2.5px solid #d97706;
          padding-bottom: 12px;
          margin-bottom: 16px;
        }
        .gym-footer {
          border-top: 1.5px solid #d97706;
          padding-top: 10px;
          margin-top: 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 9px;
          color: #6b7280;
        }
      </style>
    </head>
    <body>
      ${enablePrintHeader !== "no" ? `
      <!-- UNIVERSAL GYM A4 HEADER -->
      <div class="gym-header">
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="display: flex; align-items: center; gap: 14px;">
            ${logo ? `
              <img src="${logo}" style="max-height: 48px; max-width: 120px; object-fit: contain;" alt="Logo" />
            ` : `
              <div style="width: 44px; height: 44px; background: #111827; border-radius: 10px; border: 2px solid #d97706; display: flex; align-items: center; justify-content: center; color: #d97706; font-weight: 900; font-size: 16px;">
                MG
              </div>
            `}
            <div>
              <h1 style="font-size: 17px; font-weight: 900; color: #111827; margin: 0 0 2px 0; text-transform: uppercase; letter-spacing: -0.3px;">
                ${companyName}
              </h1>
              <div style="font-size: 10px; font-weight: 800; color: #d97706; text-transform: uppercase; letter-spacing: 0.5px;">
                ${companyTagline}
              </div>
              <div style="font-size: 9px; color: #4b5563; margin-top: 3px;">
                ${companyAddress}
              </div>
            </div>
          </div>

          <div style="text-align: right; font-size: 9px; color: #4b5563; line-height: 1.4;">
            <div style="font-weight: 800; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">${printHeaderText}</div>
            <div>Phone: <strong>${phone}</strong> | Email: <strong>${email}</strong></div>
            <div>Web: <strong>${website}</strong> | Tax/BIN: <strong>${taxNumber}</strong></div>
          </div>
        </div>

        <div style="margin-top: 10px; padding-top: 8px; border-top: 1px dashed #e5e7eb; display: flex; justify-content: space-between; align-items: flex-end; gap: 16px;">
          <div style="flex: 1; min-width: 0;">
            <h2 style="font-size: 13px; font-weight: 900; color: #d97706; margin: 0; text-transform: uppercase; letter-spacing: -0.3px; line-height: 1.3; word-break: break-word;">
              ${title}
            </h2>
          </div>
          <div style="text-align: right; flex-shrink: 0; white-space: nowrap;">
            <div style="font-size: 9px; color: #4b5563; line-height: 1.4;">
              <span>Date: <strong>${dateStr}</strong></span>
              <span style="margin-left: 10px;">Prepared By: <strong>${preparedBy}</strong></span>
            </div>
            <div style="margin-top: 4px; display: flex; gap: 4px; justify-content: flex-end;">
              <span class="filter-badge">Branch: ${branchFilter}</span>
              <span class="filter-badge">Dept: ${departmentFilter}</span>
            </div>
          </div>
        </div>
      </div>
      ` : ''}

      ${statsHtml}

      <table>
        <thead>
          <tr>${tableHeaderHtml}</tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      ${enablePrintFooter !== "no" ? `
      <!-- UNIVERSAL GYM A4 FOOTER -->
      <div class="gym-footer">
        <div>
          <span style="font-weight: 800; color: #111827;">${companyName}</span> • ${website} • Support: ${phone}
        </div>
        <div style="font-style: italic; color: #4b5563; text-align: center;">
          ${printFooterText}
        </div>
        <div style="font-weight: 700; color: #111827;">
          Confidential • Official HR Document
        </div>
      </div>
      ` : ''}
    </body>
    </html>
  `;

  executePrintInIframe(htmlContent);
};

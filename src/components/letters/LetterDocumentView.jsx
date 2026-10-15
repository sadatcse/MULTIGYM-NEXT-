"use client";

import React, { useRef } from "react";
import { FiPrinter, FiDownload, FiCheckCircle } from "react-icons/fi";

export default function LetterDocumentView({
  snapshot,
  showActions = true,
  onPrint = null,
  onDownload = null,
  isGeneratingPdf = false,
}) {
  const documentRef = useRef(null);

  if (!snapshot) {
    return (
      <div className="p-8 text-center text-brand-dark-grey">
        No document snapshot available.
      </div>
    );
  }

  const {
    company = {},
    branch = null,
    letterMeta = {},
    recipient = {},
    infoTable = [],
    sections = [],
    signatories = {},
    acknowledgementRequired = true,
  } = snapshot;

  const handleNativePrint = () => {
    if (onPrint) {
      onPrint();
      return;
    }

    // Direct isolated iframe print
    const content = documentRef.current?.innerHTML;
    if (!content) return;

    let iframe = document.getElementById("letter-print-iframe");
    if (iframe) document.body.removeChild(iframe);

    iframe = document.createElement("iframe");
    iframe.id = "letter-print-iframe";
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
    doc.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${letterMeta.titleBangla || "HR Letter"} - ${letterMeta.letterNumber || ""}</title>
        <meta charset="utf-8" />
        <link href="https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 15mm 15mm 15mm 15mm;
          }
          * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
          }
          body {
            font-family: 'Hind Siliguri', 'Inter', sans-serif;
            color: #111827;
            background: #ffffff;
            font-size: 11.5pt;
            line-height: 1.55;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .letter-container {
            width: 100%;
            max-width: 100%;
            margin: 0 auto;
          }
          .header-title {
            font-size: 18pt;
            font-weight: 800;
            letter-spacing: 0.5px;
            color: #0f172a;
            text-align: center;
          }
          .header-tagline {
            font-size: 10pt;
            font-weight: 600;
            color: #475569;
            text-align: center;
            margin-top: 2px;
            margin-bottom: 12px;
          }
          .letter-badge-box {
            text-align: center;
            margin-bottom: 14px;
          }
          .letter-badge {
            display: inline-block;
            border: 1.5px solid #0f172a;
            padding: 4px 16px;
            font-size: 12.5pt;
            font-weight: 700;
            border-radius: 4px;
            background-color: #f8fafc;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5pt;
            font-weight: 600;
            padding: 6px 0;
            border-bottom: 1px solid #e2e8f0;
            margin-bottom: 12px;
          }
          .subject-row {
            font-size: 11pt;
            font-weight: 700;
            color: #0f172a;
            margin-bottom: 14px;
            padding: 4px 0;
            border-bottom: 1px dashed #cbd5e1;
          }
          table.info-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 16px;
            font-size: 10.5pt;
          }
          table.info-table th, table.info-table td {
            border: 1px solid #cbd5e1;
            padding: 5px 8px;
            text-align: left;
          }
          table.info-table th {
            background-color: #f1f5f9;
            width: 32%;
            font-weight: 600;
            color: #334155;
          }
          table.info-table td {
            font-weight: 600;
            color: #0f172a;
          }
          .section-heading {
            font-size: 11pt;
            font-weight: 700;
            color: #0f172a;
            margin-top: 14px;
            margin-bottom: 6px;
            text-decoration: underline;
          }
          .clause-item {
            margin-bottom: 4px;
            text-align: justify;
            font-size: 10.5pt;
          }
          .ack-box {
            margin-top: 18px;
            border: 1px solid #cbd5e1;
            border-radius: 6px;
            padding: 10px;
            background: #fafafa;
            page-break-inside: avoid;
          }
          .ack-heading {
            font-size: 10.5pt;
            font-weight: 700;
            margin-bottom: 6px;
            color: #0f172a;
          }
          .sig-row {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 36px;
            padding-top: 12px;
            page-break-inside: avoid;
          }
          .sig-block {
            width: 45%;
            font-size: 10pt;
            line-height: 1.4;
          }
          .copy-to-box {
            margin-top: 18px;
            font-size: 9pt;
            color: #475569;
            page-break-inside: avoid;
          }
        </style>
      </head>
      <body>
        <div class="letter-container">
          ${content}
        </div>
      </body>
      </html>
    `);
    doc.close();

    setTimeout(() => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    }, 400);
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Action Bar */}
      {showActions && (
        <div className="w-full max-w-4xl mb-4 flex items-center justify-between bg-brand-white dark:bg-brand-charcoal p-3.5 rounded-2xl border border-brand-beige/60 dark:border-brand-dark-grey shadow-sm print:hidden">
          <div className="flex items-center gap-2 text-xs font-bold text-brand-dark-grey dark:text-brand-sage">
            <span className="px-2.5 py-1 rounded-full bg-brand-primary/10 text-brand-primary font-black uppercase text-[10px]">
              {letterMeta.letterType?.toUpperCase() || "HR LETTER"}
            </span>
            <span>{letterMeta.letterNumber}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleNativePrint}
              type="button"
              className="px-4 py-2 rounded-xl bg-brand-charcoal dark:bg-brand-white text-white dark:text-brand-charcoal font-black text-xs hover:opacity-90 transition-all flex items-center gap-2 shadow-sm cursor-pointer"
            >
              <FiPrinter className="text-sm" />
              <span>Print Letter</span>
            </button>

            {onDownload && (
              <button
                onClick={onDownload}
                disabled={isGeneratingPdf}
                type="button"
                className="px-4 py-2 rounded-xl bg-brand-primary text-white font-black text-xs hover:bg-brand-secondary transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <FiDownload className="text-sm" />
                <span>{isGeneratingPdf ? "Generating PDF..." : "Download PDF"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* A4 Paper Canvas */}
      <div
        ref={documentRef}
        id="hr-letter-printable-content"
        className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 p-8 sm:p-12 shadow-2xl rounded-2xl border border-slate-200 dark:border-transparent font-['Hind_Siliguri','Inter',sans-serif] text-[11.5pt] leading-relaxed transition-all"
        style={{ fontFamily: "'Hind Siliguri', 'Inter', sans-serif" }}
      >
        {/* Header Branding */}
        <div className="text-center pb-4 border-b-2 border-slate-900 mb-5">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 uppercase">
            {company.name || "MULTI GYM PREMIUM & MULTI GYM"}
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-600 mt-0.5 tracking-wide">
            {company.brands || "Multi Gym Premium  |  Multi Gym  |  Power FiT"}
          </p>
          {branch && (
            <p className="text-[10px] text-slate-500 mt-1 font-medium">
              Branch: {branch.name} • {branch.address} • Phone: {branch.phone}
            </p>
          )}
        </div>

        {/* Letter Official Badge */}
        <div className="text-center mb-5">
          <span className="inline-block px-5 py-1.5 border-2 border-slate-900 rounded bg-slate-50 font-bold text-base sm:text-lg text-slate-900 shadow-xs">
            {letterMeta.titleBangla} {letterMeta.titleEnglish ? `(${letterMeta.titleEnglish})` : ""}
          </span>
        </div>

        {/* Memo & Date Meta Line */}
        <div className="flex justify-between items-center text-xs sm:text-sm font-bold border-b border-slate-200 pb-2 mb-4 text-slate-800">
          <div>
            <span>মেমো নং: </span>
            <span className="font-extrabold text-slate-900">{letterMeta.letterNumber}</span>
          </div>
          <div>
            <span>তারিখ: </span>
            <span className="font-extrabold text-slate-900">{letterMeta.letterDate}</span>
          </div>
        </div>

        {/* Subject Line */}
        <div className="text-sm sm:text-base font-bold text-slate-950 mb-4 pb-2 border-b border-dashed border-slate-300">
          {letterMeta.subject}
        </div>

        {/* Information Table (Section 1) */}
        {infoTable && infoTable.length > 0 && (
          <div className="mb-5">
            <h2 className="text-xs sm:text-sm font-black uppercase text-slate-800 mb-2">
              ১। প্রয়োজনীয় তথ্য বিবরণী
            </h2>
            <div className="overflow-hidden border border-slate-300 rounded">
              <table className="w-full text-xs sm:text-sm border-collapse">
                <tbody>
                  {infoTable.map((row, idx) => (
                    <tr
                      key={row.key || idx}
                      className={idx % 2 === 0 ? "bg-slate-50/70" : "bg-white"}
                    >
                      <th className="w-[38%] py-1.5 px-3 text-left font-semibold text-slate-700 border-b border-r border-slate-200">
                        {row.labelBangla}
                      </th>
                      <td className="py-1.5 px-3 font-bold text-slate-950 border-b border-slate-200">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Body Sections / Clauses */}
        {sections && sections.length > 0 && (
          <div className="space-y-4 text-xs sm:text-sm text-slate-900">
            {sections.map((sec, sIdx) => (
              <div key={sIdx} className="space-y-1.5">
                <h3 className="font-bold text-slate-950 text-sm sm:text-base underline decoration-slate-400 underline-offset-4">
                  {sec.sectionNumber}। {sec.titleBangla} {sec.titleEnglish ? `(${sec.titleEnglish})` : ""}
                </h3>
                {sec.introText && (
                  <p className="text-justify leading-relaxed text-slate-800">
                    {sec.introText}
                  </p>
                )}
                {sec.clauses && sec.clauses.length > 0 && (
                  <div className="space-y-1 pl-1">
                    {sec.clauses.map((clause, cIdx) => (
                      <p key={cIdx} className="text-justify leading-relaxed text-slate-800">
                        {clause}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Employee Consent / Undertaking Box (if required) */}
        {acknowledgementRequired && (
          <div className="mt-6 border border-slate-300 rounded p-4 bg-slate-50/60 text-xs sm:text-sm space-y-2">
            <h4 className="font-bold text-slate-900 text-sm">
              কর্মকর্তা/কর্মচারীর সম্মতি ও প্রাপ্তি স্বীকার
            </h4>
            <p className="text-slate-700 text-xs italic">
              &quot;আমি উপরোক্ত সকল শর্তাবলী মনোযোগসহকারে পড়েছি, বুঝেছি এবং স্বেচ্ছায় মেনে নিয়ে এই পত্রের অনুলিপি গ্রহণ করলাম।&quot;
            </p>
            <div className="grid grid-cols-2 gap-3 pt-3 text-xs text-slate-800 border-t border-slate-200">
              <div>
                <span className="font-medium text-slate-600 block">স্বাক্ষর:</span>
                <div className="h-6 border-b border-dotted border-slate-400 mt-1"></div>
              </div>
              <div>
                <span className="font-medium text-slate-600 block">নাম:</span>
                <span className="font-bold text-slate-900 block mt-1">{recipient.name}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 block">Employee ID:</span>
                <span className="font-bold text-slate-900 block mt-1">{recipient.employeeId || "EMP"}</span>
              </div>
              <div>
                <span className="font-medium text-slate-600 block">তারিখ:</span>
                <div className="h-6 border-b border-dotted border-slate-400 mt-1"></div>
              </div>
              {recipient.phone && (
                <div>
                  <span className="font-medium text-slate-600 block">মোবাইল নম্বর:</span>
                  <span className="font-bold text-slate-900 block mt-1">{recipient.phone}</span>
                </div>
              )}
              {recipient.nidPassport && (
                <div>
                  <span className="font-medium text-slate-600 block">জাতীয় পরিচয়পত্র নম্বর:</span>
                  <span className="font-bold text-slate-900 block mt-1">{recipient.nidPassport}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Dual Administrative Signatures */}
        <div className="mt-10 pt-4 flex justify-between items-end text-xs sm:text-sm border-t border-slate-200">
          {/* Left Signatory (HR / Issued By) */}
          <div className="w-[45%] text-left space-y-0.5">
            <p className="font-semibold text-slate-600 mb-6">কার্যার্থেঃ</p>
            <div className="h-8"></div>
            <p className="font-extrabold text-slate-950 text-sm">
              {signatories.issuedBy?.name || "মোঃ ফয়জুর রহমান মানিক"}
            </p>
            <p className="font-semibold text-slate-700">
              {signatories.issuedBy?.designation || "Manager: Admin & HR"}
            </p>
            {signatories.issuedBy?.title && (
              <p className="text-slate-600 text-[11px]">{signatories.issuedBy?.title}</p>
            )}
            <p className="text-[11px] text-slate-600">মাল্টি জিম প্রিমিয়াম ও মাল্টি জিম</p>
          </div>

          {/* Right Signatory (Director / MD) */}
          <div className="w-[45%] text-right space-y-0.5">
            <div className="h-8"></div>
            <p className="font-extrabold text-slate-950 text-sm">
              {signatories.approvedBy?.name || "কর্নেল মোঃ বনী ইয়ামীন (অবঃ)"}
            </p>
            <p className="font-semibold text-slate-700">
              {signatories.approvedBy?.designation || "পরিচালক"}
            </p>
            <p className="text-[11px] text-slate-600">
              {signatories.approvedBy?.company || "মাল্টি জিম প্রিমিয়াম ও মাল্টি জিম"}
            </p>
            <p className="text-[11px] font-bold text-slate-700">
              {signatories.approvedBy?.onBehalfOf || "পক্ষে, ব্যবস্থাপনা পরিচালক"}
            </p>
          </div>
        </div>

        {/* Copy Distribution List (অবগতিঃ) */}
        {signatories.copyTo && signatories.copyTo.length > 0 && (
          <div className="mt-8 pt-3 border-t border-slate-200 text-[10px] sm:text-xs text-slate-600">
            <p className="font-bold text-slate-800 mb-1">অবগতি ও প্রয়োজনীয় কার্যার্থে অনুলিপি প্রেরণ করা হলোঃ</p>
            <ol className="list-decimal list-inside space-y-0.5 pl-1">
              {signatories.copyTo.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
              <li>ব্যক্তিগত নথি / অফিস কপি</li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}

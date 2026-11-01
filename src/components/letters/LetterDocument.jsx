"use client";

import { useEffect } from "react";
import { watermarkFor } from "./letterConstants";

// One renderer for the official letter, used on screen, in the print window
// and for PDF export. It is styled with the plain CSS below (no Tailwind) so
// the exact same markup + stylesheet can be copied into a print iframe or a
// PDF capture and look identical everywhere.

export const LETTER_FONT_URL =
  "https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&family=Inter:wght@400;600;700;800&display=swap";

export const LETTER_FONT_STACK = "'Hind Siliguri', 'Noto Sans Bengali', 'SolaimanLipi', 'Inter', 'Segoe UI', sans-serif";

export const LETTER_CSS = `
.hl-page { position: relative; box-sizing: border-box; width: 210mm; min-height: 297mm; margin: 0 auto;
  padding: var(--hl-top, 16mm) 16mm var(--hl-bottom, 16mm); background: #fff; color: #111827;
  font-family: ${LETTER_FONT_STACK}; font-size: 10.5pt; line-height: 1.6; overflow: hidden;
  -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.hl-page *, .hl-page *::before, .hl-page *::after { box-sizing: border-box; }
.hl-page p { margin: 0; }
.hl-avoid { break-inside: avoid; page-break-inside: avoid; }

.hl-watermark { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; pointer-events: none; z-index: 0; }
.hl-watermark span { transform: rotate(-32deg); font: 800 92pt/1 Inter, sans-serif; letter-spacing: 8pt; color: rgba(220, 38, 38, .09); white-space: nowrap; }
.hl-body { position: relative; z-index: 1; }

.hl-head { display: flex; align-items: center; gap: 12pt; padding-bottom: 9pt; border-bottom: 2.5pt solid #111827; position: relative; }
.hl-head::after { content: ""; position: absolute; left: 0; right: 0; bottom: -5pt; height: 1.2pt; background: #E6BB60; }
.hl-logo { height: 46pt; width: auto; max-width: 120pt; object-fit: contain; }
.hl-brand { flex: 1; min-width: 0; }
.hl-company { font: 800 17pt/1.15 Inter, ${LETTER_FONT_STACK}; letter-spacing: .3pt; text-transform: uppercase; color: #0f172a; }
.hl-tagline { font-size: 8.5pt; font-weight: 600; color: #475569; margin-top: 2pt; letter-spacing: .4pt; }
.hl-contact { text-align: right; font-size: 7.8pt; line-height: 1.45; color: #475569; max-width: 190pt; }
.hl-contact b { color: #0f172a; font-weight: 600; }
.hl-branch { margin-top: 10pt; font-size: 8pt; color: #64748b; text-align: center; }
.hl-pad-space { height: 0; }

.hl-title { text-align: center; margin: 16pt 0 12pt; }
.hl-title span { display: inline-block; border: 1.4pt solid #0f172a; border-radius: 3pt; padding: 3pt 16pt; font-size: 13.5pt; font-weight: 700; color: #0f172a; background: #f8fafc; }
.hl-title small { display: block; font: 600 8pt/1.4 Inter, sans-serif; letter-spacing: 1.6pt; text-transform: uppercase; color: #64748b; margin-top: 4pt; }

.hl-meta { display: flex; justify-content: space-between; gap: 12pt; font-size: 9.8pt; font-weight: 600; padding: 5pt 0; border-top: .8pt solid #e2e8f0; border-bottom: .8pt solid #e2e8f0; }
.hl-meta b { font-weight: 700; color: #0f172a; }
.hl-version { font-size: 8pt; color: #b45309; font-weight: 700; }
.hl-subject { margin: 11pt 0 12pt; font-size: 10.8pt; font-weight: 700; color: #0f172a; }

.hl-h { font-size: 10.8pt; font-weight: 700; color: #0f172a; margin: 12pt 0 5pt; }
.hl-h u { text-decoration: none; border-bottom: 1pt solid #94a3b8; padding-bottom: 1pt; }
.hl-table { width: 100%; border-collapse: collapse; font-size: 9.8pt; }
.hl-table th, .hl-table td { border: .8pt solid #cbd5e1; padding: 3.6pt 7pt; text-align: left; vertical-align: top; }
.hl-table th { width: 38%; background: #f1f5f9; font-weight: 600; color: #334155; }
.hl-table td { font-weight: 600; color: #0f172a; }
.hl-table tr { break-inside: avoid; page-break-inside: avoid; }

.hl-intro { text-align: justify; color: #1f2937; }
.hl-clauses { margin-top: 3pt; }
.hl-clause { text-align: justify; color: #1f2937; margin-bottom: 2.5pt; padding-left: 4pt; }

.hl-ack { margin-top: 16pt; border: .9pt solid #cbd5e1; border-radius: 4pt; padding: 9pt 11pt; background: #fafafa; }
.hl-ack h4 { margin: 0 0 3pt; font-size: 10pt; font-weight: 700; color: #0f172a; }
.hl-ack p { font-size: 9pt; font-style: italic; color: #475569; }
.hl-ack-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 7pt 18pt; margin-top: 9pt; font-size: 9pt; }
.hl-ack-grid span { display: block; color: #64748b; font-size: 8pt; }
.hl-ack-grid b { display: block; font-weight: 700; color: #0f172a; min-height: 13pt; }
.hl-line { border-bottom: .9pt dotted #64748b; height: 15pt; }

.hl-signs { display: flex; justify-content: space-between; gap: 30pt; margin-top: 34pt; font-size: 9.4pt; }
.hl-sign { width: 46%; line-height: 1.45; }
.hl-sign.right { text-align: right; }
.hl-sign-line { border-top: .9pt solid #0f172a; margin-bottom: 4pt; width: 70%; }
.hl-sign.right .hl-sign-line { margin-left: auto; }
.hl-sign b { display: block; font-size: 10.2pt; font-weight: 700; color: #0f172a; }
.hl-sign span { display: block; color: #334155; }
.hl-sign em { display: block; font-style: normal; font-weight: 600; color: #0f172a; }

.hl-copy { margin-top: 18pt; padding-top: 7pt; border-top: .8pt solid #e2e8f0; font-size: 8.4pt; color: #475569; }
.hl-copy p { font-weight: 700; color: #1f2937; margin-bottom: 2pt; }
.hl-copy ol { margin: 0; padding-left: 15pt; }

.hl-foot { margin-top: 18pt; padding-top: 6pt; border-top: 1.2pt solid #E6BB60; display: flex; justify-content: space-between; gap: 10pt; font: 500 7.4pt/1.4 Inter, ${LETTER_FONT_STACK}; color: #64748b; }

/* Company pad: the pre-printed paper already has the header and footer. */
.hl-mode-pad .hl-head, .hl-mode-pad .hl-foot, .hl-mode-pad .hl-branch { display: none; }
.hl-mode-pad .hl-title { margin-top: 0; }

/* PDF capture: margins come from the PDF page, not the element. */
.hl-export .hl-page { padding: 0; min-height: 0; width: 100%; overflow: visible; }
.hl-export .hl-watermark { display: none; }
`;

// Loads the Bangla web font once (also needed before a PDF capture).
export function useLetterFont() {
  useEffect(() => {
    if (typeof document === "undefined" || document.getElementById("hl-font")) return;
    const link = document.createElement("link");
    link.id = "hl-font";
    link.rel = "stylesheet";
    link.href = LETTER_FONT_URL;
    document.head.appendChild(link);
  }, []);
}

const ACK_TEXT = "আমি উপরোক্ত সকল শর্তাবলী মনোযোগসহকারে পড়েছি, বুঝেছি এবং স্বেচ্ছায় মেনে নিয়ে এই পত্রের অনুলিপি গ্রহণ করলাম।";

/**
 * @param snapshot   letter.contentSnapshot (or a live preview snapshot)
 * @param status     draft | reissued | cancelled | preview → watermark
 * @param version    shown next to the memo number when > 1
 * @param mode       "letterhead" (plain paper) | "pad" (pre-printed company pad)
 * @param padTopIn / padBottomIn  blank space kept for the pad's header/footer (inches)
 */
export default function LetterDocument({ snapshot, status, version = 1, mode = "letterhead", padTopIn = 1.6, padBottomIn = 0.75, ref }) {
  useLetterFont();
  if (!snapshot) return null;

  const { company = {}, branch = null, letterMeta = {}, recipient = {}, infoTable = [], sections = [], signatories = {}, acknowledgementRequired = true } = snapshot;
  const pad = mode === "pad";
  const watermark = watermarkFor(status);
  const style = pad ? { "--hl-top": `${padTopIn}in`, "--hl-bottom": `${padBottomIn}in` } : undefined;
  const contact = [
    company.address && ["ঠিকানা", company.address],
    company.phone && ["ফোন", company.phone],
    company.email && ["ইমেইল", company.email],
    company.website && ["ওয়েব", company.website.replace(/^https?:\/\//, "")],
  ].filter(Boolean);

  return (
    <div ref={ref} className={`hl-page ${pad ? "hl-mode-pad" : "hl-mode-letterhead"}`} style={style} data-letter-number={letterMeta.letterNumber}>
      <style>{LETTER_CSS}</style>
      {watermark && (
        <div className="hl-watermark" aria-hidden="true">
          <span>{watermark}</span>
        </div>
      )}

      <div className="hl-body">
        <header className="hl-head">
          {company.logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="hl-logo" src={company.logo} alt="" />
          ) : null}
          <div className="hl-brand">
            <div className="hl-company">{company.name || "MULTI GYM PREMIUM & MULTI GYM"}</div>
            <div className="hl-tagline">{company.brands || company.tagline}</div>
          </div>
          {contact.length > 0 && (
            <div className="hl-contact">
              {contact.map(([label, value]) => (
                <div key={label}>
                  <b>{label}:</b> {value}
                </div>
              ))}
            </div>
          )}
        </header>
        {branch?.name && (
          <div className="hl-branch">
            শাখা: {branch.name}
            {branch.address ? ` • ${branch.address}` : ""}
            {branch.phone ? ` • ফোন: ${branch.phone}` : ""}
          </div>
        )}

        <div className="hl-title">
          <span>{letterMeta.titleBangla}</span>
          {letterMeta.titleEnglish && <small>{letterMeta.titleEnglish}</small>}
        </div>

        <div className="hl-meta">
          <div>
            স্মারক নং: <b>{letterMeta.letterNumber}</b>
            {version > 1 && <span className="hl-version"> (সংশোধিত সংস্করণ v{version})</span>}
          </div>
          <div>
            তারিখ: <b>{letterMeta.letterDateDisplay || letterMeta.letterDate}</b>
          </div>
        </div>

        {letterMeta.subject && <p className="hl-subject">{letterMeta.subject}</p>}

        {infoTable.length > 0 && (
          <section>
            <h3 className="hl-h">
              <u>১। প্রয়োজনীয় তথ্য বিবরণী</u>
            </h3>
            <table className="hl-table">
              <tbody>
                {infoTable.map((row, i) => (
                  <tr key={row.key || i}>
                    <th>{row.labelBangla}</th>
                    <td>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {sections.map((sec, i) => (
          <section key={i}>
            <h3 className="hl-h hl-avoid">
              <u>
                {sec.sectionNumber ? `${sec.sectionNumber}। ` : ""}
                {sec.titleBangla}
                {sec.titleEnglish ? ` (${sec.titleEnglish})` : ""}
              </u>
            </h3>
            {sec.introText && <p className="hl-intro">{sec.introText}</p>}
            {sec.clauses?.length > 0 && (
              <div className="hl-clauses">
                {sec.clauses.map((c, j) => (
                  <p key={j} className="hl-clause hl-avoid">
                    {c}
                  </p>
                ))}
              </div>
            )}
          </section>
        ))}

        {acknowledgementRequired && (
          <div className="hl-ack hl-avoid">
            <h4>কর্মকর্তা/কর্মচারীর সম্মতি ও প্রাপ্তি স্বীকার</h4>
            <p>&ldquo;{ACK_TEXT}&rdquo;</p>
            <div className="hl-ack-grid">
              <div>
                <span>স্বাক্ষর</span>
                <div className="hl-line" />
              </div>
              <div>
                <span>তারিখ</span>
                <div className="hl-line" />
              </div>
              <div>
                <span>নাম</span>
                <b>{recipient.name}</b>
              </div>
              <div>
                <span>Employee ID</span>
                <b>{recipient.employeeId || "—"}</b>
              </div>
              {recipient.phone && (
                <div>
                  <span>মোবাইল নম্বর</span>
                  <b>{recipient.phone}</b>
                </div>
              )}
              {recipient.nidPassport && (
                <div>
                  <span>জাতীয় পরিচয়পত্র নম্বর</span>
                  <b>{recipient.nidPassport}</b>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="hl-signs hl-avoid">
          <div className="hl-sign">
            <div className="hl-sign-line" />
            <b>{signatories.issuedBy?.name}</b>
            <span>{signatories.issuedBy?.designation}</span>
            {signatories.issuedBy?.title && <span>{signatories.issuedBy.title}</span>}
            <span>{signatories.approvedBy?.company}</span>
          </div>
          <div className="hl-sign right">
            <div className="hl-sign-line" />
            <b>{signatories.approvedBy?.name}</b>
            <span>{signatories.approvedBy?.designation}</span>
            {signatories.approvedBy?.company && <span>{signatories.approvedBy.company}</span>}
            {signatories.approvedBy?.onBehalfOf && <em>{signatories.approvedBy.onBehalfOf}</em>}
          </div>
        </div>

        {signatories.copyTo?.length > 0 && (
          <div className="hl-copy hl-avoid">
            <p>অবগতি ও প্রয়োজনীয় কার্যার্থে অনুলিপি প্রেরণ করা হলোঃ</p>
            <ol>
              {signatories.copyTo.map((c, i) => (
                <li key={i}>{c}</li>
              ))}
              <li>ব্যক্তিগত নথি / অফিস কপি</li>
            </ol>
          </div>
        )}

        <footer className="hl-foot">
          <span>{[company.name, company.address].filter(Boolean).join(" • ")}</span>
          <span>
            Ref: {letterMeta.letterNumber}
            {version > 1 ? ` · v${version}` : ""}
          </span>
        </footer>
      </div>
    </div>
  );
}

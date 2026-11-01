"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FiAlertCircle, FiEye, FiFileText, FiPlus, FiRefreshCw } from "react-icons/fi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import useUserPermissions from "@/hooks/useUserPermissions";
import { errMsg, fmtDate } from "@/hooks/useHr";
import { Badge, Loading } from "@/components/hr/HrUi";
import LetterPreviewModal from "@/components/modals/letters/LetterPreviewModal";
import { letterStatusMeta, letterTypeMeta } from "./letterConstants";

// "HR letters" block on the employee profile: the employee's current
// letters (superseded versions hidden) with preview / print / PDF.
export default function EmployeeLettersSection({ employeeId }) {
  const { can } = useUserPermissions();
  const { getEmployeeLetters } = useHrLetterActions();
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewId, setPreviewId] = useState(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canView = can("hr-letters", "view");

  useEffect(() => {
    if (!employeeId || !canView) return undefined;
    let alive = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    getEmployeeLetters(employeeId)
      .then((d) => {
        if (!alive) return;
        setLetters(d || []);
        setError("");
      })
      .catch((e) => alive && setError(errMsg(e, "Could not load letters")))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [employeeId, getEmployeeLetters, canView, reloadKey]);

  if (!canView) return null;
  const createHref = `/dashboard/hr-letters/create?employeeId=${employeeId}`;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold flex items-center gap-1.5">
          <FiFileText /> HR letters ({letters.length})
        </h4>
        {can("hr-letters", "add") && (
          <Link href={createHref} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-brand-red/10 text-brand-red hover:bg-brand-red hover:text-white text-xs font-bold transition-all">
            <FiPlus /> New letter
          </Link>
        )}
      </div>

      {loading ? (
        <Loading rows={3} />
      ) : error ? (
        <div className="p-4 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-center text-xs space-y-2">
          <p className="font-bold text-brand-red flex items-center justify-center gap-1.5">
            <FiAlertCircle /> {error}
          </p>
          <button type="button" onClick={() => setReloadKey((k) => k + 1)} className="inline-flex items-center gap-1 font-bold text-brand-dark-grey dark:text-brand-gold-light hover:underline cursor-pointer">
            <FiRefreshCw /> Try again
          </button>
        </div>
      ) : letters.length === 0 ? (
        <div className="p-6 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight text-center border border-dashed border-brand-beige/60 dark:border-brand-dark-grey">
          <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light">No letters have been issued to this employee yet.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2.5">
          {letters.map((l) => {
            const t = letterTypeMeta(l.letterType);
            const s = letterStatusMeta(l.status);
            return (
              <button
                key={l._id}
                type="button"
                onClick={() => setPreviewId(l._id)}
                className="p-3 rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50 bg-brand-white dark:bg-brand-charcoal hover:border-brand-gold/60 text-left transition-all cursor-pointer group"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block text-xs font-black text-brand-black dark:text-brand-white truncate">{l.contentSnapshot?.letterMeta?.titleBangla || t.titleBangla}</span>
                    <span className="block text-[10px] text-brand-dark-grey dark:text-brand-gold-light truncate">{t.titleEnglish}</span>
                  </span>
                  <Badge tone={s.tone}>
                    {s.label}
                    {l.version > 1 ? ` · v${l.version}` : ""}
                  </Badge>
                </div>
                <div className="flex items-center justify-between gap-2 mt-2 text-[10px] text-brand-dark-grey dark:text-brand-gold-light">
                  <span className="font-mono truncate">{l.status === "draft" ? "Draft" : l.letterNumber}</span>
                  <span className="flex items-center gap-1 shrink-0">
                    {fmtDate(l.letterDate)} <FiEye className="text-brand-gold opacity-0 group-hover:opacity-100 transition-opacity" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <LetterPreviewModal isOpen={!!previewId} onClose={() => setPreviewId(null)} letterId={previewId} />
    </div>
  );
}

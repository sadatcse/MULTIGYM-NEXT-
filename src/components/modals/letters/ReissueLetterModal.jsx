"use client";

import { useEffect, useRef, useState } from "react";
import { FiAlertTriangle, FiRefreshCw } from "react-icons/fi";
import ModalShell from "../ModalShell";
import { Btn, Field, inputCls } from "@/components/hr/HrUi";
import LetterFieldInput from "@/components/letters/LetterFieldInput";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import { errMsg, todayISO } from "@/hooks/useHr";

/**
 * Issues a corrected version (v N+1) of an issued letter. The current
 * version is kept on record as "superseded". Letter-specific values can be
 * corrected here; profile values are re-read from the employee record.
 */
export default function ReissueLetterModal({ isOpen, onClose, letter, onDone }) {
  const { getTemplateForType, reissueLetter } = useHrLetterActions();
  const [template, setTemplate] = useState(null);
  const [values, setValues] = useState({});
  const [reason, setReason] = useState("");
  const [letterDate, setLetterDate] = useState(todayISO());
  const [remarks, setRemarks] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    if (!isOpen || !letter) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReason("");
    setRemarks("");
    setError("");
    setLetterDate(todayISO());
    setValues({ ...(letter.inputData || {}) });
    getTemplateForType(letter.letterType).then(setTemplate).catch(() => setTemplate(null));
  }, [isOpen, letter, getTemplateForType]);

  if (!letter) return null;
  const editable = (template?.infoFields || []).filter((f) => f.source !== "employee");
  const nextVersion = (letter.version || 1) + 1;

  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    if (!reason.trim()) {
      setError("Please write why this letter is being reissued.");
      return;
    }
    lock.current = true;
    setSubmitting(true);
    setError("");
    try {
      const res = await reissueLetter(letter._id, { reissueReason: reason.trim(), letterDate, remarks, inputData: values });
      onDone?.(res?.data);
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not reissue the letter"));
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="xl"
      disableClose={submitting}
      title={
        <div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white flex items-center gap-2">
            <FiRefreshCw className="text-amber-500" /> Reissue letter
          </h3>
          <p className="text-xs font-mono text-brand-dark-grey dark:text-brand-gold-light">
            {letter.letterNumber} · v{letter.version || 1} → v{nextVersion}
          </p>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose} disabled={submitting}>
            Cancel
          </Btn>
          <Btn type="submit" form="reissue-form" loading={submitting} className="!bg-amber-500 hover:!bg-amber-600 !shadow-amber-500/20">
            <FiRefreshCw /> Issue version {nextVersion}
          </Btn>
        </div>
      }
    >
      <form id="reissue-form" onSubmit={submit} className="p-5 sm:p-6 space-y-5">
        <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-200 text-xs flex gap-2.5">
          <FiAlertTriangle className="text-base shrink-0 mt-0.5" />
          <p>
            Version {nextVersion} keeps the same memo number. Version {letter.version || 1} stays in the history marked <b>Superseded</b> and prints with a watermark.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Reissue date" required>
            <input type="date" value={letterDate} onChange={(e) => setLetterDate(e.target.value)} className={`${inputCls} dark:[color-scheme:dark]`} required />
          </Field>
          <Field label="Internal note" hint="Not printed on the letter">
            <input value={remarks} onChange={(e) => setRemarks(e.target.value)} placeholder="Optional" className={inputCls} />
          </Field>
        </div>

        <Field label="Reason for reissue" required>
          <textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Corrected the joining date / updated salary as approved by MD"
            className={`${inputCls} resize-none`}
          />
        </Field>

        {editable.length > 0 && (
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider text-brand-gold mb-3">Correct letter details (optional)</h4>
            <div className="grid sm:grid-cols-2 gap-4">
              {editable.map((f) => (
                <LetterFieldInput key={f.key} field={f} value={values[f.key]} onChange={(v) => setValues((p) => ({ ...p, [f.key]: v }))} />
              ))}
            </div>
          </div>
        )}

        {error && <p className="text-xs font-bold text-brand-red">{error}</p>}
      </form>
    </ModalShell>
  );
}

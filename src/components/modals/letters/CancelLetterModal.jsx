"use client";

import { useEffect, useRef, useState } from "react";
import { FiSlash } from "react-icons/fi";
import ModalShell from "../ModalShell";
import { Btn, Field, inputCls } from "@/components/hr/HrUi";
import { useHrLetterActions } from "@/hooks/useHrLetterApi";
import { errMsg } from "@/hooks/useHr";

// Voids an issued letter. It stays on record (with its memo number) and
// prints with a CANCELLED watermark — issued letters are never deleted.
export default function CancelLetterModal({ isOpen, onClose, letter, onDone }) {
  const { cancelLetter } = useHrLetterActions();
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const lock = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (isOpen) setReason("");
    setError("");
  }, [isOpen]);

  if (!letter) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (lock.current) return;
    if (!reason.trim()) {
      setError("Please write why this letter is being cancelled.");
      return;
    }
    lock.current = true;
    setSubmitting(true);
    try {
      const res = await cancelLetter(letter._id, reason.trim());
      onDone?.(res?.data);
      onClose();
    } catch (err) {
      setError(errMsg(err, "Could not cancel the letter"));
    } finally {
      lock.current = false;
      setSubmitting(false);
    }
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      disableClose={submitting}
      title={
        <div>
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white flex items-center gap-2">
            <FiSlash className="text-brand-red" /> Cancel letter
          </h3>
          <p className="text-xs font-mono text-brand-dark-grey dark:text-brand-gold-light">
            {letter.letterNumber} · {letter.employeeName}
          </p>
        </div>
      }
      footer={
        <div className="flex justify-end gap-2">
          <Btn variant="ghost" onClick={onClose} disabled={submitting}>
            Keep letter
          </Btn>
          <Btn type="submit" form="cancel-letter-form" variant="danger" loading={submitting}>
            <FiSlash /> Cancel letter
          </Btn>
        </div>
      }
    >
      <form id="cancel-letter-form" onSubmit={submit} className="p-5 sm:p-6 space-y-4">
        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light leading-relaxed">
          The letter stays in the records with its memo number and is marked <b>Cancelled</b>. Any copy printed after this shows a CANCELLED watermark.
        </p>
        <Field label="Reason" required>
          <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Issued to the wrong employee / decision withdrawn" className={`${inputCls} resize-none`} autoFocus />
        </Field>
        {error && <p className="text-xs font-bold text-brand-red">{error}</p>}
      </form>
    </ModalShell>
  );
}

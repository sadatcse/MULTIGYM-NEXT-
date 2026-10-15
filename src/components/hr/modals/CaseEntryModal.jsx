"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls, Select } from "@/components/hr/HrUi";
import { useHrMutation, titleCase, todayISO } from "@/hooks/useHr";
import ModalFooter, { NO_PERMISSIONS } from "./ModalFooter";

const ENTRY_TYPES = ["note", "warning_issued", "show_cause_issued", "reply_received", "investigation", "hearing", "administrative_action"];

// Add a timeline entry (note, reply, investigation, hearing…) to a case.
// Requires `permissions.canEdit` on the discipline module.
export default function CaseEntryModal({ open, caseId, onClose, onSaved, permissions = NO_PERMISSIONS }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} title="Add case entry">
      {open && <Body caseId={caseId} onClose={onClose} onSaved={onSaved} allowed={permissions.canEdit} />}
    </ModalShell>
  );
}

function Body({ caseId, onClose, onSaved, allowed }) {
  const { run, busy } = useHrMutation();
  const [e, setE] = useState({ type: "note", text: "", date: todayISO(), attachments: [], replyDeadline: "" });
  const save = async () => {
    if (await run("post", `/discipline/${caseId}/entries`, e)) onSaved();
  };
  return (
    <>
      <fieldset disabled={!allowed} className="p-5 sm:p-6 space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Entry type"><Select value={e.type} onChange={(v) => setE({ ...e, type: v })} options={ENTRY_TYPES.map((t) => ({ value: t, label: titleCase(t) }))} /></Field>
          <Field label="Date"><input type="date" value={e.date} onChange={(ev) => setE({ ...e, date: ev.target.value })} className={inputCls} /></Field>
        </div>
        {e.type === "show_cause_issued" && <Field label="Reply deadline"><input type="date" value={e.replyDeadline} onChange={(ev) => setE({ ...e, replyDeadline: ev.target.value })} className={inputCls} /></Field>}
        <Field label="Details" required>
          <textarea rows={4} value={e.text} onChange={(ev) => setE({ ...e, text: ev.target.value })} className={inputCls} placeholder={e.type === "reply_received" ? "Summary of the employee's written explanation" : ""} />
        </Field>
        <Field label="Attachments"><Attachments value={e.attachments} onChange={(a) => setE({ ...e, attachments: a })} folder="discipline" readOnly={!allowed} /></Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={allowed} disabled={!e.text.trim()} submitLabel="Add entry" />
      </div>
    </>
  );
}

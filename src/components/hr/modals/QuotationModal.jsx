"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Attachments, Field, inputCls } from "@/components/hr/HrUi";
import { useHrMutation } from "@/hooks/useHr";
import ModalFooter from "./ModalFooter";

// Add a vendor quotation to a requisition. `canQuote` comes from the server
// (admin / purchase stage roles while the requisition is still open).
export default function QuotationModal({ open, canQuote, requisitionId, onClose, onSaved }) {
  return (
    <ModalShell isOpen={open} onClose={onClose} title="Add quotation">
      {open && <Body canQuote={canQuote} requisitionId={requisitionId} onClose={onClose} onSaved={onSaved} />}
    </ModalShell>
  );
}

function Body({ canQuote, requisitionId, onClose, onSaved }) {
  const { run, busy } = useHrMutation();
  const [q, setQ] = useState({ vendorName: "", amount: "", deliveryDays: "", note: "", attachments: [] });
  const save = async () => {
    const res = await run("post", `/requisitions/${requisitionId}/quotations`, {
      vendorName: q.vendorName,
      amount: Number(q.amount),
      deliveryDays: Number(q.deliveryDays) || 0,
      note: q.note,
      attachmentUrl: q.attachments?.[0]?.url || "",
    });
    if (res) onSaved();
  };
  return (
    <>
      <fieldset disabled={!canQuote} className="p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Vendor" required className="sm:col-span-2"><input value={q.vendorName} onChange={(e) => setQ({ ...q, vendorName: e.target.value })} className={inputCls} /></Field>
        <Field label="Quoted amount" required><input type="number" min={1} value={q.amount} onChange={(e) => setQ({ ...q, amount: e.target.value })} className={inputCls} /></Field>
        <Field label="Delivery (days)"><input type="number" min={0} value={q.deliveryDays} onChange={(e) => setQ({ ...q, deliveryDays: e.target.value })} className={inputCls} /></Field>
        <Field label="Note" className="sm:col-span-2"><input value={q.note} onChange={(e) => setQ({ ...q, note: e.target.value })} className={inputCls} /></Field>
        <Field label="Quotation file" className="sm:col-span-2"><Attachments value={q.attachments} onChange={(a) => setQ({ ...q, attachments: a })} folder="requisitions" max={1} readOnly={!canQuote} /></Field>
      </fieldset>
      <div className="p-5 border-t border-brand-beige/40 dark:border-brand-dark-grey/40 bg-brand-offwhite/50 dark:bg-brand-midnight/50">
        <ModalFooter onClose={onClose} onSubmit={save} busy={busy} allowed={canQuote} disabled={!q.vendorName || !(Number(q.amount) > 0)} submitLabel="Add quotation" />
      </div>
    </>
  );
}

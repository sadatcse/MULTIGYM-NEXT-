"use client";

import { useState } from "react";
import ModalShell from "@/components/modals/ModalShell";
import { Field, inputCls, Select } from "@/components/hr/HrUi";
import { money, todayISO } from "@/hooks/useHr";
import ModalFooter from "./ModalFooter";

export const ACTION_LABEL = { verify: "Verify", approve: "Approve", reject: "Reject", order: "Mark ordered", purchase: "Record purchase", receive: "Receive items", cancel: "Cancel" };

// One workflow step (verify / approve / reject / order / purchase / receive /
// cancel). Only rendered for actions the server listed in `availableActions`
// for this user, and re-checked server-side on submit.
export default function RequisitionActionModal({ action, r, busy, onClose, onSubmit }) {
  const allowed = !!action && (r?.availableActions || []).includes(action);
  const [f, setF] = useState({});
  const [k, setK] = useState(null);
  if (action && k !== action) {
    setK(action);
    const selected = r.quotations.find((q) => q.selected) || [...r.quotations].sort((a, b) => a.amount - b.amount)[0];
    setF({
      remarks: "",
      approvedAmount: selected?.amount || r.estimatedTotal,
      quotationId: selected?._id || "",
      vendorName: r.vendorName || selected?.vendorName || "",
      actualAmount: r.approvedAmount || "",
      invoiceNo: "",
      paymentMethod: "",
      date: todayISO(),
      condition: "good",
      approvedQuantities: r.items.map((i) => ({ itemId: i._id, quantity: i.approvedQuantity ?? i.quantity })),
      receivedItems: r.items.map((i) => ({ itemId: i._id, quantity: i.approvedQuantity ?? i.quantity })),
    });
  }
  if (!action) return <ModalShell isOpen={false} onClose={onClose} />;
  const set = (key) => (e) => setF({ ...f, [key]: e.target.value });
  const submit = () => {
    const body = { remarks: f.remarks };
    if (action === "approve") Object.assign(body, { approvedAmount: Number(f.approvedAmount), quotationId: f.quotationId || undefined, vendorName: f.quotationId ? undefined : f.vendorName, approvedQuantities: f.approvedQuantities });
    if (action === "order") body.vendorName = f.vendorName;
    if (action === "purchase") Object.assign(body, { actualAmount: Number(f.actualAmount), invoiceNo: f.invoiceNo, paymentMethod: f.paymentMethod, date: f.date, vendorName: f.vendorName });
    if (action === "receive") Object.assign(body, { receivedItems: f.receivedItems, condition: f.condition, date: f.date });
    onSubmit(body);
  };
  return (
    <ModalShell isOpen onClose={onClose} title={ACTION_LABEL[action]} footer={<ModalFooter onClose={onClose} onSubmit={submit} busy={busy} allowed={allowed} danger={action === "reject" || action === "cancel"} submitLabel={ACTION_LABEL[action]} />}>
      <div className="p-6 space-y-3">
        {action === "approve" && (
          <>
            {r.quotations.length > 0 && <Field label="Selected quotation"><Select value={f.quotationId} onChange={(v) => { const q = r.quotations.find((x) => x._id === v); setF({ ...f, quotationId: v, approvedAmount: q?.amount ?? f.approvedAmount }); }} placeholder="No quotation" options={r.quotations.map((q) => ({ value: q._id, label: `${q.vendorName} — ${money(q.amount)}` }))} /></Field>}
            {!f.quotationId && <Field label="Vendor"><input value={f.vendorName} onChange={set("vendorName")} className={inputCls} /></Field>}
            <Field label="Approved amount" required><input type="number" value={f.approvedAmount} onChange={set("approvedAmount")} className={inputCls} /></Field>
            <Field label="Approved quantities">
              {r.items.map((it, i) => (
                <div key={it._id} className="flex items-center gap-2 mb-1.5">
                  <span className="flex-1 text-xs font-bold">{it.name} (asked {it.quantity})</span>
                  <input type="number" min={0} value={f.approvedQuantities[i].quantity} onChange={(e) => setF({ ...f, approvedQuantities: f.approvedQuantities.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)) })} className={`${inputCls} w-24`} />
                </div>
              ))}
            </Field>
          </>
        )}
        {(action === "order" || action === "purchase") && <Field label="Vendor"><input value={f.vendorName} onChange={set("vendorName")} className={inputCls} /></Field>}
        {action === "purchase" && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Actual amount" required><input type="number" value={f.actualAmount} onChange={set("actualAmount")} className={inputCls} /></Field>
            <Field label="Purchase date"><input type="date" value={f.date} onChange={set("date")} className={inputCls} /></Field>
            <Field label="Invoice no."><input value={f.invoiceNo} onChange={set("invoiceNo")} className={inputCls} /></Field>
            <Field label="Payment method"><input value={f.paymentMethod} onChange={set("paymentMethod")} className={inputCls} placeholder="Cash / bank / bKash" /></Field>
          </div>
        )}
        {action === "receive" && (
          <>
            <Field label="Received quantities">
              {r.items.map((it, i) => (
                <div key={it._id} className="flex items-center gap-2 mb-1.5">
                  <span className="flex-1 text-xs font-bold">{it.name} (expected {it.approvedQuantity ?? it.quantity})</span>
                  <input type="number" min={0} value={f.receivedItems[i].quantity} onChange={(e) => setF({ ...f, receivedItems: f.receivedItems.map((x, j) => (j === i ? { ...x, quantity: e.target.value } : x)) })} className={`${inputCls} w-24`} />
                </div>
              ))}
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Condition"><Select value={f.condition} onChange={(v) => setF({ ...f, condition: v })} options={["good", "damaged", "partial"]} /></Field>
              <Field label="Date"><input type="date" value={f.date} onChange={set("date")} className={inputCls} /></Field>
            </div>
          </>
        )}
        <Field label="Remarks" required={action === "reject"}><textarea rows={2} value={f.remarks} onChange={set("remarks")} className={inputCls} /></Field>
      </div>
    </ModalShell>
  );
}

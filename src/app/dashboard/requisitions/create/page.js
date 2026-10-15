"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { MdAddShoppingCart } from "react-icons/md";
import { useHrConfig, useHrLookups, useHrMutation, money } from "@/hooks/useHr";
import { Attachments, Btn, Card, Field, inputCls, PageHeader, Select } from "@/components/hr/HrUi";

const blank = () => ({ name: "", specification: "", quantity: 1, unit: "pcs", estimatedUnitPrice: "" });

export default function CreateRequisitionPage() {
  const router = useRouter();
  const { me } = useHrConfig();
  const { branches } = useHrLookups({ employees: false });
  const { run, busy } = useHrMutation();
  const [f, setF] = useState({ title: "", branch: "", purpose: "", priority: "normal", requiredBy: "", items: [blank()], attachments: [] });
  const branchOptions = me?.scope === "all" ? branches : me?.branches || [];
  useEffect(() => {
    // Syncing a default from data that arrives asynchronously is intentional.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (!f.branch && me?.branches?.[0]) setF((x) => ({ ...x, branch: me.branches[0] }));
  }, [me, f.branch]);

  const setItem = (i, patch) => setF({ ...f, items: f.items.map((it, j) => (j === i ? { ...it, ...patch } : it)) });
  const total = f.items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.estimatedUnitPrice) || 0), 0);

  const submit = async () => {
    const res = await run("post", "/requisitions", { ...f, items: f.items.map((it) => ({ ...it, quantity: Number(it.quantity), estimatedUnitPrice: Number(it.estimatedUnitPrice) || 0 })) });
    if (res) router.push(`/dashboard/requisitions/${res.data._id}`);
  };

  return (
    <div className="space-y-5 max-w-5xl mx-auto pb-10">
      <PageHeader icon={<MdAddShoppingCart />} title="New Requisition" subtitle="Request items or services for your branch. Admin verifies, management approves, then purchase proceeds." />
      <Card title="Details">
        <div className="grid md:grid-cols-2 gap-4">
          <Field label="Title" required className="md:col-span-2"><input value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} className={inputCls} placeholder="e.g. Replacement dumbbells for free-weight zone" /></Field>
          <Field label="Branch" required><Select value={f.branch} onChange={(v) => setF({ ...f, branch: v })} placeholder="Select branch" options={branchOptions} /></Field>
          <Field label="Priority"><Select value={f.priority} onChange={(v) => setF({ ...f, priority: v })} options={[{ value: "low", label: "Low" }, { value: "normal", label: "Normal" }, { value: "high", label: "High" }, { value: "urgent", label: "Urgent" }]} /></Field>
          <Field label="Required by"><input type="date" value={f.requiredBy} onChange={(e) => setF({ ...f, requiredBy: e.target.value })} className={inputCls} /></Field>
          <Field label="Purpose / justification" className="md:col-span-2"><textarea rows={2} value={f.purpose} onChange={(e) => setF({ ...f, purpose: e.target.value })} className={inputCls} /></Field>
        </div>
      </Card>
      <Card title="Items" subtitle={`Estimated total ${money(total)}`} actions={<Btn size="sm" variant="ghost" onClick={() => setF({ ...f, items: [...f.items, blank()] })}><FiPlus /> Add item</Btn>}>
        <div className="space-y-3">
          <AnimatePresence>
            {f.items.map((it, i) => (
              <motion.div key={i} layout initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 20 }} className="grid grid-cols-12 gap-2 items-end">
                <Field label={i === 0 ? "Item" : ""} className="col-span-12 md:col-span-3"><input value={it.name} onChange={(e) => setItem(i, { name: e.target.value })} className={inputCls} /></Field>
                <Field label={i === 0 ? "Specification" : ""} className="col-span-12 md:col-span-3"><input value={it.specification} onChange={(e) => setItem(i, { specification: e.target.value })} className={inputCls} /></Field>
                <Field label={i === 0 ? "Qty" : ""} className="col-span-3 md:col-span-1"><input type="number" min={1} value={it.quantity} onChange={(e) => setItem(i, { quantity: e.target.value })} className={inputCls} /></Field>
                <Field label={i === 0 ? "Unit" : ""} className="col-span-3 md:col-span-1"><input value={it.unit} onChange={(e) => setItem(i, { unit: e.target.value })} className={inputCls} /></Field>
                <Field label={i === 0 ? "Est. unit price" : ""} className="col-span-4 md:col-span-2"><input type="number" value={it.estimatedUnitPrice} onChange={(e) => setItem(i, { estimatedUnitPrice: e.target.value })} className={inputCls} /></Field>
                <div className="col-span-2 md:col-span-2 flex items-center justify-between pb-2">
                  <span className="text-xs font-black">{money((Number(it.quantity) || 0) * (Number(it.estimatedUnitPrice) || 0))}</span>
                  {f.items.length > 1 && <button onClick={() => setF({ ...f, items: f.items.filter((_, j) => j !== i) })} className="text-brand-dark-grey hover:text-brand-red cursor-pointer"><FiTrash2 /></button>}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </Card>
      <Card title="Attachments" subtitle="Photos of damaged items, sample quotations, etc.">
        <Attachments value={f.attachments} onChange={(a) => setF({ ...f, attachments: a })} folder="requisitions" />
      </Card>
      <div className="flex justify-end gap-2">
        <Btn variant="ghost" onClick={() => router.back()}>Cancel</Btn>
        <Btn loading={busy} onClick={submit} disabled={!f.title || !f.branch || f.items.some((it) => !it.name)}>Submit requisition</Btn>
      </div>
    </div>
  );
}

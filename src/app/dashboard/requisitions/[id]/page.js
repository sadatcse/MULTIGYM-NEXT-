"use client";

import { useContext, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { FiArrowLeft, FiCheck, FiPackage, FiPlus, FiPrinter, FiShoppingBag, FiStar, FiTrash2, FiX } from "react-icons/fi";
import { MdShoppingCart } from "react-icons/md";
import { AuthContext } from "@/providers/AuthProvider";
import { useHrMutation, useHrQuery, money, fmtDate, fmtDateTime, titleCase } from "@/hooks/useHr";
import { Attachments, Badge, Btn, Card, Loading, PageHeader, Table, Td, Timeline } from "@/components/hr/HrUi";
import RequisitionActionModal, { ACTION_LABEL } from "@/components/hr/modals/RequisitionActionModal";
import QuotationModal from "@/components/hr/modals/QuotationModal";
import { printDocument, tableHtml, escapeHtml as esc } from "@/lib/hrPrint";

const FLOW = [
  { key: "submitted", label: "Requisition", icon: <FiPlus /> },
  { key: "verified", label: "Admin Verification", icon: <FiCheck /> },
  { key: "approved", label: "Management Approval", icon: <FiStar /> },
  { key: "purchased", label: "Purchase", icon: <FiShoppingBag /> },
  { key: "received", label: "Received", icon: <FiPackage /> },
];

export default function RequisitionDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { company } = useContext(AuthContext);
  const { data, loading, error, refetch } = useHrQuery(`/requisitions/${id}`);
  const { run, busy } = useHrMutation();
  const [action, setAction] = useState(null);
  const [quote, setQuote] = useState(null);
  const r = data?.data;

  if (loading) return <Loading rows={8} />;
  if (error || !r) return <Card><p className="text-sm font-bold text-red-500">{error || "Not found"}</p></Card>;

  const idx = FLOW.findIndex((s) => s.key === r.status);
  const bad = r.status === "rejected" || r.status === "cancelled";

  const print = () =>
    printDocument({
      title: `Requisition ${r.requisitionNo}`,
      subtitle: `${r.title} · ${r.branch}`,
      company,
      bodyHtml: `<div class="grid"><div><b>Requested by:</b> ${esc(r.requestedBy?.name)} (${esc(r.requestedBy?.designation || "")})</div><div><b>Date:</b> ${esc(fmtDate(r.createdAt))}</div><div><b>Priority:</b> ${esc(r.priority)}</div><div><b>Required by:</b> ${esc(fmtDate(r.requiredBy))}</div><div style="grid-column:span 2"><b>Purpose:</b> ${esc(r.purpose)}</div></div>
      ${tableHtml(["Item", "Specification", "Qty", "Approved", "Unit", "Est. price", "Est. total"], r.items.map((i) => [i.name, i.specification, i.quantity, i.approvedQuantity ?? "", i.unit, i.estimatedUnitPrice, i.quantity * i.estimatedUnitPrice]), { totals: ["", "", "", "", "", "Estimated", r.estimatedTotal] })}
      ${r.quotations.length ? `<h2>Quotations</h2>${tableHtml(["Vendor", "Amount", "Delivery days", "Note", "Selected"], r.quotations.map((q) => [q.vendorName, q.amount, q.deliveryDays, q.note, q.selected ? "✓" : ""]))}` : ""}
      <div class="grid"><div><b>Approved amount:</b> ${esc(r.approvedAmount || "—")}</div><div><b>Vendor:</b> ${esc(r.vendorName || "—")}</div><div><b>Status:</b> ${esc(r.status)}</div><div><b>Delivery:</b> ${esc(r.deliveryStatus)}</div></div>
      ${tableHtml(["Action", "By", "Remarks", "When"], r.timeline.map((t) => [titleCase(t.action), `${t.by?.name} (${t.by?.role})`, t.remarks, fmtDateTime(t.at)]))}
      <div class="sign"><div>Requested by</div><div>Admin Verification</div><div>Management Approval</div><div>Received by</div></div>`,
    });

  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdShoppingCart />}
        title={`${r.requisitionNo} · ${r.title}`}
        subtitle={`${r.branch} · requested by ${r.requestedBy?.name} on ${fmtDate(r.createdAt)}${r.requiredBy ? ` · needed by ${fmtDate(r.requiredBy)}` : ""}`}
        actions={
          <>
            <Btn variant="glass" size="sm" onClick={() => router.back()}><FiArrowLeft /> Back</Btn>
            <Btn variant="gold" size="sm" onClick={print}><FiPrinter /> Print / PDF</Btn>
          </>
        }
      />

      <Card bodyClassName="p-5">
        <div className="flex items-start">
          {FLOW.map((s, i) => {
            const done = !bad && i <= idx;
            return (
              <div key={s.key} className="flex-1 flex flex-col items-center relative">
                {i > 0 && (
                  <div className="absolute top-5 right-1/2 w-full h-1 bg-brand-beige/60 dark:bg-brand-dark-grey rounded">
                    <motion.div initial={{ width: 0 }} animate={{ width: done ? "100%" : 0 }} transition={{ duration: 0.5, delay: i * 0.15 }} className="h-full bg-brand-gold rounded" />
                  </div>
                )}
                <motion.div initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: i * 0.1 }} className={`relative z-10 w-10 h-10 rounded-2xl flex items-center justify-center text-lg ${done ? "bg-brand-gold text-brand-black" : "bg-brand-offwhite dark:bg-brand-midnight text-brand-dark-grey border border-brand-beige dark:border-brand-dark-grey"}`}>
                  {s.icon}
                </motion.div>
                <span className="text-[10px] font-black mt-1.5 text-center">{s.label}</span>
              </div>
            );
          })}
        </div>
        {bad && <p className="text-center text-xs font-black text-red-500 mt-3">This requisition was {r.status}.</p>}
        {r.availableActions?.length > 0 && (
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {r.availableActions.map((a) => (
              <Btn key={a} variant={a === "reject" || a === "cancel" ? "ghost" : a === "approve" ? "success" : "primary"} onClick={() => setAction(a)}>
                {a === "reject" || a === "cancel" ? <FiX /> : <FiCheck />} {ACTION_LABEL[a]}
              </Btn>
            ))}
          </div>
        )}
      </Card>

      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <Card title="Items" subtitle={`Estimated ${money(r.estimatedTotal)}${r.approvedAmount ? ` · Approved ${money(r.approvedAmount)}` : ""}`} bodyClassName="p-0">
            <Table head={["Item", "Specification", "Qty", "Approved", "Received", "Unit price", "Total"]}>
              {r.items.map((it) => (
                <tr key={it._id}>
                  <Td className="font-black">{it.name}</Td>
                  <Td className="text-[11px]">{it.specification || "—"}</Td>
                  <Td>{it.quantity} {it.unit}</Td>
                  <Td>{it.approvedQuantity ?? "—"}</Td>
                  <Td className={it.receivedQuantity >= (it.approvedQuantity ?? it.quantity) ? "text-emerald-500" : ""}>{it.receivedQuantity || 0}</Td>
                  <Td>{money(it.estimatedUnitPrice)}</Td>
                  <Td>{money(it.quantity * it.estimatedUnitPrice)}</Td>
                </tr>
              ))}
            </Table>
          </Card>

          <Card title="Vendor quotations" actions={r.canQuote && <Btn size="sm" variant="ghost" onClick={() => setQuote(true)}><FiPlus /> Add quotation</Btn>} bodyClassName="p-0">
            {!r.quotations.length ? <p className="p-5 text-xs font-bold text-brand-dark-grey">No quotations yet.</p> : (
              <Table head={["Vendor", "Amount", "Delivery", "Note", "Attachment", ""]}>
                {r.quotations.map((q) => (
                  <tr key={q._id} className={q.selected ? "bg-emerald-500/5" : ""}>
                    <Td className="font-black">{q.vendorName} {q.selected && <Badge tone="green">Selected</Badge>}</Td>
                    <Td className="font-black">{money(q.amount)}</Td>
                    <Td>{q.deliveryDays ? `${q.deliveryDays} days` : "—"}</Td>
                    <Td className="text-[11px]">{q.note || "—"}</Td>
                    <Td>{q.attachmentUrl ? <a href={q.attachmentUrl} target="_blank" rel="noreferrer" className="text-brand-gold underline">View</a> : "—"}</Td>
                    <Td className="text-right">{r.canQuote && ["submitted", "verified"].includes(r.status) && <Btn size="sm" variant="ghost" onClick={async () => { if (await run("delete", `/requisitions/${r._id}/quotations/${q._id}`)) refetch(); }}><FiTrash2 /></Btn>}</Td>
                  </tr>
                ))}
              </Table>
            )}
          </Card>

          <Card title="Purpose & attachments">
            <p className="text-sm font-semibold whitespace-pre-wrap mb-3">{r.purpose || "—"}</p>
            <Attachments value={r.attachments} readOnly />
            {r.purchase && <p className="mt-3 text-xs font-bold">Purchased {fmtDate(r.purchase.date)} · Invoice {r.purchase.invoiceNo || "—"} · Actual {money(r.purchase.actualAmount)} {r.purchase.paymentMethod && `· ${r.purchase.paymentMethod}`}</p>}
            {r.receipt && <p className="mt-1 text-xs font-bold">Received {fmtDate(r.receipt.date)} by {r.receipt.receivedBy} · condition {r.receipt.condition} {r.receipt.note && `· ${r.receipt.note}`}</p>}
          </Card>
        </div>
        <Card title="History">
          <Timeline items={[...r.timeline].reverse().map((t, i) => ({ key: i, title: titleCase(t.action), meta: `${t.by?.name} · ${fmtDateTime(t.at)}`, body: t.remarks, dot: t.action === "rejected" || t.action === "reject" || t.action === "cancel" ? "bg-red-500" : "bg-brand-gold" }))} />
        </Card>
      </div>

      <RequisitionActionModal action={action} r={r} busy={busy} onClose={() => setAction(null)} onSubmit={async (body) => { if (await run("post", `/requisitions/${r._id}/action`, { action, ...body })) { setAction(null); refetch(); } }} />

      <QuotationModal open={!!quote} canQuote={r.canQuote} requisitionId={r._id} onClose={() => setQuote(null)} onSaved={() => { setQuote(null); refetch(); }} />
    </div>
  );
}

"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { FiPlus } from "react-icons/fi";
import { MdShoppingCart } from "react-icons/md";
import { useHrQuery, money, fmtDate } from "@/hooks/useHr";
import { Badge, Btn, Card, EmptyState, Loading, PageHeader } from "@/components/hr/HrUi";

const FLOW = ["submitted", "verified", "approved", "purchased", "received"];
const FLOW_LABEL = { submitted: "Submitted", verified: "Admin verified", approved: "Approved", purchased: "Purchased", received: "Received" };

// Requisitions raised by the signed-in employee (self-service, no admin
// permission needed — the API only returns the caller's own records).
export default function MyRequisitionsPage() {
  const { data, loading } = useHrQuery("/requisitions/my", { limit: 50 });
  const rows = data?.data || [];
  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader
        icon={<MdShoppingCart />}
        title="My Requisitions"
        subtitle="Items you requested and where each one is in the approval and purchase flow."
        actions={<Link href="/dashboard/requisitions/create"><Btn variant="gold"><FiPlus /> New requisition</Btn></Link>}
      />
      <Card bodyClassName="p-4">
        {loading ? <Loading /> : !rows.length ? (
          <EmptyState icon={<MdShoppingCart />} title="No requisitions yet" action={<Link href="/dashboard/requisitions/create"><Btn><FiPlus /> Raise one</Btn></Link>} />
        ) : (
          <div className="space-y-3">
            {rows.map((r, i) => {
              const idx = FLOW.indexOf(r.status);
              const bad = r.status === "rejected" || r.status === "cancelled";
              return (
                <motion.div key={r._id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                  <Link href={`/dashboard/requisitions/${r._id}`} className="block p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 hover:border-brand-gold/60 transition-colors">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="text-sm font-black truncate">{r.title}</div>
                        <div className="text-[11px] text-brand-dark-grey">{r.requisitionNo} · {r.branch} · {fmtDate(r.createdAt)}</div>
                        <div className="text-[11px] mt-1">{r.items.map((it) => `${it.name} ×${it.quantity}`).join(", ")}</div>
                      </div>
                      <div className="text-right">
                        <Badge status={r.status} />
                        <div className="text-xs font-black mt-1">{money(r.approvedAmount || r.estimatedTotal)}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-5 gap-1 mt-3">
                      {FLOW.map((s, j) => (
                        <div key={s}>
                          <div className={`h-1.5 rounded-full ${bad ? "bg-red-400/40" : j <= idx ? "bg-brand-gold" : "bg-brand-beige/60 dark:bg-brand-dark-grey"}`} />
                          <div className="text-[9px] font-bold text-brand-dark-grey mt-1 hidden sm:block">{FLOW_LABEL[s]}</div>
                        </div>
                      ))}
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}

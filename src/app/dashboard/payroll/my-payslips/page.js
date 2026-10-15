"use client";

import { useContext } from "react";
import { motion } from "framer-motion";
import { FiFileText, FiPrinter } from "react-icons/fi";
import { AuthContext } from "@/providers/AuthProvider";
import { useHrConfig, useHrQuery, money } from "@/hooks/useHr";
import { Btn, Card, EmptyState, Loading, PageHeader } from "@/components/hr/HrUi";
import { printPayslip } from "@/components/hr/payslipPrint";

export default function MyPayslipsPage() {
  const { company } = useContext(AuthContext);
  const { config } = useHrConfig();
  const symbol = config?.payroll?.currency || "৳";
  const { data, loading } = useHrQuery("/payroll/my-payslips");
  const slips = data?.data || [];
  return (
    <div className="space-y-6 w-full max-w-[1800px] mx-auto px-2 sm:px-4 lg:px-6 pb-10 font-sans">
      <PageHeader icon={<FiFileText />} title="My Payslips" subtitle="Finalized salary slips. Print or save any month as PDF." />
      <Card bodyClassName="p-4">
        {loading ? <Loading /> : !slips.length ? <EmptyState title="No payslips yet" text="Payslips appear here once HR finalizes the month's payroll." /> : (
          <div className="grid sm:grid-cols-2 gap-3">
            {slips.map((p, i) => (
              <motion.div key={p._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="p-4 rounded-3xl border border-brand-beige/50 dark:border-brand-dark-grey/50 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-black">{new Date(`${p.month}-01T00:00:00`).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</div>
                  <div className="text-[11px] text-brand-dark-grey">Gross {money(p.gross, symbol)} · Deductions {money(p.totalDeductions, symbol)}</div>
                  <div className="text-xl font-black text-emerald-600 mt-1">{money(p.netSalary, symbol)}</div>
                </div>
                <Btn variant="ghost" onClick={() => printPayslip(p, company, symbol)}><FiPrinter /> Payslip</Btn>
              </motion.div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

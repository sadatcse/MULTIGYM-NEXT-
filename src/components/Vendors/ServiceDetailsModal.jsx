"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCreditCard, FiTrash2, FiLoader, FiExternalLink, FiTool } from "react-icons/fi";

function Badge({ value }) {
  if (!value) return null;
  const isPaid = value === "paid" || value === "full paid" || value === "completed" || value === "active";
  const isPartial = value === "partial" || value === "in-progress";
  const isOverdue = value === "overdue" || value === "cancelled";

  let color = "bg-amber-500/10 text-amber-500 border-amber-500/20";
  if (isPaid) color = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  if (isPartial) color = "bg-blue-500/10 text-blue-500 border-blue-500/20";
  if (isOverdue) color = "bg-rose-500/10 text-rose-500 border-rose-500/20";

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${color}`}>
      {value.replace(/-/g, " ")}
    </span>
  );
}

export default function ServiceDetailsModal({
  isOpen,
  service,
  onClose,
  formatDate = (d) => (d ? new Date(d).toLocaleDateString() : "—"),
  currencySymbol = "৳",
  onRecordPayment,
  onRemovePayment,
  removingPaymentId,
  canDelete = false,
  canEdit = false,
  vendorMap,
  onNavigateToVendor,
}) {
  if (!isOpen || !service) return null;

  const vendorObj =
    typeof service.vendor === "object"
      ? service.vendor
      : vendorMap?.get?.(service.vendor) || null;

  const vendorId = vendorObj?._id || service.vendorId || service.vendor;

  const totalCost = service.serviceCost ?? service.cost ?? 0;
  const amountPaid = service.amountPaid ?? (service.paymentStatus === "paid" ? totalCost : 0);
  const amountDue = service.amountDue ?? Math.max(totalCost - amountPaid, 0);
  const paymentStatus = service.paymentStatus || (amountDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-brand-white dark:bg-brand-charcoal w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60"
        >
          {/* Header */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FiTool className="text-brand-gold text-lg" />
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  {service.serviceType || "Service Record Details"}
                </h3>
                <Badge value={paymentStatus} />
                <Badge value={service.completionStatus || "scheduled"} />
              </div>
              <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5">
                Service Date: {formatDate(service.serviceDate)}
                {service.assignedTechnician && ` · Tech: ${service.assignedTechnician}`}
                {service.serviceRequestRef && ` · Ref: ${service.serviceRequestRef}`}
                {service.nextServiceDate && ` · Next Due: ${formatDate(service.nextServiceDate)}`}
                {vendorObj?.name && (
                  <span className="font-bold text-brand-black dark:text-brand-white">
                    {" "}
                    · Vendor: {vendorObj.name}
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={onClose}
              className="cursor-pointer text-brand-dark-grey hover:text-brand-black dark:hover:text-white p-1"
            >
              <FiX className="text-lg" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto text-xs">
            {/* Financial KPI Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-brand-offwhite/80 dark:bg-brand-midnight/80 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">
                  Total Service Bill Cost
                </span>
                <p className="text-lg font-black text-brand-black dark:text-brand-white mt-1">
                  {currencySymbol}{totalCost.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Total Paid Amount
                </span>
                <p className="text-lg font-black text-emerald-500 mt-1">
                  {currencySymbol}{amountPaid.toLocaleString()}
                </p>
              </div>
              <div className="p-4 rounded-2xl bg-brand-red/10 border border-brand-red/20">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-red">
                  Remaining Service Due
                </span>
                <p className="text-lg font-black text-brand-red mt-1">
                  {currencySymbol}{amountDue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Service Details & Notes */}
            {(service.description || service.remarks || service.branch || service.department) && (
              <div className="p-4 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40 space-y-2">
                {(service.branch || service.department) && (
                  <div className="flex gap-4 text-xs font-bold text-brand-dark-grey">
                    {service.branch && <span>Branch: {service.branch}</span>}
                    {service.department && <span>Department: {service.department}</span>}
                  </div>
                )}
                {service.description && (
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase text-brand-gold">Description</h4>
                    <p className="text-xs text-brand-black dark:text-brand-white mt-0.5">{service.description}</p>
                  </div>
                )}
                {service.remarks && (
                  <div>
                    <h4 className="text-[10px] font-extrabold uppercase text-brand-gold">Remarks</h4>
                    <p className="text-xs text-brand-black dark:text-brand-white mt-0.5">{service.remarks}</p>
                  </div>
                )}
              </div>
            )}

            {/* Payment History Ledger Section */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                Payment History & Installments ({(service.payments || []).length})
              </h4>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {(service.payments || []).length === 0 ? (
                  <p className="text-center py-6 text-brand-dark-grey font-bold bg-brand-offwhite/40 dark:bg-brand-midnight/40 rounded-2xl">
                    No payment entries recorded yet.
                  </p>
                ) : (
                  [...service.payments].reverse().map((payment) => (
                    <div
                      key={payment._id || payment.id}
                      className="p-3.5 rounded-2xl bg-brand-offwhite/60 dark:bg-brand-midnight/60 border border-brand-beige/40 dark:border-brand-dark-grey/40 flex items-center justify-between gap-3"
                    >
                      <div>
                        <p className="font-black text-emerald-500 text-sm">
                          {currencySymbol}{payment.amount?.toLocaleString()}
                        </p>
                        <p className="text-[10px] text-brand-dark-grey capitalize font-semibold mt-0.5">
                          {formatDate(payment.paymentDate)} · {payment.method?.replace(/-/g, " ")}
                          {payment.reference ? ` · Ref: ${payment.reference}` : ""}
                        </p>
                        {payment.note && <p className="text-[10px] text-brand-dark-grey mt-0.5">{payment.note}</p>}
                      </div>
                      {canDelete && onRemovePayment && (
                        <button
                          onClick={() => onRemovePayment(payment)}
                          disabled={removingPaymentId === payment._id}
                          className="p-1.5 rounded-lg text-brand-red bg-brand-red/10 hover:bg-brand-red hover:text-white cursor-pointer disabled:opacity-50 shrink-0"
                          title="Reverse Payment"
                        >
                          {removingPaymentId === payment._id ? (
                            <FiLoader className="animate-spin text-sm" />
                          ) : (
                            <FiTrash2 className="text-sm" />
                          )}
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          <div className="px-6 py-4 bg-brand-offwhite/60 dark:bg-brand-midnight/60 border-t border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between flex-wrap gap-2">
            <div>
              {vendorId && onNavigateToVendor && (
                <button
                  onClick={() => onNavigateToVendor(vendorId)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-beige/30 dark:bg-brand-midnight text-brand-black dark:text-brand-gold-light hover:bg-brand-gold hover:text-brand-midnight rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <FiExternalLink /> Vendor Profile
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              {canEdit && amountDue > 0 && onRecordPayment && (
                <button
                  onClick={() => {
                    onClose();
                    onRecordPayment(service);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs rounded-2xl shadow-md cursor-pointer transition-all"
                >
                  <FiCreditCard className="text-sm" /> Record Repayment
                </button>
              )}
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-2xl font-bold bg-brand-beige/40 dark:bg-brand-midnight text-brand-black dark:text-brand-white hover:bg-brand-beige/60 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

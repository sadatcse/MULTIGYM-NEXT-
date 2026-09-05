"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FiX, FiCreditCard, FiTrash2, FiLoader, FiExternalLink, FiShoppingBag } from "react-icons/fi";

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

export default function PurchaseDetailsModal({
  isOpen,
  purchase,
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
  if (!isOpen || !purchase) return null;

  const vendorObj =
    typeof purchase.vendor === "object"
      ? purchase.vendor
      : vendorMap?.get?.(purchase.vendor) || null;

  const vendorId = vendorObj?._id || purchase.vendorId || purchase.vendor;

  // Normalize items array for both Vendor Details view and Vendor Report view
  const itemsList =
    purchase.items && purchase.items.length > 0
      ? purchase.items
      : [
          {
            productName: purchase.productName || "Product Item",
            productCategory: purchase.productCategory || "General",
            quantity: purchase.quantity || 1,
            unitPrice: purchase.unitPrice || purchase.totalPrice || 0,
            totalPrice: purchase.totalPrice || purchase.unitPrice * (purchase.quantity || 1) || 0,
            warranty: purchase.warranty || { available: false },
          },
        ];

  const totalAmount = purchase.totalAmount ?? purchase.totalPrice ?? itemsList.reduce((s, i) => s + (i.totalPrice || 0), 0);
  const amountPaid = purchase.amountPaid ?? (purchase.paymentStatus === "paid" ? totalAmount : 0);
  const amountDue = purchase.amountDue ?? Math.max(totalAmount - amountPaid, 0);
  const paymentStatus = purchase.paymentStatus || (amountDue <= 0 ? "paid" : amountPaid > 0 ? "partial" : "pending");

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-black/60 backdrop-blur-sm overflow-y-auto print:hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-brand-white dark:bg-brand-charcoal w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden my-6 border border-brand-beige/60 dark:border-brand-dark-grey/60"
        >
          {/* Header */}
          <div className="bg-brand-offwhite dark:bg-brand-midnight px-6 py-4 border-b border-brand-beige/60 dark:border-brand-dark-grey/60 flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <FiShoppingBag className="text-brand-gold text-lg" />
                <h3 className="text-base font-black text-brand-black dark:text-brand-white">
                  Purchase Order & Payment Details
                </h3>
                <Badge value={paymentStatus} />
              </div>
              <p className="text-[11px] text-brand-dark-grey font-medium mt-0.5">
                Order Date: {formatDate(purchase.purchaseDate)}
                {purchase.invoiceNumber && ` · Inv#: ${purchase.invoiceNumber}`}
                {purchase.purchaseOrderNumber && ` · PO#: ${purchase.purchaseOrderNumber}`}
                {purchase.department && ` · Dept: ${purchase.department}`}
                {purchase.location && ` · Branch: ${purchase.location}`}
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

          <div className="p-6 space-y-5 max-h-[78vh] overflow-y-auto text-xs">
            {/* Financial Overview KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-2xl bg-brand-offwhite/80 dark:bg-brand-midnight/80 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <span className="text-[10px] font-black uppercase tracking-wider text-brand-dark-grey">
                  Total Order Amount
                </span>
                <p className="text-lg font-black text-brand-black dark:text-brand-white mt-1">
                  {currencySymbol}{totalAmount.toLocaleString()}
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
                  Remaining Balance Due
                </span>
                <p className="text-lg font-black text-brand-red mt-1">
                  {currencySymbol}{amountDue.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Purchased Products Table */}
            <div className="space-y-2">
              <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                Product Items ({itemsList.length})
              </h4>
              <div className="rounded-2xl border border-brand-beige/40 dark:border-brand-dark-grey/40 overflow-hidden bg-brand-offwhite/30 dark:bg-brand-midnight/30">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-brand-offwhite dark:bg-brand-midnight text-[10px] font-black uppercase tracking-wider text-brand-dark-grey border-b border-brand-beige/40 dark:border-brand-dark-grey/40">
                    <tr>
                      <th className="py-2.5 px-3">Product Name</th>
                      <th className="py-2.5 px-3">Category</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">Line Total</th>
                      <th className="py-2.5 px-3">Warranty</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-beige/20 dark:divide-brand-dark-grey/20">
                    {itemsList.map((item, idx) => (
                      <tr key={idx} className="hover:bg-brand-gold/5">
                        <td className="py-2.5 px-3 font-bold text-brand-black dark:text-brand-white">
                          {item.productName}
                        </td>
                        <td className="py-2.5 px-3 text-brand-dark-grey">
                          {item.productCategory || "—"}
                        </td>
                        <td className="py-2.5 px-3 text-center font-bold">{item.quantity}</td>
                        <td className="py-2.5 px-3 text-right font-medium">
                          {currencySymbol}{(item.unitPrice || 0).toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-right font-black text-brand-gold">
                          {currencySymbol}{(item.totalPrice || item.quantity * item.unitPrice)?.toLocaleString()}
                        </td>
                        <td className="py-2.5 px-3 text-[10px]">
                          {item.warranty?.available ? (
                            <span className="font-semibold text-emerald-500">
                              Yes {item.warranty.durationMonths ? `(${item.warranty.durationMonths}m)` : ""}
                              {item.warranty.serialNumber ? ` · SN: ${item.warranty.serialNumber}` : ""}
                            </span>
                          ) : (
                            <span className="text-brand-dark-grey">No</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Order Description / Notes */}
            {purchase.description && (
              <div className="p-3.5 rounded-2xl bg-brand-offwhite/50 dark:bg-brand-midnight/50 border border-brand-beige/40 dark:border-brand-dark-grey/40">
                <h4 className="text-[10px] font-extrabold uppercase text-brand-gold">Order Notes</h4>
                <p className="text-xs text-brand-black dark:text-brand-white mt-0.5">{purchase.description}</p>
              </div>
            )}

            {/* Payment History Ledger Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-brand-gold">
                  Payment Ledger & Installment History ({(purchase.payments || []).length})
                </h4>
              </div>
              <div className="space-y-2 max-h-[30vh] overflow-y-auto">
                {(purchase.payments || []).length === 0 ? (
                  <p className="text-center py-6 text-brand-dark-grey font-bold bg-brand-offwhite/40 dark:bg-brand-midnight/40 rounded-2xl">
                    No payment entries recorded yet.
                  </p>
                ) : (
                  [...purchase.payments].reverse().map((payment) => (
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
                    onRecordPayment(purchase);
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

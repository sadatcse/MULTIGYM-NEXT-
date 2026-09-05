"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import useEmployeeApi from "@/hooks/useEmployeeApi";
import useAxiosSecure from "@/hooks/useAxiosSecure";
import { FiUserCheck } from "react-icons/fi";

const EMPTY_FORM = { assignedToType: "employee", assignedToEmployee: "", assignedToVendor: "", estimatedCost: "", deadline: "" };

export default function MaintenanceAssignModal({ isOpen, onClose, onSubmit, isSubmitting }) {
  const { employees } = useEmployeeApi(100);
  const axiosSecure = useAxiosSecure();
  const [vendors, setVendors] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(EMPTY_FORM);
    axiosSecure
      .get("/vendor", { params: { limit: 100 } })
      .then((res) => setVendors(res?.data?.data || []))
      .catch(() => setVendors([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      assignedToType: form.assignedToType,
      ...(form.assignedToType === "employee"
        ? { assignedToEmployee: form.assignedToEmployee }
        : { assignedToVendor: form.assignedToVendor }),
      ...(form.estimatedCost !== "" ? { estimatedCost: Number(form.estimatedCost) } : {}),
      ...(form.deadline ? { deadline: form.deadline } : {}),
    };
    onSubmit(payload);
  };

  const canSubmit = form.assignedToType === "employee" ? !!form.assignedToEmployee : !!form.assignedToVendor;

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      closeOnEsc={!isSubmitting}
      title={
        <div className="flex items-center gap-2">
          <FiUserCheck className="text-brand-gold" />
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">Assign Maintenance</h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="flex items-center gap-1 p-1 bg-brand-offwhite dark:bg-brand-midnight rounded-2xl border border-brand-beige/50 dark:border-brand-dark-grey/50">
          {["employee", "vendor"].map((t) => (
            <button
              key={t}
              type="button"
              disabled={isSubmitting}
              onClick={() => setForm({ ...form, assignedToType: t, assignedToEmployee: "", assignedToVendor: "" })}
              className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                form.assignedToType === t ? "bg-brand-red text-white shadow-sm" : "text-brand-dark-grey dark:text-brand-gold-light"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {form.assignedToType === "employee" ? (
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Employee <span className="text-brand-red">*</span>
            </label>
            <select
              required
              disabled={isSubmitting}
              value={form.assignedToEmployee}
              onChange={(e) => setForm({ ...form, assignedToEmployee: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              <option value="">Select employee...</option>
              {employees.map((e) => (
                <option key={e._id} value={e._id}>{e.name} {e.employeeId ? `(${e.employeeId})` : ""}</option>
              ))}
            </select>
          </div>
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Vendor <span className="text-brand-red">*</span>
            </label>
            <select
              required
              disabled={isSubmitting}
              value={form.assignedToVendor}
              onChange={(e) => setForm({ ...form, assignedToVendor: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 cursor-pointer"
            >
              <option value="">Select vendor...</option>
              {vendors.map((v) => (
                <option key={v._id} value={v._id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Estimated Cost
            </label>
            <input
              type="number"
              min="0"
              disabled={isSubmitting}
              value={form.estimatedCost}
              onChange={(e) => setForm({ ...form, estimatedCost: e.target.value })}
              placeholder="৳0"
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Deadline
            </label>
            <input
              type="date"
              disabled={isSubmitting}
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold disabled:opacity-50 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="px-5 py-2 rounded-xl bg-brand-red text-white text-xs font-black shadow-md hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer"
          >
            {isSubmitting ? "Assigning..." : "Assign"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

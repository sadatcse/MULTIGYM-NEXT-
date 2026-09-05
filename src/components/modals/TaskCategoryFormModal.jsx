"use client";

import { useEffect, useState } from "react";
import ModalShell from "./ModalShell";
import { FiTag } from "react-icons/fi";

const EMPTY_FORM = { name: "", description: "", order: 1, status: "active" };

export default function TaskCategoryFormModal({ isOpen, onClose, onSubmit, category, isSubmitting }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const isEdit = Boolean(category);

  useEffect(() => {
    if (!isOpen) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(
      category
        ? {
            name: category.name || "",
            description: category.description || "",
            order: category.order ?? 1,
            status: category.status || "active",
          }
        : EMPTY_FORM
    );
    // Reset the form only on the closed -> open transition, not on every
    // `category` reference change, so an in-progress edit isn't wiped out
    // by an unrelated background refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSubmit({
      name: form.name.trim(),
      description: form.description.trim(),
      order: Number(form.order) || 1,
      status: form.status,
    });
  };

  return (
    <ModalShell
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      closeOnBackdrop={!isSubmitting}
      closeOnEsc={!isSubmitting}
      title={
        <div className="flex items-center gap-2">
          <FiTag className="text-brand-gold" />
          <h3 className="text-lg font-black text-brand-black dark:text-brand-white">
            {isEdit ? "Edit Task Category" : "Add New Task Category"}
          </h3>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Category Name <span className="text-brand-red">*</span>
          </label>
          <input
            type="text"
            required
            disabled={isSubmitting}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Special Audits"
            className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
            Description
          </label>
          <textarea
            rows={2}
            disabled={isSubmitting}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Category purpose..."
            className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-medium outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Display Order
            </label>
            <input
              type="number"
              min="1"
              disabled={isSubmitting}
              value={form.order}
              onChange={(e) => setForm({ ...form, order: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-wider text-brand-dark-grey dark:text-brand-gold-light">
              Status
            </label>
            <select
              disabled={isSubmitting}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none focus:ring-2 focus:ring-brand-gold/50 disabled:opacity-60 cursor-pointer"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
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
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-brand-red text-white text-xs font-black shadow-md hover:bg-brand-red-dark transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {isEdit ? "Saving..." : "Creating..."}
              </>
            ) : isEdit ? (
              "Save Changes"
            ) : (
              "Save Category"
            )}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

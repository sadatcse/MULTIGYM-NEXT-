"use client";

import { FiPlus, FiX } from "react-icons/fi";
import ReadOnlyNotice from "@/components/modals/ReadOnlyNotice";

const FULL_ACCESS = { canAdd: true, canEdit: true, canDelete: true };

// Extracted from app/dashboard/tasks/[id]/page.js.
// Receives page state/handlers as props; `permissions` (RBAC from the page)
// decides whether the form can be submitted.
export default function TaskSubtaskModal({ actionLoading, handleCreateSubtask, newSubtask, setNewSubtask, setShowAddSubtaskModal, showAddSubtaskModal, permissions = FULL_ACCESS }) {
  const allowed = permissions.canAdd || permissions.canEdit;
  return (
    <>
{showAddSubtaskModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-brand-white dark:bg-brand-charcoal w-full max-w-lg p-6 rounded-3xl border border-brand-beige/60 dark:border-brand-dark-grey/60 shadow-2xl space-y-4 max-h-[calc(100dvh-2rem)] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-brand-black dark:text-brand-white flex items-center gap-2">
                <FiPlus className="text-brand-gold" /> Add Subtask Item
              </h4>
              <button
                onClick={() => setShowAddSubtaskModal(false)}
                className="text-brand-dark-grey hover:text-brand-red"
              >
                <FiX />
              </button>
            </div>

            <form onSubmit={allowed ? handleCreateSubtask : (e) => e.preventDefault()} className="space-y-4">
{!allowed && <ReadOnlyNotice />}
              <div>
                <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                  Subtask Title *
                </label>
                <input
                  type="text"
                  required
                  value={newSubtask.title}
                  onChange={(e) => setNewSubtask({ ...newSubtask, title: e.target.value })}
                  placeholder="e.g. Audit initial documents"
                  className="w-full px-3.5 py-2.5 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={newSubtask.description}
                  onChange={(e) => setNewSubtask({ ...newSubtask, description: e.target.value })}
                  placeholder="Specific instructions for this subtask..."
                  className="w-full p-3 rounded-2xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                    Priority
                  </label>
                  <select
                    value={newSubtask.priority}
                    onChange={(e) => setNewSubtask({ ...newSubtask, priority: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="URGENT">Urgent</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-black uppercase text-brand-dark-grey block mb-1">
                    Deadline
                  </label>
                  <input
                    type="datetime-local"
                    value={newSubtask.deadline}
                    onChange={(e) => setNewSubtask({ ...newSubtask, deadline: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight border border-brand-beige/50 dark:border-brand-dark-grey/50 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSubtaskModal(false)}
                  className="px-4 py-2 rounded-xl bg-brand-offwhite dark:bg-brand-midnight text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit" hidden={!allowed}
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-xl bg-brand-gold text-brand-black text-xs font-black hover:bg-brand-gold-light cursor-pointer"
                >
                  {actionLoading ? "Adding..." : "Add Subtask"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

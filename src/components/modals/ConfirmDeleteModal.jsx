import React from "react";
import ModalShell from "./ModalShell";

const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, itemName, isDeleting }) => {
  return (
    <ModalShell isOpen={isOpen} onClose={onClose} size="sm" closeOnBackdrop={!isDeleting} closeOnEsc={!isDeleting} disableClose>
      <div className="p-6 relative overflow-hidden">
        <div className="h-1 bg-gradient-to-r from-brand-red via-brand-gold to-brand-red absolute top-0 left-0 right-0" />

        <h2 className="text-xl font-black text-brand-black dark:text-brand-white mb-2 pt-2">Confirm Deletion</h2>

        <p className="text-xs text-brand-dark-grey dark:text-brand-gold-light mb-6 leading-relaxed">
          Are you sure you want to delete <span className="font-extrabold text-brand-red">&quot;{itemName}&quot;</span>?
          This action cannot be undone.
        </p>

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold text-brand-dark-grey dark:text-brand-gold-light hover:bg-brand-beige/40 dark:hover:bg-brand-dark-grey transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="px-5 py-2.5 bg-brand-red hover:bg-brand-red-dark text-white text-xs font-bold rounded-2xl shadow-lg shadow-brand-red/25 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Deleting...</span>
              </>
            ) : (
              <span>Delete</span>
            )}
          </button>
        </div>
      </div>
    </ModalShell>
  );
};

export default ConfirmDeleteModal;

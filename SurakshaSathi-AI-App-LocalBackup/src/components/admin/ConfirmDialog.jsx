import React from "react"
import { AlertTriangle } from "lucide-react"
import Modal from "./Modal.jsx"

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  confirmVariant = "danger",
  loading = false,
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="max-w-md">
      <div className="flex items-start gap-4 py-2">
        <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center shrink-0 text-rose-400">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-[#1E293B]">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-[#131D38] hover:bg-[#1E293B] border border-[#1E293B] transition"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={loading}
          className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition ${
            confirmVariant === "danger"
              ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
              : "bg-blue-600 hover:bg-blue-500 shadow-blue-600/30"
          } disabled:opacity-60`}
        >
          {loading ? "Processing..." : confirmText}
        </button>
      </div>
    </Modal>
  )
}

import React, { useEffect } from "react"
import { X } from "lucide-react"

export default function Modal({ isOpen, onClose, title, children, maxWidth = "max-w-lg" }) {
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") onClose()
    }
    if (isOpen) {
      document.body.style.overflow = "hidden"
      window.addEventListener("keydown", handleKeyDown)
    }
    return () => {
      document.body.style.overflow = "unset"
      window.removeEventListener("keydown", handleKeyDown)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full ${maxWidth} rounded-2xl bg-[#0F172A] border border-[#1E293B] shadow-2xl p-6 text-slate-100 z-10 animate-scale-up max-h-[90vh] overflow-y-auto`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#1E293B]">
          <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-[#1E293B] transition"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4">{children}</div>
      </div>
    </div>
  )
}

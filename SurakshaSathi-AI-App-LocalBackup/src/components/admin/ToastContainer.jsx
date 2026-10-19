import React from "react"
import { useAdminNotification } from "../../contexts/AdminNotificationContext.jsx"
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from "lucide-react"

export default function ToastContainer() {
  const { toasts, removeToast } = useAdminNotification()

  if (!toasts.length) return null

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === "success"
        const isWarning = toast.type === "warning"
        const isError = toast.type === "error"

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl shadow-2xl border transition-all duration-300 animate-slide-up backdrop-blur-md ${
              isSuccess
                ? "bg-slate-900/95 border-emerald-500/40 text-slate-100"
                : isWarning
                ? "bg-slate-900/95 border-amber-500/40 text-slate-100"
                : isError
                ? "bg-slate-900/95 border-red-500/40 text-slate-100"
                : "bg-slate-900/95 border-blue-500/40 text-slate-100"
            }`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
              {isWarning && <AlertTriangle className="w-5 h-5 text-amber-400" />}
              {isError && <AlertCircle className="w-5 h-5 text-red-400" />}
              {!isSuccess && !isWarning && !isError && <Info className="w-5 h-5 text-blue-400" />}
            </div>
            <div className="flex-1 text-sm font-medium leading-snug">{toast.message}</div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-slate-400 hover:text-white p-0.5 rounded transition"
              aria-label="Close notification"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )
      })}
    </div>
  )
}
